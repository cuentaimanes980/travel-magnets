# Arquitectura

## Estado actual

La aplicacion usa Next.js con App Router, TypeScript, Tailwind CSS y componentes de servidor por defecto. Los datos de India viven en `data/india.ts`; `types/travel.ts` define el contrato de viajes, dias, lugares, medios y bloques de contenido. La ruta dinamica `/viajes/[slug]` devuelve un estado 404 para viajes inexistentes.

Los recursos de demostracion son SVG locales en `public/demo/india`. Los bloques visuales son componentes reutilizables en `components/travel`, y el contenido de cada dia se representa mediante la union discriminada `ContentBlock`.

La portada publica usa `TripCover`, con los modos `collage`, `slideshow` y `video`. El modo `collage` es el activo y usa posiciones de encuadre por medio; los otros modos quedan preparados sin añadir servicios externos. Los medios reales previstos se documentan en [india-media-guide.md](india-media-guide.md) y se servirian desde `public/demo/india/real` durante el prototipo.

La ruta NFC futura puede resolver un código estable en `/nfc/[code]` y redirigir al slug publicado de `/viajes/[slug]`. Esa ruta no se implementa en esta fase para mantener el flujo actual directo y sencillo.

## Evolucion prevista

Vercel alojara una unica aplicacion y dominio. Supabase PostgreSQL sustituira los datos locales para guardar viajes, dias, bloques, metadatos y los estados `draft` y `published`. Supabase Auth protegera el panel administrativo.

Cloudflare R2 almacenara originales, videos y miniaturas. El editor solicitara URLs firmadas al servidor y subira directamente a R2, evitando que archivos pesados atraviesen la aplicacion. El editor mantendra el orden de bloques y su tipo para conservar el modelo actual.

Las rutas NFC permanentes podran resolver un identificador estable hacia el viaje publicado correspondiente. Esto permite alojar 10, 15 o mas viajes con un unico dominio sin cambiar las URLs de las pegatinas.

## Limites intencionados

No se incluye todavia esquema de base de datos, cliente de Supabase, SDK de R2, procesamiento de video, autenticacion, pagos ni endpoints de subida. Se incorporaran cuando exista una necesidad de producto concreta.
