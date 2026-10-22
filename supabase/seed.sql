-- Dados de DEMONSTRAÇÃO (idempotente). Produtos marcados com is_demo = true. Preços e imagens são ilustrativos.
-- Execute apenas em ambientes de teste/homologação ou antes do cadastro real; exclua os produtos demo pelo painel (arquivar) ao lançar.

insert into public.categories (name, slug, description, sort_order) values
  ('Roupas masculinas', 'roupas-masculinas', 'Peças para treinar com conforto.', 10),
  ('Roupas femininas', 'roupas-femininas', 'Peças para treinar com conforto.', 20),
  ('Camisetas e regatas', 'camisetas-e-regatas', null, 30),
  ('Leggings e shorts', 'leggings-e-shorts', null, 40),
  ('Tênis esportivos', 'tenis-esportivos', null, 50),
  ('Luvas e munhequeiras', 'luvas-e-munhequeiras', null, 60),
  ('Garrafas e acessórios', 'garrafas-e-acessorios', null, 70),
  ('Equipamentos de treino', 'equipamentos-de-treino', null, 80)
on conflict (slug) do nothing;

do $$
declare
  p record; v_id uuid; v_cat uuid; s text; c text; v_sizes text[]; v_colors text[]; v_var uuid; v_n integer;
begin
  perform set_config('app.stock_write', '1', true);
  for p in select * from (values
    ('Camiseta Dry Fit (demo)',   'camiseta-dry-fit-demo',   'roupas-masculinas',   8990,  null::int, 'camiseta', 'Novo',    array['P','M','G','GG'], array['Preto','Branco'], true),
    ('Regata Treino (demo)',      'regata-treino-demo',      'camisetas-e-regatas', 6990,  5490,      'regata',   null,      array['P','M','G'],      array['Laranja'],         false),
    ('Legging Cintura Alta (demo)','legging-cintura-alta-demo','leggings-e-shorts', 12990, 9990,      'legging',  null,      array['P','M','G'],      array['Grafite'],         true),
    ('Short de Treino (demo)',    'short-de-treino-demo',    'roupas-masculinas',   7990,  null,      'short',    null,      array['M','G','GG'],     array['Preto'],           false),
    ('Tênis de Corrida (demo)',   'tenis-de-corrida-demo',   'tenis-esportivos',    34990, null,      'tenis',    'Lançamento', array['38','39','40','41','42'], array['Laranja'], true),
    ('Luvas de Treino (demo)',    'luvas-de-treino-demo',    'luvas-e-munhequeiras',4990,  null,      'luva',     null,      array['P','M','G'],      array['Grafite'],         false),
    ('Garrafa 750 ml (demo)',     'garrafa-750ml-demo',      'garrafas-e-acessorios',3990, null,      'garrafa',  null,      array[]::text[],         array[]::text[],          false),
    ('Halter Ajustável (demo)',   'halter-ajustavel-demo',   'equipamentos-de-treino',19990,null,     'halter',   null,      array[]::text[],         array[]::text[],          false)
  ) as t(name, slug, cat, price, sale, img, badge, sizes, colors, featured)
  loop
    if exists (select 1 from public.products where slug = p.slug) then continue; end if;
    select id into v_cat from public.categories where slug = p.cat;
    insert into public.products (name, slug, short_description, description, category_id, base_price_cents, sale_price_cents, status, is_featured, badge, is_demo, size_guide, care_instructions)
    values (p.name, p.slug, 'Produto de demonstração — substitua pelos produtos reais da loja.',
      'Produto de demonstração com preço e imagem ilustrativos. Não representa um item real à venda.',
      v_cat, p.price, p.sale, 'published', p.featured, p.badge, true,
      case when array_length(p.sizes, 1) > 0 then 'Tabela de medidas de exemplo: consulte as medidas reais do fabricante.' end,
      case when p.img in ('camiseta','regata','legging','short','luva') then 'Lavar à mão ou à máquina em ciclo delicado. Não usar alvejante.' end)
    returning id into v_id;
    insert into public.product_images (product_id, image_url, alt_text, sort_order) values (v_id, '/demo/' || p.img || '.svg', p.name || ' (imagem demonstrativa)', 0);

    v_sizes := case when array_length(p.sizes, 1) is null then array[null]::text[] else p.sizes end;
    v_colors := case when array_length(p.colors, 1) is null then array[null]::text[] else p.colors end;
    v_n := 0;
    foreach s in array v_sizes loop
      foreach c in array v_colors loop
        v_n := v_n + 1;
        insert into public.product_variants (product_id, sku, size, color, stock_quantity)
        values (v_id, upper(left(p.img, 3)) || '-DEMO-' || v_n, s, c, case when v_n % 5 = 0 then 0 when v_n % 4 = 0 then 3 else 10 end)
        returning id into v_var;
        insert into public.inventory_movements (variant_id, movement_type, quantity_delta, stock_after, reason)
        select v_var, 'entry', stock_quantity, stock_quantity, 'Estoque inicial de demonstração' from public.product_variants where id = v_var and stock_quantity > 0;
      end loop;
    end loop;
  end loop;
  perform set_config('app.stock_write', '', true);
end $$;

update public.store_settings set
  store_name = 'Ana Fitness', logo_url = '/brand/ana-fitness-logo.png',
  theme_primary = '#A5C910', theme_accent = '#E4F58A', theme_dark = '#0B102D',
  tagline = 'Roupas, acessórios e equipamentos para o seu treino.',
  benefits = '[{"title":"Compra simples","description":"Escolha os produtos e finalize em poucos toques."},{"title":"Atendimento pelo WhatsApp","description":"Confirmamos disponibilidade, frete e pagamento com você."},{"title":"Trocas e devoluções","description":"Consulte a política da loja antes de comprar."}]'::jsonb,
  editorial = '[{"title":"VISTA SUA EVOLUÇÃO.","text":"Peças pensadas para acompanhar o seu treino.","image_url":null,"link":"/produtos"},{"title":"EQUIPAMENTO CERTO. FOCO TOTAL.","text":"Acessórios e equipamentos para a sua rotina.","image_url":null,"link":"/produtos"}]'::jsonb
where id = true and benefits = '[]'::jsonb;

insert into public.banners (title, subtitle, button_label, target_url, sort_order, is_active)
select 'Banner de demonstração', 'Edite ou desative este banner em Admin > Banners.', 'Ver produtos', '/produtos', 0, true
where not exists (select 1 from public.banners);
