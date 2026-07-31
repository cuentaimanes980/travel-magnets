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

No hay Auth ni panel de edición conectado todavía. La estrategia futura será proteger las operaciones editoriales con Supabase Auth y roles de administración antes de añadir políticas de escritura.

## Medios y NFC

Los derivados locales de India siguen en `public/demo/india/real/imported`. Supabase guarda sus claves públicas como metadatos de medios, pero no almacena los archivos. Supabase Storage y Cloudflare R2 quedan para una fase posterior.

`/n/[code]` usa el mismo repositorio: en local reconoce `india-2018`; en Supabase solo resuelve enlaces activos a viajes publicados. No se programa ningún tag físico en esta fase.

## Límites actuales

No se incluyen edición, borradores desde la UI, autenticación, subidas, URLs firmadas, procesamiento de vídeo, analítica ni pagos. El seed es idempotente y no ejecuta borrados, pero la aplicación remota debe validarse con credenciales reales antes de cambiar la fuente de producción.
