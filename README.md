# Travel Magnets

Travel Magnets es una experiencia web para álbumes audiovisuales de viajes vinculados a futuros imanes NFC. El piloto actual contiene la historia editorial de India, con medios locales optimizados y una fuente de datos que puede funcionar en local o leer viajes publicados desde Supabase PostgreSQL.

## Requisitos

- Node.js 24 o superior.
- npm incluido con Node.js.

## Instalación

```bash
npm install
```

La aplicación no necesita credenciales para ejecutarse en modo local. Copia `.env.example` a `.env.local` solo si necesitas cambiar la fuente de datos; `.env.local` está excluido de Git.

## Desarrollo local

```bash
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`. La fuente predeterminada es `local`, que conserva los módulos actuales de `data/`.

Variables de entorno:

- `TRAVEL_DATA_SOURCE=local|supabase`: selecciona la fuente de datos.
- `TRAVEL_DATA_FALLBACK=local`: permite fallback explícito en desarrollo cuando Supabase no responde; no se aplica en producción.
- `NEXT_PUBLIC_SUPABASE_URL`: URL pública del proyecto Supabase.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: clave publicable para lecturas protegidas por RLS.
- `SUPABASE_SECRET_KEY`: clave secreta solo para scripts locales de importación y verificación. Nunca debe llevar el prefijo `NEXT_PUBLIC_`.

Cuando `TRAVEL_DATA_SOURCE=supabase`, la aplicación no oculta un fallo en producción. En desarrollo solo usa el fallback si se ha configurado expresamente.

## Comprobaciones

```bash
npm run lint
npm test
npm run build
```

## Datos e importación de India

El contenido local permanece en `data/` y los contratos en `types/`. El seed de Supabase se construye desde esos módulos, es determinista, no borra filas y no modifica medios.

```bash
npm run db:india:dry-run
npm run db:india:import
npm run db:india:verify
npm run db:india:compare
```

El dry-run no necesita credenciales. Importación, verificación remota y comparación necesitan `NEXT_PUBLIC_SUPABASE_URL` y la clave correspondiente; el importador usa además `SUPABASE_SECRET_KEY`. La migración de India contiene 1 viaje, 9 jornadas contando el día 0, 14 lugares, 40 fotos, 6 vídeos, asignaciones de medios, variantes de portada A-D y el código `india-2018` inicialmente inactivo.

## Rutas principales

- `/`: portada y acceso al piloto.
- `/viajes/india`: álbum completo del piloto de India.
- `/viajes/india/lugares/[slug]`: fichas editoriales de lugares.
- `/n/[code]`: resolución de códigos NFC; `india-2018` funciona en local y solo se resuelve desde Supabase cuando el enlace está activo.
- `/admin`: maqueta interna del futuro editor, sin acciones conectadas.

## Estructura

- `app/`: rutas, layout y página 404 de Next.js.
- `components/`: presentación del álbum, galerías, visor y navegación.
- `data/`: contenido editorial local de India y manifest de medios.
- `lib/travel-data/`: interfaz de lectura y repositorios local/Supabase.
- `lib/supabase/`: cliente de servidor y seed tipado de India.
- `types/`: contratos TypeScript, incluido `ContentBlock`.
- `public/demo/india/real/`: derivados públicos locales usados por el piloto.
- `scripts/`: importación, verificación y comparación, fuera del flujo de componentes.
- `supabase/migrations/`: migraciones versionadas de PostgreSQL.
- `docs/`: arquitectura, esquema, configuración y migración de India.
- `tests/`: pruebas del contenido, contratos y seed.

## Medios del piloto

Los medios actuales son el piloto local de India. La aplicación usa derivados optimizados dentro de `public/demo/india/real/imported`; los originales permanecen fuera del repositorio y no deben incorporarse a Git. No se usa Supabase Storage ni Cloudflare R2 todavía.

Para regenerar el inventario local, define `INDIA_SOURCE_DIR` con una carpeta externa y ejecuta:

```bash
npm run import:india
```

La futura migración a Cloudflare R2 queda separada de la persistencia editorial. No se han añadido cargas, URLs firmadas ni procesamiento remoto.

## Supabase CLI y migraciones

La CLI no se instala globalmente en este repositorio. Con la CLI disponible mediante `npx`, el flujo es:

```bash
npx supabase login
npx supabase init
npx supabase link --project-ref <project-ref>
npx supabase db push
npx supabase db diff -f nombre-de-la-migracion
```

No guardes el `project-ref`, tokens ni claves en Git. Para desarrollo local se puede usar `npx supabase db reset`; en un proyecto remoto, el rollback requiere revertir una migración o restaurar una copia de seguridad siguiendo el procedimiento operativo del proyecto.

Consulta [docs/supabase-setup.md](docs/supabase-setup.md), [docs/database-schema.md](docs/database-schema.md) y [docs/india-data-migration.md](docs/india-data-migration.md) antes de aplicar cambios remotos.

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. Usa el comando de build `npm run build`.
3. Mantén `TRAVEL_DATA_SOURCE=local` para el piloto sin base remota, o configura `TRAVEL_DATA_SOURCE=supabase` junto con la URL y la clave publicable cuando la base esté migrada y verificada.
4. Configura `SUPABASE_SECRET_KEY` solo en el entorno local de importación o en una tarea operativa protegida; la aplicación pública no la necesita.
5. Verifica `/`, `/viajes/india`, las fichas, `/n/india-2018` según su fuente, la página 404 y los medios tras el despliegue.

Supabase Auth para el editor y Cloudflare R2 para medios son fases futuras. No se incluyen en el runtime actual.
