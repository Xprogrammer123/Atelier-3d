-- Run after creating bucket "listings" (public) in Supabase Storage dashboard

insert into storage.buckets (id, name, public)
values ('listings', 'listings', true)
on conflict (id) do update set public = true;

create policy "Public read listings storage"
on storage.objects for select
using (bucket_id = 'listings');

create policy "Authenticated upload listings"
on storage.objects for insert
with check (
  bucket_id = 'listings'
  and auth.role() = 'authenticated'
);

create policy "Owners update own listing files"
on storage.objects for update
using (
  bucket_id = 'listings'
  and auth.role() = 'authenticated'
);

create policy "Owners delete own listing files"
on storage.objects for delete
using (
  bucket_id = 'listings'
  and auth.role() = 'authenticated'
);
