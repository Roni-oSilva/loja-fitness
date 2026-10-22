-- Bucket público de mídia (leitura pública por URL); escrita apenas pela equipe.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy media_staff_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.has_role('admin', 'manager', 'editor'));
create policy media_staff_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.has_role('admin', 'manager', 'editor'));
create policy media_staff_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.has_role('admin', 'manager', 'editor'));
