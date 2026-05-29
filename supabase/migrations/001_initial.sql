-- FurnishAR initial schema

create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Listings
create type listing_status as enum ('processing', 'live', 'sold', 'failed', 'draft');
create type job_status as enum ('queued', 'generating', 'complete', 'failed');
create type photo_label as enum ('front', 'back', 'left', 'right');

create table public.listings (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  price_cents integer not null check (price_cents >= 0),
  category text not null,
  width_cm numeric(8,2),
  depth_cm numeric(8,2),
  height_cm numeric(8,2),
  location text,
  status listing_status not null default 'processing',
  glb_url text,
  poster_url text,
  qr_path text,
  views_count integer not null default 0,
  ar_sessions_count integer not null default 0,
  enquiries_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.listing_photos (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  label photo_label not null,
  storage_path text not null,
  public_url text not null,
  created_at timestamptz not null default now(),
  unique (listing_id, label)
);

create table public.processing_jobs (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade unique,
  status job_status not null default 'queued',
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_updated_at before update on public.listings
  for each row execute procedure public.set_updated_at();

create trigger jobs_updated_at before update on public.processing_jobs
  for each row execute procedure public.set_updated_at();

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_photos enable row level security;
alter table public.processing_jobs enable row level security;

-- Profiles: users read/update own
create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Listings: live listings public; sellers manage own
create policy "Live listings are public" on public.listings
  for select using (status = 'live' or auth.uid() = seller_id);

create policy "Sellers insert own listings" on public.listings
  for insert with check (auth.uid() = seller_id);

create policy "Sellers update own listings" on public.listings
  for update using (auth.uid() = seller_id);

create policy "Sellers delete own listings" on public.listings
  for delete using (auth.uid() = seller_id);

-- Photos: public for live listings
create policy "Photos for live listings are public" on public.listing_photos
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and (l.status = 'live' or l.seller_id = auth.uid())
    )
  );

create policy "Sellers insert photos for own listings" on public.listing_photos
  for insert with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.seller_id = auth.uid()
    )
  );

-- Jobs: sellers see own
create policy "Sellers view own jobs" on public.processing_jobs
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.seller_id = auth.uid()
    )
  );

-- Storage buckets (run in Supabase dashboard or via API)
-- listings bucket: public read for model.glb and photos

-- Indexes
create index listings_status_idx on public.listings(status);
create index listings_seller_idx on public.listings(seller_id);
create index listings_category_idx on public.listings(category);
create index jobs_status_idx on public.processing_jobs(status);

-- Increment view counter (callable via RPC)
create or replace function public.increment_listing_views(listing_uuid uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.listings
  set views_count = views_count + 1
  where id = listing_uuid and status = 'live';
end;
$$;

create or replace function public.increment_listing_ar_sessions(listing_uuid uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.listings
  set ar_sessions_count = ar_sessions_count + 1
  where id = listing_uuid and status = 'live';
end;
$$;

create or replace function public.increment_listing_enquiries(listing_uuid uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.listings
  set enquiries_count = enquiries_count + 1
  where id = listing_uuid;
end;
$$;

grant execute on function public.increment_listing_views(uuid) to anon, authenticated;
grant execute on function public.increment_listing_ar_sessions(uuid) to anon, authenticated;
grant execute on function public.increment_listing_enquiries(uuid) to anon, authenticated;
