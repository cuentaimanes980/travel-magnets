alter table public.places
  add column if not exists wikipedia_url text;

alter table public.places
  drop constraint if exists places_wikipedia_url_check;

alter table public.places
  add constraint places_wikipedia_url_check
  check (
    wikipedia_url is null
    or wikipedia_url ~ '^https://es[.]wikipedia[.]org/wiki/[^/?#[:space:]]([^#[:space:]]*)?$'
  );
