create extension if not exists pgcrypto;

create type public.trip_status as enum ('draft', 'published', 'archived');
create type public.hero_mode as enum ('collage', 'slideshow', 'video');
create type public.media_type as enum ('image', 'video');

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  start_date date not null,
  end_date date not null,
  summary text not null default '',
  status public.trip_status not null default 'draft',
  hero_mode public.hero_mode not null default 'collage',
  theme jsonb not null default '{}'::jsonb check (jsonb_typeof(theme) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_date_order check (end_date >= start_date)
);

create table public.trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_number integer not null check (day_number >= 0),
  date date not null,
  title text not null,
  location text not null,
  phase text not null default '',
  summary text not null default '',
  display_order integer not null check (display_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, day_number),
  unique (trip_id, date),
  unique (trip_id, display_order)
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  slug text not null,
  name text not null,
  alternate_name text,
  city text not null,
  zone text not null default '',
  visit_date date,
  summary text not null default '',
  description text not null default '',
  latitude double precision,
  longitude double precision,
  category text not null,
  display_order integer not null check (display_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, slug),
  unique (trip_id, display_order),
  constraint places_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint places_longitude_range check (longitude is null or longitude between -180 and 180)
);

create table public.trip_day_places (
  trip_day_id uuid not null references public.trip_days(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  display_order integer not null default 0 check (display_order >= 0),
  primary key (trip_day_id, place_id),
  unique (trip_day_id, display_order)
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  storage_key text not null,
  thumbnail_key text,
  poster_key text,
  media_type public.media_type not null,
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  aspect_ratio numeric check (aspect_ratio is null or aspect_ratio > 0),
  orientation text check (orientation is null or orientation in ('landscape', 'portrait', 'square')),
  alt text not null default '',
  focus jsonb not null default '{}'::jsonb check (jsonb_typeof(focus) = 'object'),
  capture_date date,
  capture_time time,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, storage_key)
);

create table public.media_assignments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  media_id uuid not null references public.media(id) on delete cascade,
  trip_day_id uuid references public.trip_days(id) on delete cascade,
  place_id uuid references public.places(id) on delete cascade,
  role text not null check (role in ('day_hero', 'day_mosaic', 'day_gallery', 'day_video', 'place', 'place_cover', 'closing')),
  display_order integer not null default 0 check (display_order >= 0),
  layout_hint text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, media_id, role, trip_day_id, place_id, display_order)
);

create table public.hero_sets (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  layout public.hero_mode not null,
  display_order integer not null default 0 check (display_order >= 0),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, name),
  unique (trip_id, display_order)
);

create table public.hero_set_media (
  hero_set_id uuid not null references public.hero_sets(id) on delete cascade,
  media_id uuid not null references public.media(id) on delete cascade,
  slot integer not null check (slot >= 0),
  display_order integer not null default 0 check (display_order >= 0),
  focus jsonb not null default '{}'::jsonb check (jsonb_typeof(focus) = 'object'),
  primary key (hero_set_id, media_id),
  unique (hero_set_id, slot),
  unique (hero_set_id, display_order)
);

create table public.nfc_links (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  trip_id uuid not null references public.trips(id) on delete cascade,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trip_days_trip_order_idx on public.trip_days (trip_id, display_order);
create index places_trip_order_idx on public.places (trip_id, display_order);
create index trip_day_places_place_idx on public.trip_day_places (place_id, trip_day_id);
create index media_trip_order_idx on public.media (trip_id, capture_date, capture_time);
create index media_assignments_trip_day_idx on public.media_assignments (trip_id, trip_day_id, role, display_order);
create index media_assignments_trip_place_idx on public.media_assignments (trip_id, place_id, role, display_order);
create index hero_sets_trip_order_idx on public.hero_sets (trip_id, display_order);
create index hero_set_media_media_idx on public.hero_set_media (media_id, hero_set_id);
create index nfc_links_trip_active_idx on public.nfc_links (trip_id, is_active);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trips_set_updated_at before update on public.trips for each row execute function public.set_updated_at();
create trigger trip_days_set_updated_at before update on public.trip_days for each row execute function public.set_updated_at();
create trigger places_set_updated_at before update on public.places for each row execute function public.set_updated_at();
create trigger media_set_updated_at before update on public.media for each row execute function public.set_updated_at();
create trigger media_assignments_set_updated_at before update on public.media_assignments for each row execute function public.set_updated_at();
create trigger hero_sets_set_updated_at before update on public.hero_sets for each row execute function public.set_updated_at();
create trigger nfc_links_set_updated_at before update on public.nfc_links for each row execute function public.set_updated_at();

create or replace function public.is_published_trip(trip_uuid uuid)
returns boolean
language sql
stable
security invoker
as $$
  select exists (
    select 1 from public.trips
    where id = trip_uuid and status = 'published'
  );
$$;

alter table public.trips enable row level security;
alter table public.trip_days enable row level security;
alter table public.places enable row level security;
alter table public.trip_day_places enable row level security;
alter table public.media enable row level security;
alter table public.media_assignments enable row level security;
alter table public.hero_sets enable row level security;
alter table public.hero_set_media enable row level security;
alter table public.nfc_links enable row level security;

create policy trips_public_read on public.trips for select to anon, authenticated using (status = 'published');
create policy trip_days_public_read on public.trip_days for select to anon, authenticated using (public.is_published_trip(trip_id));
create policy places_public_read on public.places for select to anon, authenticated using (public.is_published_trip(trip_id));
create policy trip_day_places_public_read on public.trip_day_places for select to anon, authenticated using (
  exists (
    select 1 from public.trip_days d
    where d.id = trip_day_id and public.is_published_trip(d.trip_id)
  )
);
create policy media_public_read on public.media for select to anon, authenticated using (public.is_published_trip(trip_id));
create policy media_assignments_public_read on public.media_assignments for select to anon, authenticated using (public.is_published_trip(trip_id));
create policy hero_sets_public_read on public.hero_sets for select to anon, authenticated using (public.is_published_trip(trip_id));
create policy hero_set_media_public_read on public.hero_set_media for select to anon, authenticated using (
  exists (
    select 1 from public.hero_sets h
    where h.id = hero_set_id and public.is_published_trip(h.trip_id)
  )
);
create policy nfc_links_public_read on public.nfc_links for select to anon, authenticated using (
  is_active and public.is_published_trip(trip_id)
);

grant usage on schema public to anon, authenticated;
grant select on public.trips, public.trip_days, public.places, public.trip_day_places, public.media, public.media_assignments, public.hero_sets, public.hero_set_media, public.nfc_links to anon, authenticated;
grant execute on function public.is_published_trip(uuid) to anon, authenticated;
grant all on all tables in schema public to service_role;
