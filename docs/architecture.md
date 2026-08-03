# Arquitectura

## Aplicación pública

Travel Magnets usa Next.js con App Router, TypeScript y componentes de servidor por defecto. `/viajes/[slug]` y las fichas de lugares leen a través de `lib/travel-data`, de modo que la interfaz no conoce si el contenido viene de los módulos locales o de PostgreSQL.

`TRAVEL_DATA_SOURCE=local` es el valor predeterminado y conserva `data/india.ts`, `data/india-places.ts` y el manifest de medios como fuente de recuperación. `TRAVEL_DATA_SOURCE=supabase` consulta solo viajes publicados. Si la lectura remota falla, el fallback local solo se activa en desarrollo y únicamente con `TRAVEL_DATA_FALLBACK=local`; en producción el error se propaga.

Las consultas de Supabase cargan el viaje y sus relaciones en lotes paralelos. La reconstrucción mantiene el contrato `Trip`, `TripDay`, `TripPlace` y `MediaItem`, por lo que las galerías cerradas, el visor `contain`, los vídeos, las variantes A-D, los enlaces de lugares y la navegación no cambian.

## Persistencia

Supabase PostgreSQL contiene viajes, jornadas, lugares, relaciones de jornada, medios, asignaciones, portadas y enlaces NFC. Las migraciones viven en `supabase/migrations/`. El campo `theme` de un viaje guarda únicamente configuración editorial pública estructurada, como fechas, hechos, ruta y cierre.

`media_assignments.trip_id` es una referencia redundante intencionada: facilita consultas por viaje y políticas RLS sin recorrer relaciones para cada lectura. `places.zone` y `places.visit_date` conservan datos necesarios para que la ficha remota mantenga el mismo contenido local.

## Seguridad

RLS está activado en todas las tablas. Los roles públicos solo pueden leer filas vinculadas a un viaje con estado `published`; los enlaces NFC además deben estar activos. No existen políticas públicas de escritura. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` puede usarse en lecturas protegidas por RLS. `SUPABASE_SECRET_KEY` solo aparece en scripts operativos de servidor y nunca se envía al navegador.

El panel de edición usa Supabase Auth, cookies SSR y la lista `admin_users`. Las escrituras pasan por Server Actions o rutas servidor y RLS vuelve a comprobar la pertenencia administrativa.

## Medios y NFC

Los medios públicos seleccionados de India se sirven desde Cloudflare R2 mediante claves relativas guardadas en Supabase. Los derivados locales siguen en `public/demo/india/real/imported` como fallback. Las credenciales de R2 solo se usan en servidor; la subida directa usa URLs presignadas y el navegador envía los bytes directamente al bucket.

`/n/[code]` usa el mismo repositorio: en local reconoce `india-2018`; en Supabase solo resuelve enlaces activos a viajes publicados. No se programa ningún tag físico en esta fase.

## Límites actuales

El panel no elimina objetos físicos de R2, no transcodifica vídeo en Vercel y no activa automáticamente enlaces NFC. El seed y la recuperación de candidatos son idempotentes y no ejecutan borrados de datos remotos.
