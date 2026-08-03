# Esquema de base de datos

Las migraciones viven en `supabase/migrations/`. La inicial crea el contrato editorial del piloto. `20260803_000002_admin_editor.sql` añade Auth, revision de medios y escritura protegida. `20260803_000003_trip_manager.sql` añade la escritura administrativa de NFC y un unico enlace activo por viaje.

## Tablas

- `trips`: identidad, slug, titulo, fechas, resumen, estado `draft|published|archived`, modo de portada y configuracion `theme`.
- `trip_days`: jornadas con numero, fecha, titulo, ciudad, fase, resumen y orden.
- `places`: lugares con slug, nombre, alias, ciudad, zona, fecha, descripcion, coordenadas y orden.
- `trip_day_places`: relacion ordenada entre una jornada y sus lugares.
- `media`: fotos y videos, claves R2, dimensiones, orientacion, texto alternativo, encuadre, fecha y metadatos.
- `media_assignments`: relacion ordenada de un medio con una jornada o lugar. Los roles son `day_hero`, `day_mosaic`, `day_gallery`, `day_video`, `place`, `place_cover` y `closing`.
- `hero_sets`: variantes de portada por viaje, con modo, orden y activacion.
- `hero_set_media`: medios y slots de cada variante.
- `admin_users`: UUIDs de Auth autorizados para editar.
- `nfc_links`: codigo estable, viaje de destino y estado activo.

## Revision de medios

`media.review_status` usa `pending|selected|rejected`. India tiene 114 medios seleccionados; los candidatos recuperados se registraron de forma idempotente con `source_path_hash`, sin guardar rutas locales. `exclusion_reason` conserva el motivo de una futura exclusion sin borrar el objeto de R2.

La web publica solo lee medios `selected`. Un medio puede tener varias filas en `media_assignments` sin duplicar el objeto R2.

## Relaciones y borrado

Un viaje es propietario de jornadas, lugares, medios, asignaciones, portadas y enlaces NFC. Las claves foraneas usan `on delete cascade`. El panel no elimina objetos fisicos de R2; descartar un medio solo cambia su estado y retira sus asignaciones.

## RLS

Todas las tablas tienen RLS activado:

- `anon` y `authenticated` leen solo viajes publicados y sus relaciones publicables.
- Los medios publicos exigen `review_status = 'selected'`.
- `public.is_admin_user()` comprueba la sesion contra `admin_users`.
- Solo administradores autenticados tienen `SELECT`, `INSERT`, `UPDATE` y `DELETE` editoriales.
- Las credenciales secretas de Supabase y R2 nunca llegan al navegador.

Las escrituras del panel usan Server Actions, cookies SSR de Supabase Auth y revalidan las rutas publicas despues de guardar.

## Operativa multimedia

La subida directa a R2 usa claves relativas, URLs presignadas de corta duracion y una confirmacion `HEAD` antes de insertar el medio. Las imagenes se convierten en derivados WebP en el navegador; videos y posters se suben sin pasar por funciones de Vercel. La eliminacion fisica de objetos no forma parte del panel.

## NFC

Un codigo inactivo devuelve 404 en `/n/<code>`. Activarlo exige que el viaje este publicado. La politica RLS limita la escritura a administradores y el indice parcial limita a un codigo activo por viaje. La etiqueta fisica queda fuera de este sistema.
