-- Identidade Ana Fitness (navy + verde-limão) e política de gestão editável.
alter table public.store_settings add column management_text text check (char_length(management_text) <= 20000);

alter table public.store_settings alter column store_name set default 'Ana Fitness';
alter table public.store_settings alter column theme_primary set default '#A5C910';
alter table public.store_settings alter column theme_accent set default '#E4F58A';
alter table public.store_settings alter column theme_dark set default '#0B102D';

-- Atualiza a linha existente apenas se ainda estiver com os valores provisórios antigos.
update public.store_settings set
  store_name = case when store_name = 'Minha Loja Fitness' then 'Ana Fitness' else store_name end,
  theme_primary = case when theme_primary = '#FF5A1F' then '#A5C910' else theme_primary end,
  theme_accent = case when theme_accent = '#B8F531' then '#E4F58A' else theme_accent end,
  theme_dark = case when theme_dark = '#111318' then '#0B102D' else theme_dark end,
  logo_url = coalesce(logo_url, '/brand/ana-fitness-logo.png')
where id = true;
