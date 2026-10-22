-- Row Level Security. Visitantes só leem conteúdo publicado; equipe é autorizada por função.

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.customers enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.banners enable row level security;
alter table public.reviews enable row level security;
alter table public.store_settings enable row level security;

-- Perfis: cada um lê o próprio; somente admin gerencia (sem autopromoção).
create policy profiles_select_self on public.profiles for select to authenticated using (id = auth.uid() or public.has_role('admin'));
create policy profiles_admin_write on public.profiles for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

-- Categorias
create policy categories_public_read on public.categories for select to anon, authenticated using (is_active or public.has_role('admin', 'manager', 'editor'));
create policy categories_staff_write on public.categories for all to authenticated
  using (public.has_role('admin', 'editor')) with check (public.has_role('admin', 'editor'));

-- Produtos
create policy products_public_read on public.products for select to anon, authenticated
  using (status = 'published' or public.has_role('admin', 'manager', 'editor'));
create policy products_staff_write on public.products for all to authenticated
  using (public.has_role('admin', 'manager', 'editor')) with check (public.has_role('admin', 'manager', 'editor'));

create policy images_public_read on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.status = 'published') or public.has_role('admin', 'manager', 'editor'));
create policy images_staff_write on public.product_images for all to authenticated
  using (public.has_role('admin', 'manager', 'editor')) with check (public.has_role('admin', 'manager', 'editor'));

create policy variants_public_read on public.product_variants for select to anon, authenticated
  using ((is_active and exists (select 1 from public.products p where p.id = product_id and p.status = 'published')) or public.has_role('admin', 'manager', 'editor'));
create policy variants_staff_write on public.product_variants for all to authenticated
  using (public.has_role('admin', 'manager', 'editor')) with check (public.has_role('admin', 'manager', 'editor'));

-- Estoque: histórico somente leitura para gestão; escrita exclusivamente via funções.
create policy inventory_staff_read on public.inventory_movements for select to authenticated using (public.has_role('admin', 'manager'));

-- Pedidos, itens, histórico, clientes: nunca públicos. Criação ocorre via service_role (create_order).
create policy orders_staff_read on public.orders for select to authenticated using (public.has_role('admin', 'manager'));
create policy orders_staff_update on public.orders for update to authenticated
  using (public.has_role('admin', 'manager')) with check (public.has_role('admin', 'manager'));
create policy order_items_staff_read on public.order_items for select to authenticated using (public.has_role('admin', 'manager'));
create policy order_history_staff_read on public.order_status_history for select to authenticated using (public.has_role('admin', 'manager'));
create policy customers_staff_read on public.customers for select to authenticated using (public.has_role('admin', 'manager'));
create policy customers_staff_update on public.customers for update to authenticated
  using (public.has_role('admin', 'manager')) with check (public.has_role('admin', 'manager'));

-- Cupons: o público NÃO lê a tabela (validação ocorre no servidor).
create policy coupons_staff_all on public.coupons for all to authenticated
  using (public.has_role('admin', 'manager')) with check (public.has_role('admin', 'manager'));

create policy banners_public_read on public.banners for select to anon, authenticated
  using ((is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())) or public.has_role('admin', 'manager', 'editor'));
create policy banners_staff_write on public.banners for all to authenticated
  using (public.has_role('admin', 'editor')) with check (public.has_role('admin', 'editor'));

create policy reviews_public_read on public.reviews for select to anon, authenticated using (is_approved or public.has_role('admin', 'manager'));
create policy reviews_staff_write on public.reviews for all to authenticated
  using (public.has_role('admin', 'manager')) with check (public.has_role('admin', 'manager'));

create policy settings_public_read on public.store_settings for select to anon, authenticated using (true);
create policy settings_admin_update on public.store_settings for update to authenticated
  using (public.has_role('admin')) with check (public.has_role('admin'));

-- Privilégios de tabela: remove tudo de anon e libera apenas o necessário.
revoke all on all tables in schema public from anon, authenticated;
grant select on public.categories, public.products, public.product_images, public.product_variants,
  public.banners, public.reviews, public.store_settings to anon;
grant select, insert, update, delete on public.profiles, public.categories, public.products, public.product_images,
  public.product_variants, public.coupons, public.banners, public.reviews to authenticated;
grant select on public.categories, public.products, public.product_images, public.product_variants,
  public.banners, public.reviews, public.store_settings to authenticated;
grant select on public.inventory_movements, public.order_items, public.order_status_history to authenticated;
grant select, update on public.orders, public.customers to authenticated;
grant update on public.store_settings to authenticated;
grant all on all tables in schema public to service_role;
