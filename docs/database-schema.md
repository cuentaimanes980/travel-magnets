# Esquema de base de datos

Las migraciones viven en `supabase/migrations/`. La inicial crea el contrato editorial del piloto y `20260803_000002_admin_editor.sql` añade Auth, revision de medios y escritura protegida para el panel.

## Tablas

- `trips`: identidad estable, slug, titulo, fechas, resumen, estado `draft|published|archived`, modo de portada y configuracion publica `theme`.
- `trip_days`: jornadas, con numero, fecha, titulo, ciudad, fase, resumen y orden.
- `places`: lugares de un viaje, slug unico, nombre, alias, ciudad, zona, fecha de visita, descripcion, coordenadas y orden.
- `trip_day_places`: relacion ordenada entre una jornada y sus lugares.
- `media`: fotos y videos, claves publicas, dimensiones, orientacion, texto alternativo, encuadre, fecha/hora y metadatos seguros.
- `media_assignments`: relacion ordenada de un medio con una jornada o lugar. Los roles son `day_hero`, `day_mosaic`, `day_gallery`, `day_video`, `place`, `place_cover` y `closing`.
- `hero_sets`: variantes de portada por viaje, con modo, orden y activacion.
- `hero_set_media`: medios y slots de cada variante.
- `admin_users`: lista minima de UUIDs de Auth autorizados para editar contenido.
- `nfc_links`: codigo estable, viaje de destino y estado activo. NFC sigue desactivado para India.

## Revision de medios

`media.review_status` usa `pending|selected|rejected`. Los 46 medios actuales se mantienen como `selected`; el importador de omitidos registra los 68 candidatos como `pending`, sin subirlos a R2 ni guardarlos con rutas locales. `exclusion_reason` explica el estado y `source_path_hash` distingue candidatos repetidos sin conservar una ruta absoluta.

La web publica solo lee medios `selected`. Un medio puede tener varias filas en `media_assignments` y no se duplica el registro original.

## Relaciones y borrado

Un viaje es el propietario de jornadas, lugares, medios, asignaciones, portadas y enlaces NFC. Las claves foraneas usan `on delete cascade`. El panel no elimina objetos fisicos de R2; descartar un medio solo cambia su estado y retira sus asignaciones.

## RLS

Todas las tablas tienen RLS activado:

- `anon` y `authenticated` leen solo viajes publicados y sus relaciones publicables.
- Los medios publicos exigen `review_status = 'selected'`.
- `public.is_admin_user()` comprueba la sesion autenticada contra `admin_users`.
- Solo administradores autenticados tienen `SELECT`, `INSERT`, `UPDATE` y `DELETE` editoriales.
- La clave secreta de servicio se limita a scripts y nunca llega al navegador.

Las escrituras del panel usan Server Actions con cookies de Supabase Auth y revalidan las rutas publicas despues de guardar.

## Pendiente

La subida directa a R2, la transcodificacion y la eliminacion fisica de objetos quedan fuera de esta primera version. NFC tambien permanece desactivado.
