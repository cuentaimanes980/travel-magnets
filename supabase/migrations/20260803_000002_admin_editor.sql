-- Editorial review state, administrator membership and write policies.

create extension if not exists pgcrypto;

alter table public.media
  add column if not exists review_status text not null default 'selected',
  add column if not exists exclusion_reason text,
  add column if not exists source_path_hash text;

alter table public.media
  drop constraint if exists media_review_status_check;

alter table public.media
  add constraint media_review_status_check check (review_status in ('pending', 'selected', 'rejected'));

update public.media
set source_path_hash = encode(extensions.digest('travel-magnets:' || (metadata ->> 'local_id'), 'sha256'), 'hex')
where source_path_hash is null
  and coalesce(metadata ->> 'local_id', '') <> '';

create unique index if not exists media_trip_source_path_hash_idx
  on public.media (trip_id, source_path_hash);

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where id = auth.uid() and is_active = true
  );
$$;

create trigger admin_users_set_updated_at
before update on public.admin_users
for each row execute function public.set_updated_at();

alter table public.admin_users enable row level security;

drop policy if exists media_public_read on public.media;
create policy media_public_read on public.media
for select to anon, authenticated
using (public.is_published_trip(trip_id) and review_status = 'selected');

create policy admin_users_self_read on public.admin_users
for select to authenticated
using (id = auth.uid());

create policy trips_admin_all on public.trips
for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
create policy trip_days_admin_all on public.trip_days
for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
create policy places_admin_all on public.places
for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
create policy trip_day_places_admin_all on public.trip_day_places
for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
create policy media_admin_all on public.media
for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
create policy media_assignments_admin_all on public.media_assignments
for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
create policy hero_sets_admin_all on public.hero_sets
for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
create policy hero_set_media_admin_all on public.hero_set_media
for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());

grant select, insert, update, delete on public.trips, public.trip_days, public.places,
  public.trip_day_places, public.media, public.media_assignments, public.hero_sets,
  public.hero_set_media to authenticated;
grant select on public.admin_users to authenticated;
grant execute on function public.is_admin_user() to authenticated;
