-- Funções de negócio. Mutações críticas (estoque, status, pedidos) só ocorrem por aqui.

create function public.has_role(variadic roles text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text = any (roles));
$$;
revoke all on function public.has_role(text[]) from public;
grant execute on function public.has_role(text[]) to anon, authenticated, service_role;

-- Preço vigente (centavos): override da variante > promoção válida > preço base.
create function public.effective_price_cents(p public.products, v public.product_variants) returns integer
language sql stable as $$
  select coalesce(
    v.price_override_cents,
    case when p.sale_price_cents is not null
          and (p.sale_starts_at is null or p.sale_starts_at <= now())
          and (p.sale_ends_at is null or p.sale_ends_at > now())
         then p.sale_price_cents end,
    p.base_price_cents);
$$;

-- ===== Estoque =====
create function public.guard_variant_stock() returns trigger language plpgsql as $$
begin
  if new.stock_quantity is distinct from old.stock_quantity
     and coalesce(current_setting('app.stock_write', true), '') <> '1' then
    raise exception 'STOCK_WRITE_FORBIDDEN: use movimentações de estoque' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger product_variants_guard_stock before update on public.product_variants
  for each row execute function public.guard_variant_stock();

create function public.guard_variant_insert_stock() returns trigger language plpgsql as $$
begin
  if new.stock_quantity <> 0 and coalesce(current_setting('app.stock_write', true), '') <> '1' then
    raise exception 'STOCK_WRITE_FORBIDDEN: crie a variante com estoque 0 e registre uma entrada' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger product_variants_guard_stock_ins before insert on public.product_variants
  for each row execute function public.guard_variant_insert_stock();

create function public.block_inventory_mutation() returns trigger language plpgsql as $$
begin
  raise exception 'Histórico de estoque é imutável; registre uma nova movimentação' using errcode = '42501';
end $$;
create trigger inventory_movements_immutable before update or delete on public.inventory_movements
  for each row execute function public.block_inventory_mutation();

-- Interna: aplica movimentação com lock de linha e sem permitir saldo negativo.
create function public._apply_stock_movement(
  p_variant uuid, p_delta integer, p_type public.movement_type, p_reason text, p_ref uuid, p_user uuid
) returns integer language plpgsql security definer set search_path = public as $$
declare v_new integer;
begin
  if p_delta = 0 then raise exception 'INVALID_QUANTITY: quantidade zero'; end if;
  select stock_quantity into v_new from public.product_variants where id = p_variant for update;
  if not found then raise exception 'VARIANT_NOT_FOUND:%', p_variant; end if;
  v_new := v_new + p_delta;
  if v_new < 0 then raise exception 'OUT_OF_STOCK:%', p_variant using errcode = '23514'; end if;
  perform set_config('app.stock_write', '1', true);
  update public.product_variants set stock_quantity = v_new where id = p_variant;
  insert into public.inventory_movements (variant_id, movement_type, quantity_delta, stock_after, reason, reference_id, created_by)
  values (p_variant, p_type, p_delta, v_new, p_reason, p_ref, p_user);
  perform set_config('app.stock_write', '', true);
  return v_new;
end $$;
revoke all on function public._apply_stock_movement(uuid, integer, public.movement_type, text, uuid, uuid) from public, anon, authenticated;

create function public.admin_adjust_stock(p_variant uuid, p_delta integer, p_type public.movement_type, p_reason text)
returns integer language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role('admin', 'manager') then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if p_type not in ('entry', 'exit', 'adjustment') then raise exception 'INVALID_TYPE'; end if;
  if p_type = 'entry' and p_delta <= 0 then raise exception 'INVALID_QUANTITY: entrada deve ser positiva'; end if;
  if p_type = 'exit' and p_delta >= 0 then raise exception 'INVALID_QUANTITY: saída deve ser negativa'; end if;
  if p_reason is null or char_length(btrim(p_reason)) < 3 then raise exception 'INVALID_REASON: informe o motivo'; end if;
  return public._apply_stock_movement(p_variant, p_delta, p_type, btrim(p_reason), null, auth.uid());
end $$;
revoke all on function public.admin_adjust_stock(uuid, integer, public.movement_type, text) from public, anon;
grant execute on function public.admin_adjust_stock(uuid, integer, public.movement_type, text) to authenticated;

-- ===== Pedidos =====
create function public.guard_order_status() returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status
     and coalesce(current_setting('app.order_write', true), '') <> '1' then
    raise exception 'STATUS_WRITE_FORBIDDEN: use admin_set_order_status' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger orders_guard_status before update on public.orders
  for each row execute function public.guard_order_status();

create function public.order_transition_allowed(p_from public.order_status, p_to public.order_status) returns boolean
language sql immutable as $$
  select case p_from
    when 'pending_contact' then p_to in ('awaiting_confirmation', 'confirmed', 'cancelled')
    when 'awaiting_confirmation' then p_to in ('confirmed', 'cancelled')
    when 'confirmed' then p_to in ('processing', 'cancelled')
    when 'processing' then p_to in ('shipped', 'cancelled')
    when 'shipped' then p_to in ('delivered', 'cancelled')
    else false end;
$$;

create function public.admin_set_order_status(p_order uuid, p_new public.order_status, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare o public.orders; it record;
begin
  if not public.has_role('admin', 'manager') then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if not public.order_transition_allowed(o.status, p_new) then
    raise exception 'INVALID_TRANSITION:% -> %', o.status, p_new;
  end if;
  perform set_config('app.order_write', '1', true);

  -- Estoque é baixado UMA vez, na confirmação, e devolvido se um pedido confirmado for cancelado.
  if p_new = 'confirmed' and not o.stock_committed then
    for it in select variant_id, quantity from public.order_items where order_id = o.id and variant_id is not null order by variant_id loop
      perform public._apply_stock_movement(it.variant_id, -it.quantity, 'order_commit', 'Pedido ' || o.order_number || ' confirmado', o.id, auth.uid());
    end loop;
    update public.orders set stock_committed = true where id = o.id;
  elsif p_new = 'cancelled' then
    if o.stock_committed then
      for it in select variant_id, quantity from public.order_items where order_id = o.id and variant_id is not null order by variant_id loop
        perform public._apply_stock_movement(it.variant_id, it.quantity, 'order_release', 'Pedido ' || o.order_number || ' cancelado', o.id, auth.uid());
      end loop;
      update public.orders set stock_committed = false where id = o.id;
    end if;
    if o.coupon_id is not null then
      update public.coupons set usage_count = greatest(usage_count - 1, 0) where id = o.coupon_id;
    end if;
  end if;

  update public.orders set status = p_new where id = o.id;
  perform set_config('app.order_write', '', true);
  insert into public.order_status_history (order_id, previous_status, new_status, changed_by, note)
  values (o.id, o.status, p_new, auth.uid(), nullif(btrim(p_note), ''));
end $$;
revoke all on function public.admin_set_order_status(uuid, public.order_status, text) from public, anon;
grant execute on function public.admin_set_order_status(uuid, public.order_status, text) to authenticated;

-- Criação atômica do pedido. Executável SOMENTE pelo servidor (service_role).
-- O servidor calcula descontos; aqui os preços unitários, a disponibilidade e o cupom são revalidados.
create function public.create_order(p jsonb) returns table (order_id uuid, order_number text, deduplicated boolean)
language plpgsql security definer set search_path = public as $$
declare
  v_existing public.orders;
  v_customer uuid;
  v_phone text := nullif(p #>> '{customer,phone}', '');
  v_name text := nullif(btrim(p #>> '{customer,name}'), '');
  v_email text := nullif(btrim(p #>> '{customer,email}'), '');
  v_item jsonb; v_var public.product_variants; v_prod public.products;
  v_qty integer; v_price integer;
  v_subtotal integer := 0; v_discount integer := coalesce((p ->> 'discount_cents')::integer, 0);
  v_coupon public.coupons; v_coupon_id uuid := nullif(p ->> 'coupon_id', '')::uuid;
  v_shipping integer := (p ->> 'shipping_cents')::integer;
  v_id uuid := gen_random_uuid(); v_number text; v_tries integer := 0;
  v_lines jsonb := '[]'::jsonb;
begin
  select * into v_existing from public.orders where idempotency_key = p ->> 'idempotency_key';
  if found then
    return query select v_existing.id, v_existing.order_number, true; return;
  end if;
  if jsonb_array_length(p -> 'items') = 0 then raise exception 'EMPTY_CART'; end if;

  -- itens (ordenados por variante para evitar deadlocks entre pedidos simultâneos)
  for v_item in select value from jsonb_array_elements(p -> 'items') order by value ->> 'variant_id' loop
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 99 then raise exception 'INVALID_QUANTITY'; end if;
    select * into v_var from public.product_variants where id = (v_item ->> 'variant_id')::uuid for share;
    if not found or not v_var.is_active then raise exception 'VARIANT_UNAVAILABLE:%', v_item ->> 'variant_id'; end if;
    select * into v_prod from public.products where id = v_var.product_id;
    if v_prod.status <> 'published' then raise exception 'VARIANT_UNAVAILABLE:%', v_var.id; end if;
    if v_var.stock_quantity < v_qty then raise exception 'OUT_OF_STOCK:%', v_var.id; end if;
    v_price := public.effective_price_cents(v_prod, v_var);
    if v_price <> (v_item ->> 'unit_price_cents')::integer then raise exception 'PRICE_CHANGED:%', v_var.id; end if;
    v_subtotal := v_subtotal + v_price * v_qty;
    v_lines := v_lines || jsonb_build_object('var', v_var.id, 'prod', v_prod.id, 'name', v_prod.name,
      'sku', coalesce(v_var.sku, v_prod.sku), 'size', v_var.size, 'color', v_var.color, 'price', v_price, 'qty', v_qty);
  end loop;

  if v_coupon_id is not null then
    select * into v_coupon from public.coupons where id = v_coupon_id for update;
    if not found or not v_coupon.is_active
       or (v_coupon.starts_at is not null and v_coupon.starts_at > now())
       or (v_coupon.expires_at is not null and v_coupon.expires_at <= now())
       or (v_coupon.usage_limit is not null and v_coupon.usage_count >= v_coupon.usage_limit)
       or v_subtotal < v_coupon.minimum_order_cents then
      raise exception 'COUPON_INVALID';
    end if;
    update public.coupons set usage_count = usage_count + 1 where id = v_coupon_id;
  elsif v_discount <> 0 then
    raise exception 'DISCOUNT_WITHOUT_COUPON';
  end if;
  if v_discount < 0 or v_discount > v_subtotal then raise exception 'INVALID_DISCOUNT'; end if;

  if v_phone is not null then
    insert into public.customers (name, phone, email) values (coalesce(v_name, 'Cliente'), v_phone, v_email)
    on conflict (phone) where phone is not null
    do update set name = coalesce(v_name, public.customers.name), email = coalesce(v_email, public.customers.email)
    returning id into v_customer;
  elsif v_name is not null then
    insert into public.customers (name, email) values (v_name, v_email) returning id into v_customer;
  end if;

  loop
    v_number := 'LF-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    exit when not exists (select 1 from public.orders where public.orders.order_number = v_number);
    v_tries := v_tries + 1; if v_tries > 5 then raise exception 'ORDER_NUMBER_FAILED'; end if;
  end loop;

  insert into public.orders (id, order_number, customer_id, status, subtotal_cents, discount_total_cents, shipping_cents,
    grand_total_cents, coupon_id, coupon_code_snapshot, customer_notes, access_token_hash, idempotency_key)
  values (v_id, v_number, v_customer, 'pending_contact', v_subtotal, v_discount, v_shipping,
    v_subtotal - v_discount + coalesce(v_shipping, 0), v_coupon_id, v_coupon.code,
    nullif(btrim(p ->> 'customer_notes'), ''), p ->> 'access_token_hash', p ->> 'idempotency_key');

  insert into public.order_items (order_id, product_id, variant_id, product_name_snapshot, sku_snapshot, size_snapshot,
    color_snapshot, unit_price_cents, quantity, line_total_cents)
  select v_id, (l ->> 'prod')::uuid, (l ->> 'var')::uuid, l ->> 'name', l ->> 'sku', l ->> 'size', l ->> 'color',
    (l ->> 'price')::integer, (l ->> 'qty')::integer, (l ->> 'price')::integer * (l ->> 'qty')::integer
  from jsonb_array_elements(v_lines) l;

  insert into public.order_status_history (order_id, previous_status, new_status, note)
  values (v_id, null, 'pending_contact', 'Pedido registrado pelo site');

  return query select v_id, v_number, false;
exception when unique_violation then
  -- corrida na mesma chave de idempotência: devolve o pedido já criado
  select * into v_existing from public.orders where idempotency_key = p ->> 'idempotency_key';
  if found then return query select v_existing.id, v_existing.order_number, true; return; end if;
  raise;
end $$;
revoke all on function public.create_order(jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb) to service_role;

-- ===== Dashboard =====
create function public.admin_dashboard(p_from timestamptz, p_to timestamptz) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb; v_threshold integer;
begin
  if not public.has_role('admin', 'manager') then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select low_stock_threshold into v_threshold from public.store_settings;
  select jsonb_build_object(
    'orders_total', (select count(*) from public.orders where created_at >= p_from and created_at < p_to),
    'orders_pending_contact', (select count(*) from public.orders where created_at >= p_from and created_at < p_to and status = 'pending_contact'),
    'orders_confirmed', (select count(*) from public.orders where created_at >= p_from and created_at < p_to and status in ('confirmed','processing','shipped','delivered')),
    'created_value_cents', (select coalesce(sum(grand_total_cents), 0) from public.orders where created_at >= p_from and created_at < p_to and status <> 'cancelled'),
    'confirmed_value_cents', (select coalesce(sum(grand_total_cents), 0) from public.orders where created_at >= p_from and created_at < p_to and status in ('confirmed','processing','shipped','delivered')),
    'received_value_cents', (select coalesce(sum(grand_total_cents), 0) from public.orders where created_at >= p_from and created_at < p_to and payment_received_at is not null and status <> 'cancelled'),
    'products_total', (select count(*) from public.products where status <> 'archived'),
    'products_unavailable', (select count(*) from public.products p where p.status = 'published'
        and not exists (select 1 from public.product_variants v where v.product_id = p.id and v.is_active and v.stock_quantity > 0)),
    'variants_low_stock', (select count(*) from public.product_variants v join public.products p on p.id = v.product_id
        where p.status <> 'archived' and v.is_active and v.stock_quantity > 0 and v.stock_quantity <= v_threshold),
    'series', coalesce((select jsonb_agg(x order by x ->> 'day') from (
        select jsonb_build_object('day', to_char(created_at at time zone 'America/Sao_Paulo', 'YYYY-MM-DD'),
               'confirmed_cents', sum(grand_total_cents), 'orders', count(*)) x
        from public.orders where created_at >= p_from and created_at < p_to and status in ('confirmed','processing','shipped','delivered')
        group by to_char(created_at at time zone 'America/Sao_Paulo', 'YYYY-MM-DD')) s), '[]'::jsonb),
    'top_products', coalesce((select jsonb_agg(x) from (
        select jsonb_build_object('name', i.product_name_snapshot, 'quantity', sum(i.quantity)) x
        from public.order_items i join public.orders o on o.id = i.order_id
        where o.created_at >= p_from and o.created_at < p_to and o.status in ('confirmed','processing','shipped','delivered')
        group by i.product_name_snapshot order by sum(i.quantity) desc limit 5) t), '[]'::jsonb)
  ) into r;
  return r;
end $$;
revoke all on function public.admin_dashboard(timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_dashboard(timestamptz, timestamptz) to authenticated;
