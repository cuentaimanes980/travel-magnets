-- Ordered trip sections for content without a reliable calendar date.

create table if not exists public.trip_sections (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text not null default '',
  display_order integer not null check (display_order >= 0),
  is_gallery boolean not null default true,
  initially_closed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, display_order)
);

create table if not exists public.trip_section_media (
  section_id uuid not null references public.trip_sections(id) on delete cascade,
  media_id uuid not null references public.media(id) on delete cascade,
  display_order integer not null default 0 check (display_order >= 0),
  primary key (section_id, media_id),
  unique (section_id, display_order)
);

create index if not exists trip_sections_trip_order_idx
  on public.trip_sections (trip_id, display_order);
create index if not exists trip_section_media_media_idx
  on public.trip_section_media (media_id);

drop trigger if exists trip_sections_set_updated_at on public.trip_sections;
create trigger trip_sections_set_updated_at
before update on public.trip_sections
for each row execute function public.set_updated_at();

alter table public.trip_sections enable row level security;
alter table public.trip_section_media enable row level security;

drop policy if exists trip_sections_public_read on public.trip_sections;
create policy trip_sections_public_read on public.trip_sections
for select to anon, authenticated
using (public.is_published_trip(trip_id));

drop policy if exists trip_sections_admin_all on public.trip_sections;
create policy trip_sections_admin_all on public.trip_sections
for all to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists trip_section_media_public_read on public.trip_section_media;
create policy trip_section_media_public_read on public.trip_section_media
for select to anon, authenticated
using (
  exists (
    select 1 from public.trip_sections section
    where section.id = section_id
      and public.is_published_trip(section.trip_id)
  )
);

drop policy if exists trip_section_media_admin_all on public.trip_section_media;
create policy trip_section_media_admin_all on public.trip_section_media
for all to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

grant select on public.trip_sections, public.trip_section_media to anon, authenticated;
grant insert, update, delete on public.trip_sections, public.trip_section_media to authenticated;
