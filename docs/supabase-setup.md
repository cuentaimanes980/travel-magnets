# Configuración de Supabase

El proyecto remoto está vinculado para esta copia de trabajo y la migración inicial de India ya está aplicada. Los metadatos locales de enlace viven en `supabase/.temp/`, que está excluido de Git. Estos pasos permiten repetir la configuración en otra copia sin guardar secretos en el repositorio.

## Variables

En `.env.local` usa los nombres de `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `TRAVEL_DATA_SOURCE=local|supabase`
- `TRAVEL_DATA_FALLBACK=local` solo para desarrollo explícito

No escribas valores reales en `.env.example`, README, logs, capturas o respuestas. La clave secreta no debe tener prefijo `NEXT_PUBLIC_`.

## Proyecto y migraciones

1. Crea manualmente un proyecto Supabase y conserva su `project-ref` fuera de Git.
2. Instala o ejecuta la CLI con `npx supabase`.
3. En el repositorio ejecuta `npx supabase init` si todavía no existe configuración local.
4. Vincula el proyecto con `npx supabase link --project-ref <project-ref>`.
5. Revisa la migración y aplica `npx supabase db push`.
6. Para cambios locales, usa `npx supabase db diff -f nombre-de-la-migracion` y revisa el SQL antes de subirlo.

La CLI se ejecuta mediante `npx` y no se añade como dependencia de runtime. En esta copia, `supabase link` y `supabase db push` ya se ejecutaron; no se versionan sus metadatos locales. `npx supabase db reset` sirve para una base local de desarrollo, no es un rollback remoto.

## Importación

Con la migración aplicada y las variables secretas disponibles solo en el entorno operativo:

```bash
npm run db:india:dry-run
npm run db:india:import
npm run db:india:verify
npm run db:india:compare
```

El importador usa IDs deterministas, hace upsert y no borra filas. La importación de India ya fue verificada y es repetible. Si una ejecución se interrumpe, vuelve a ejecutarla y revisa el verificador. El código NFC permanece inactivo.

## Runtime

Mantén `TRAVEL_DATA_SOURCE=local` para el piloto y cambia temporalmente a `supabase` solo durante una validación remota. En Vercel, activa Supabase únicamente después de verificar los datos y deja `TRAVEL_DATA_FALLBACK` sin configurar en producción para no ocultar fallos de persistencia.
