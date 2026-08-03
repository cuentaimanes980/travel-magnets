# Travel Magnets

Travel Magnets es un gestor editorial y una experiencia web para albumes audiovisuales de viajes vinculados a futuros imanes NFC. India es el piloto activo. Supabase guarda los datos y la autenticacion; Cloudflare R2 sirve los medios publicos.

## Requisitos

- Node.js 20 o superior.
- npm.
- Un proyecto Supabase para el modo remoto y el panel.
- Un bucket Cloudflare R2 para subidas nuevas.

## Instalacion

```bash
npm install
```

La fuente local no necesita credenciales. Para Supabase y R2, copia `.env.example` a `.env.local` y completa los valores solo en tu maquina o en el proveedor de despliegue.

## Desarrollo local

```bash
npm run dev
```

La aplicacion queda disponible en `http://localhost:3000`.

Variables principales:

- `TRAVEL_DATA_SOURCE=local|supabase`: fuente editorial publica.
- `TRAVEL_DATA_FALLBACK=local`: fallback explicito solo durante desarrollo.
- `TRAVEL_MEDIA_SOURCE=local|r2`: entrega de medios.
- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: lectura publica protegida por RLS y Auth.
- `SUPABASE_SECRET_KEY`: solo scripts operativos locales; nunca llega al navegador.
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ENDPOINT`: solo servidor y scripts de medios.
- `NEXT_PUBLIC_MEDIA_BASE_URL`: dominio publico `r2.dev` o dominio de medios.

## Panel administrativo

- `/admin/login`: acceso con Supabase Auth.
- `/admin/viajes`: lista y creacion de borradores.
- `/admin/viajes/[slug]`: informacion general, estado, validacion y publicacion.
- `/admin/viajes/[slug]/dias`: jornadas, orden y eliminacion con confirmacion.
- `/admin/viajes/[slug]/lugares`: fichas, orden y jornadas vinculadas.
- `/admin/viajes/[slug]/medios`: filtros, candidatos, asignaciones, acciones masivas y subida directa a R2.
- `/admin/viajes/[slug]/portadas`: variantes y slots de portada.
- `/admin/viajes/[slug]/nfc`: codigo estable, QR, activacion y comprobacion.
- `/admin/viajes/[slug]/preview`: vista privada de un borrador.

Los viajes nuevos nacen como `draft`. La lectura publica solo permite viajes `published` mediante RLS. La publicacion valida datos generales, jornadas, portadas y medios. Los cambios editoriales se leen de forma dinamica y no necesitan un nuevo despliegue.

## Medios y R2

La subida del panel crea URLs presignadas de corta duracion. El navegador envia los bytes directamente a R2; las credenciales nunca se entregan al cliente y las funciones de Vercel no reciben el binario.

El bucket R2 debe tener CORS para `PUT`, `GET` y `HEAD` desde `http://localhost:3000` y `https://travel-magnets.vercel.app`, permitiendo `Content-Type`, `Cache-Control` y `x-amz-*`. Esta configuracion se hace en Cloudflare y no contiene secretos.

Formatos iniciales:

- Imagenes: JPG, JPEG, PNG y WebP, hasta 25 MB.
- Videos: MP4 compatible con navegador, hasta 250 MB.
- Derivados: WebP de hasta 2400 px y miniatura de hasta 640 px.
- Poster de video: imagen compatible subida manualmente.

HEIC, MOV y otros formatos se muestran como no compatibles. Preparalos localmente y vuelve a subir los derivados. No se ejecuta transcodificacion pesada dentro de Vercel.

Las claves remotas usan `trips/<slug>/images/full`, `images/thumbs`, `videos` y `posters`. Supabase guarda claves relativas, nunca URLs completas. Los objetos R2 no se eliminan desde el panel.

Los medios actuales son el piloto local de India. Los derivados publicos existentes siguen en `public/demo/india/real/imported` como fallback local; los originales no pertenecen al repositorio.

## Estado de India

El piloto de India contiene 114 medios seleccionados en Supabase y sus derivados publicos en R2. Los originales externos no pertenecen al repositorio y nunca se modifican desde la aplicacion. La fuente local sigue disponible como fallback de desarrollo.

La recuperacion de candidatos fue idempotente: los hashes de origen y las claves remotas evitan duplicados. Para futuras revisiones, el panel permite mantener un medio como `pending`, `selected` o `rejected` sin borrar objetos fisicos de R2.

## Comprobaciones

```bash
npm run lint
npm test
npm run build
```

Build aislado fuera de la carpeta de sincronización:

```bash
npm run build
```

Si la carpeta de trabajo bloquea `.next`, ejecuta el mismo comando desde una copia local temporal con las dependencias instaladas.

## Seguridad de dependencias

La auditoria actual detecta tres vulnerabilidades altas heredadas por `next@16.2.12`: `postcss` y `sharp` en sus dependencias internas. `npm audit fix --dry-run` solo ofrece una degradacion mayor a Next 9.3.3, por lo que no se aplica una actualizacion automatica incompatible. Hay que revisar una version posterior de Next que mantenga la compatibilidad antes de resolverlas.

## Supabase

Migraciones versionadas:

```bash
npx supabase db push --dry-run
npx supabase db push
```

No uses `db reset` sobre el proyecto remoto. El panel depende de `admin_users`, Auth y RLS. Consulta `docs/supabase-setup.md`, `docs/database-schema.md` y `docs/admin-media-workflow.md` antes de aplicar una migracion.

## Estructura

- `app/`: rutas publicas, panel, API de subida y callback Auth.
- `components/travel/`: plantilla publica compartida por todos los viajes.
- `components/admin/`: editor, filtros, subida R2 y QR.
- `data/`: fuente local del piloto de India.
- `lib/travel-data/`: repositorios local y Supabase.
- `lib/admin/`: consultas y acciones protegidas por Auth y RLS.
- `lib/r2/`: cliente S3 compatible solo de servidor.
- `types/`: contratos TypeScript.
- `scripts/`: importacion, comparacion y auditoria de medios.
- `supabase/migrations/`: esquema y politicas versionadas.
- `docs/`: arquitectura, migracion y procedimientos operativos.

## Despliegue en Vercel

Configura en Production y Preview las variables publicas de Supabase, `TRAVEL_DATA_SOURCE=supabase`, `TRAVEL_MEDIA_SOURCE=r2` y `NEXT_PUBLIC_MEDIA_BASE_URL`. Configura las credenciales R2 solo en rutas servidor si se habilitan operaciones presignadas en Vercel. No guardes `.env.local`, tokens, claves ni rutas personales en Git.
