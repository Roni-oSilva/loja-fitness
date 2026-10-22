-- Salvamento atômico de produto + imagens + variantes. SECURITY INVOKER: as políticas RLS do usuário continuam valendo.
create function public.admin_save_product(p jsonb) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v jsonb; v_vid uuid; v_keep uuid[] := '{}'; v_idx integer := 0; v_stock integer;
begin
  if not public.has_role('admin', 'manager', 'editor') then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if coalesce(jsonb_array_length(p -> 'variants'), 0) = 0 then raise exception 'NO_VARIANTS: cadastre ao menos uma variante'; end if;

  if v_id is null then
    insert into public.products (name, slug, short_description, description, category_id, base_price_cents, sale_price_cents,
      sale_starts_at, sale_ends_at, sku, status, is_featured, badge, size_guide, care_instructions, seo_title, seo_description)
    values (p ->> 'name', p ->> 'slug', p ->> 'short_description', p ->> 'description', nullif(p ->> 'category_id', '')::uuid,
      (p ->> 'base_price_cents')::integer, (p ->> 'sale_price_cents')::integer, (p ->> 'sale_starts_at')::timestamptz,
      (p ->> 'sale_ends_at')::timestamptz, p ->> 'sku', (p ->> 'status')::public.product_status, coalesce((p ->> 'is_featured')::boolean, false),
      p ->> 'badge', p ->> 'size_guide', p ->> 'care_instructions', p ->> 'seo_title', p ->> 'seo_description')
    returning id into v_id;
  else
    update public.products set name = p ->> 'name', slug = p ->> 'slug', short_description = p ->> 'short_description',
      description = p ->> 'description', category_id = nullif(p ->> 'category_id', '')::uuid,
      base_price_cents = (p ->> 'base_price_cents')::integer, sale_price_cents = (p ->> 'sale_price_cents')::integer,
      sale_starts_at = (p ->> 'sale_starts_at')::timestamptz, sale_ends_at = (p ->> 'sale_ends_at')::timestamptz,
      sku = p ->> 'sku', status = (p ->> 'status')::public.product_status, is_featured = coalesce((p ->> 'is_featured')::boolean, false),
      badge = p ->> 'badge', size_guide = p ->> 'size_guide', care_instructions = p ->> 'care_instructions',
      seo_title = p ->> 'seo_title', seo_description = p ->> 'seo_description'
    where id = v_id;
    if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
  end if;

  delete from public.product_images where product_id = v_id;
  insert into public.product_images (product_id, image_url, alt_text, sort_order)
  select v_id, i ->> 'url', coalesce(i ->> 'alt', ''), (ord - 1)::integer
  from jsonb_array_elements(coalesce(p -> 'images', '[]'::jsonb)) with ordinality as t(i, ord);

  for v in select value from jsonb_array_elements(p -> 'variants') loop
    v_vid := nullif(v ->> 'id', '')::uuid;
    if v_vid is not null then
      update public.product_variants set size = v ->> 'size', color = v ->> 'color', sku = v ->> 'sku',
        price_override_cents = (v ->> 'price_override_cents')::integer, is_active = coalesce((v ->> 'is_active')::boolean, true)
      where id = v_vid and product_id = v_id;
      if not found then raise exception 'VARIANT_NOT_FOUND'; end if;
    else
      insert into public.product_variants (product_id, size, color, sku, price_override_cents, is_active)
      values (v_id, v ->> 'size', v ->> 'color', v ->> 'sku', (v ->> 'price_override_cents')::integer, coalesce((v ->> 'is_active')::boolean, true))
      returning id into v_vid;
      v_stock := coalesce((v ->> 'initial_stock')::integer, 0);
      if v_stock > 0 and public.has_role('admin', 'manager') then
        perform public.admin_adjust_stock(v_vid, v_stock, 'entry', 'Estoque inicial');
      end if;
    end if;
    v_keep := v_keep || v_vid;
  end loop;

  -- variantes removidas do formulário são desativadas (o histórico de estoque/pedidos é preservado)
  update public.product_variants set is_active = false where product_id = v_id and not (id = any (v_keep));
  return v_id;
end $$;
revoke all on function public.admin_save_product(jsonb) from public, anon;
grant execute on function public.admin_save_product(jsonb) to authenticated;
