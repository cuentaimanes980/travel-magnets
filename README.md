# Travel Magnets

Travel Magnets es una experiencia web para albumes audiovisuales de viajes vinculados a futuros imanes NFC. El repositorio contiene el piloto editorial de India, con fotografias y videos locales optimizados para la experiencia actual.

## Requisitos

- Node.js 24 o superior.
- npm incluido con Node.js.

## Instalacion

```bash
npm install
```

## Desarrollo local

```bash
npm run dev
```

La aplicacion queda disponible en `http://localhost:3000`. En PowerShell, si la politica local bloquea `npm.ps1`, se puede usar `npm.cmd`.

## Comprobaciones

```bash
npm run lint
npm test
npm run build
```

Para probar el build de produccion localmente:

```bash
npm run build
npm run start
```

## Rutas principales

- `/`: portada y acceso al piloto.
- `/viajes/india`: album completo del piloto de India.
- `/viajes/india/lugares/[slug]`: fichas editoriales de lugares del recorrido.
- `/admin`: maqueta interna del futuro editor; no es una funcionalidad de produccion.

La ruta `/nfc/[code]` queda reservada para una fase posterior y no esta implementada.

## Estructura

- `app/`: rutas, layout y pagina 404 de Next.js.
- `components/`: componentes de presentacion del album, galerias, visor y navegacion.
- `data/`: contenido editorial de India y manifest de medios.
- `types/`: contratos TypeScript, incluido `ContentBlock`.
- `public/demo/india/real/`: derivados publicos locales usados por el piloto.
- `scripts/`: herramientas de importacion y revision de medios, fuera del flujo de runtime.
- `docs/`: criterios editoriales, revision movil y notas de despliegue.
- `tests/`: pruebas del contenido y de los contratos del piloto.

## Medios del piloto

Los medios actuales son el piloto local de India. La aplicacion usa derivados optimizados dentro de `public/demo/india/real/imported`; los originales permanecen fuera del repositorio y no deben incorporarse a Git.

Para regenerar el inventario de medios, define `INDIA_SOURCE_DIR` con una carpeta local externa y ejecuta:

```bash
npm run import:india
```

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. Usa los valores predeterminados de Next.js y el comando de build `npm run build`.
3. Configura `NEXT_PUBLIC_APP_URL` solo si se necesita fijar la URL publica para metadatos.
4. Verifica `/`, `/viajes/india`, las fichas de lugares y la pagina 404 tras el despliegue.

Esta fase no usa Supabase, Cloudflare R2, autenticacion ni secretos. En una fase futura, los medios podran migrarse a Cloudflare R2 y el contenido editorial y la resolucion NFC a Supabase.
