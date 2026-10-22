-- Schema base da loja fitness. Valores monetários em CENTAVOS (integer) — nunca ponto flutuante.

create type public.user_role as enum ('admin', 'manager', 'editor');
create type public.product_status as enum ('draft', 'published', 'archived');
create type public.order_status as enum (
  'pending_contact', 'awaiting_confirmation', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
);
create type public.discount_type as enum ('percent', 'fixed');
create type public.movement_type as enum ('entry', 'exit', 'adjustment', 'order_commit', 'order_release');

create function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- Perfis de equipe: só existem para usuários administrativos (não há cadastro público).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  role public.user_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (char_length(description) <= 500),
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index categories_active_sort_idx on public.categories (is_active, sort_order);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 140),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_description text check (char_length(short_description) <= 280),
  description text check (char_length(description) <= 8000),
  category_id uuid references public.categories (id) on delete set null,
  base_price_cents integer not null check (base_price_cents >= 0),
  sale_price_cents integer check (sale_price_cents is null or (sale_price_cents >= 0 and sale_price_cents < base_price_cents)),
  sale_starts_at timestamptz,
  sale_ends_at timestamptz,
  sku text unique,
  status public.product_status not null default 'draft',
  is_featured boolean not null default false,
  badge text check (char_length(badge) <= 24),
  size_guide text check (char_length(size_guide) <= 4000),
  care_instructions text check (char_length(care_instructions) <= 2000),
  is_demo boolean not null default false,
  seo_title text check (char_length(seo_title) <= 70),
  seo_description text check (char_length(seo_description) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sale_ends_at is null or sale_starts_at is null or sale_ends_at > sale_starts_at)
);
create index products_status_idx on public.products (status, created_at desc);
create index products_category_idx on public.products (category_id) where status = 'published';
create index products_featured_idx on public.products (is_featured) where status = 'published';
create index products_name_idx on public.products (lower(name));

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  image_url text not null,
  alt_text text not null default '' check (char_length(alt_text) <= 200),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, sort_order);

-- Todo produto tem ao menos uma variante; produtos sem opções usam uma variante com size/color nulos.
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text unique,
  size text check (char_length(size) <= 20),
  color text check (char_length(color) <= 40),
  price_override_cents integer check (price_override_cents is null or price_override_cents >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index product_variants_combo_idx
  on public.product_variants (product_id, coalesce(lower(size), ''), coalesce(lower(color), ''));
create index product_variants_product_idx on public.product_variants (product_id) where is_active;

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id) on delete restrict,
  movement_type public.movement_type not null,
  quantity_delta integer not null check (quantity_delta <> 0),
  stock_after integer not null check (stock_after >= 0),
  reason text not null check (char_length(reason) between 3 and 300),
  reference_id uuid,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index inventory_movements_variant_idx on public.inventory_movements (variant_id, created_at desc);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  phone text check (phone is null or phone ~ '^[0-9]{10,15}$'),
  email text check (email is null or char_length(email) <= 254),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index customers_phone_idx on public.customers (phone) where phone is not null;

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code) and code ~ '^[A-Z0-9_-]{3,32}$'),
  discount_type public.discount_type not null,
  discount_value integer not null check (discount_value > 0),
  minimum_order_cents integer not null default 0 check (minimum_order_cents >= 0),
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  usage_count integer not null default 0 check (usage_count >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  eligible_product_ids uuid[] not null default '{}',
  eligible_category_ids uuid[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount_type <> 'percent' or discount_value <= 100),
  check (usage_limit is null or usage_count <= usage_limit)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.customers (id) on delete set null,
  status public.order_status not null default 'pending_contact',
  subtotal_cents integer not null check (subtotal_cents >= 0),
  discount_total_cents integer not null default 0 check (discount_total_cents >= 0),
  shipping_cents integer check (shipping_cents is null or shipping_cents >= 0),
  grand_total_cents integer not null check (grand_total_cents >= 0),
  coupon_id uuid references public.coupons (id) on delete set null,
  coupon_code_snapshot text,
  customer_notes text check (char_length(customer_notes) <= 500),
  admin_notes text check (char_length(admin_notes) <= 2000),
  access_token_hash text not null,
  idempotency_key text not null unique check (char_length(idempotency_key) between 16 and 100),
  stock_committed boolean not null default false,
  payment_received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount_total_cents <= subtotal_cents)
);
create index orders_status_created_idx on public.orders (status, created_at desc);
create index orders_created_idx on public.orders (created_at desc);
create index orders_customer_idx on public.orders (customer_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name_snapshot text not null,
  sku_snapshot text,
  size_snapshot text,
  color_snapshot text,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity between 1 and 99),
  line_total_cents integer not null check (line_total_cents >= 0),
  check (line_total_cents = unit_price_cents * quantity)
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  previous_status public.order_status,
  new_status public.order_status not null,
  changed_by uuid references auth.users (id) on delete set null,
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history (order_id, created_at);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 120),
  subtitle text check (char_length(subtitle) <= 300),
  image_desktop text,
  image_mobile text,
  button_label text check (char_length(button_label) <= 40),
  target_url text check (target_url is null or target_url ~ '^(/[^/\\]|/$|https://)'),
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create index banners_active_idx on public.banners (is_active, sort_order);

-- Avaliações reais (estrutura pronta; sem moderação aprovada nada é exibido).
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete cascade,
  author_name text not null check (char_length(author_name) between 2 and 80),
  rating integer not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index reviews_approved_idx on public.reviews (is_approved, created_at desc);

-- Configurações tipadas (linha única). Nenhum segredo é armazenado aqui: tudo é público ao visitante.
create table public.store_settings (
  id boolean primary key default true check (id),
  store_name text not null default 'Minha Loja Fitness' check (char_length(store_name) between 2 and 60),
  tagline text check (char_length(tagline) <= 160),
  logo_url text,
  favicon_url text,
  theme_primary text not null default '#FF5A1F' check (theme_primary ~ '^#[0-9A-Fa-f]{6}$'),
  theme_accent text not null default '#B8F531' check (theme_accent ~ '^#[0-9A-Fa-f]{6}$'),
  theme_dark text not null default '#111318' check (theme_dark ~ '^#[0-9A-Fa-f]{6}$'),
  whatsapp_number text check (whatsapp_number is null or whatsapp_number ~ '^[0-9]{10,15}$'),
  contact_email text check (char_length(contact_email) <= 254),
  address text check (char_length(address) <= 300),
  instagram_url text check (instagram_url is null or instagram_url ~ '^https://'),
  facebook_url text check (facebook_url is null or facebook_url ~ '^https://'),
  tiktok_url text check (tiktok_url is null or tiktok_url ~ '^https://'),
  youtube_url text check (youtube_url is null or youtube_url ~ '^https://'),
  promo_bar_enabled boolean not null default false,
  promo_bar_text text check (char_length(promo_bar_text) <= 160),
  promo_bar_link text check (promo_bar_link is null or promo_bar_link ~ '^(/[^/\\]|/$|https://)'),
  free_shipping_threshold_cents integer check (free_shipping_threshold_cents is null or free_shipping_threshold_cents > 0),
  delivery_info text check (char_length(delivery_info) <= 2000),
  returns_text text check (char_length(returns_text) <= 12000),
  privacy_text text check (char_length(privacy_text) <= 20000),
  terms_text text check (char_length(terms_text) <= 20000),
  hero_title text not null default 'SEU PRÓXIMO NÍVEL COMEÇA AQUI.' check (char_length(hero_title) <= 120),
  hero_subtitle text not null default 'Roupas, acessórios e equipamentos para acompanhar cada treino, superar limites e transformar sua rotina.' check (char_length(hero_subtitle) <= 300),
  hero_cta_label text not null default 'COMPRAR AGORA' check (char_length(hero_cta_label) <= 40),
  hero_cta_link text not null default '/produtos' check (hero_cta_link ~ '^(/[^/\\]|/$|https://)'),
  hero_secondary_label text not null default 'EXPLORAR COLEÇÃO' check (char_length(hero_secondary_label) <= 40),
  hero_secondary_link text not null default '/produtos?ordem=novidades' check (hero_secondary_link ~ '^(/[^/\\]|/$|https://)'),
  hero_image_url text,
  hero_image_mobile_url text,
  featured_title text not null default 'Em destaque' check (char_length(featured_title) <= 60),
  benefits jsonb not null default '[]' check (jsonb_typeof(benefits) = 'array' and jsonb_array_length(benefits) <= 8),
  editorial jsonb not null default '[]' check (jsonb_typeof(editorial) = 'array' and jsonb_array_length(editorial) <= 4),
  social_gallery jsonb not null default '[]' check (jsonb_typeof(social_gallery) = 'array' and jsonb_array_length(social_gallery) <= 8),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  seo_title text check (char_length(seo_title) <= 70),
  seo_description text check (char_length(seo_description) <= 160),
  updated_at timestamptz not null default now()
);
insert into public.store_settings (id) values (true);

-- updated_at automático
do $$
declare t text;
begin
  foreach t in array array['profiles','categories','products','product_variants','customers','coupons','orders','banners','store_settings']
  loop
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;
