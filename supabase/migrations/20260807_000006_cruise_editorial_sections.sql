-- Convert the generic cruise-board place into ordered editorial sections.

alter table public.trip_sections
  add column if not exists after_day_number integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'trip_sections_after_day_number_check'
      and conrelid = 'public.trip_sections'::regclass
  ) then
    alter table public.trip_sections
      add constraint trip_sections_after_day_number_check check (after_day_number is null or after_day_number >= 0);
  end if;
end;
$$;

create index if not exists trip_sections_trip_day_idx
  on public.trip_sections (trip_id, after_day_number, display_order);

do $$
declare
  cruise_id uuid;
  board_place_id uuid;
begin
  select id into cruise_id from public.trips where slug = 'crucero-venecia-islas-griegas';
  if cruise_id is null then
    return;
  end if;

  select id into board_place_id from public.places where trip_id = cruise_id and slug = 'a-bordo';

  insert into public.trip_sections (id, trip_id, title, description, display_order, after_day_number, is_gallery, initially_closed)
  values
    (md5('travel-magnets/cruise/boarding')::uuid, cruise_id, 'Embarque y primeras horas', 'Las primeras imágenes del barco y el comienzo de la travesía.', 0, 0, true, true),
    (md5('travel-magnets/cruise/on-board-life')::uuid, cruise_id, 'Vida a bordo', 'Comidas y escenas compartidas durante los días de navegación.', 1, 1, true, true),
    (md5('travel-magnets/cruise/island-navigation')::uuid, cruise_id, 'Navegación entre islas', 'El barco como transición entre puertos y destinos.', 2, 4, true, true),
    (md5('travel-magnets/cruise/deck-light')::uuid, cruise_id, 'Atardeceres en cubierta', 'Luz, horizonte y ritmo lento desde el barco.', 3, 6, true, true),
    (md5('travel-magnets/cruise/last-night')::uuid, cruise_id, 'Última noche', 'Las últimas horas a bordo antes del regreso.', 4, 7, true, true),
    (md5('travel-magnets/cruise/full-gallery')::uuid, cruise_id, 'A bordo', 'Galería completa de la vida a bordo: cubierta, comidas, navegación y escenas del barco.', 5, 7, true, true)
  on conflict (id) do update set
    title = excluded.title,
    description = excluded.description,
    display_order = excluded.display_order,
    after_day_number = excluded.after_day_number,
    is_gallery = excluded.is_gallery,
    initially_closed = excluded.initially_closed;

  if board_place_id is not null then
    insert into public.trip_section_media (section_id, media_id, display_order)
    select md5('travel-magnets/cruise/boarding')::uuid, media_id, 0
    from public.media_assignments
    where place_id = board_place_id and role = 'place' and display_order = 7
    on conflict do nothing;

    insert into public.trip_section_media (section_id, media_id, display_order)
    select md5('travel-magnets/cruise/on-board-life')::uuid, media_id, display_order
    from public.media_assignments
    where place_id = board_place_id and role = 'place' and display_order between 0 and 6
    on conflict do nothing;

    insert into public.trip_section_media (section_id, media_id, display_order)
    select md5('travel-magnets/cruise/island-navigation')::uuid, media_id, display_order - 8
    from public.media_assignments
    where place_id = board_place_id and role = 'place' and display_order between 8 and 10
    on conflict do nothing;

    insert into public.trip_section_media (section_id, media_id, display_order)
    select md5('travel-magnets/cruise/deck-light')::uuid, media_id, display_order - 11
    from public.media_assignments
    where place_id = board_place_id and role = 'place' and display_order between 11 and 19
    on conflict do nothing;

    insert into public.trip_section_media (section_id, media_id, display_order)
    select md5('travel-magnets/cruise/last-night')::uuid, media_id, display_order - 20
    from public.media_assignments
    where place_id = board_place_id and role = 'place' and display_order between 20 and 23
    on conflict do nothing;

    insert into public.trip_section_media (section_id, media_id, display_order)
    select md5('travel-magnets/cruise/full-gallery')::uuid, media_id, display_order
    from public.media_assignments
    where place_id = board_place_id and role = 'place'
    on conflict do nothing;

    delete from public.media_assignments where place_id = board_place_id;
    delete from public.trip_day_places where place_id = board_place_id;
    delete from public.places where id = board_place_id;
  end if;
end;
$$;
