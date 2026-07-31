# Esquema de base de datos

La migración inicial está en `supabase/migrations/20260731_000001_initial_travel_schema.sql`. Está diseñada para el piloto y evita introducir un editor o un sistema de bloques antes de que exista esa necesidad.

## Tablas

- `trips`: identidad estable, slug, título, fechas, resumen, estado `draft|published|archived`, modo de portada y configuración pública `theme`.
- `trip_days`: nueve jornadas de India, con número, fecha, título, ciudad, fase, resumen y orden.
- `places`: lugares de un viaje, slug único por viaje, nombre, alias, ciudad, zona, fecha de visita, descripción, coordenadas, categoría y orden.
- `trip_day_places`: relación ordenada entre una jornada y sus lugares.
- `media`: fotos y vídeos, claves públicas, dimensiones, orientación, texto alternativo, encuadre, fecha/hora y metadatos seguros.
- `media_assignments`: relación ordenada de un medio con una jornada o lugar. Los roles iniciales son `day_hero`, `day_mosaic`, `day_gallery`, `day_video`, `place`, `place_cover` y `closing`.
- `hero_sets`: variantes de portada por viaje, con modo, orden y activación.
- `hero_set_media`: medios y slots de cada variante.
- `nfc_links`: código estable, viaje de destino y estado activo.

## Relaciones y borrado

Un viaje es el propietario de jornadas, lugares, medios, asignaciones, portadas y enlaces NFC. Las claves foráneas usan `on delete cascade` para evitar filas huérfanas cuando se elimina un viaje desde una operación administrativa futura. Los scripts de este piloto no ejecutan eliminaciones: solo hacen upsert por IDs deterministas.

Hay índices para slug, viaje y orden, búsquedas de jornadas/lugares, asignaciones por jornada o lugar y enlaces NFC activos. Las restricciones comprueban fechas, órdenes no negativos, coordenadas, dimensiones, ratios y orientaciones.

`media_assignments.trip_id` duplica el viaje propietario de la relación para facilitar lectura por viaje y RLS. `places.zone` y `places.visit_date` son campos explícitos porque la ficha pública actual los necesita.

## RLS

Todas las tablas tienen RLS activado. `anon` y `authenticated` solo tienen `SELECT`:

- `trips` permite viajes con `status = 'published'`.
- Las tablas relacionadas comprueban que su `trip_id` pertenezca a un viaje publicado.
- `trip_day_places` comprueba la jornada relacionada.
- `hero_set_media` comprueba la portada relacionada.
- `nfc_links` exige `is_active` y viaje publicado.

No hay `INSERT`, `UPDATE` ni `DELETE` para roles públicos. La clave secreta de servicio se limita a scripts locales u operaciones protegidas y no debe llegar al navegador.

## Cambios futuros

Auth añadirá políticas de edición para usuarios administradores cuando exista el panel real. R2 sustituirá las claves de medios locales sin cambiar la relación editorial. No se añade una tabla de bloques hasta que el editor tenga un contrato de bloques que implementar.
