# Migración de datos de India

## Alcance

El seed se genera desde `data/india.ts`, `data/india-places.ts` y el manifest local. Importa:

- 1 viaje publicado con fechas del 2 al 10 de septiembre de 2018.
- 9 jornadas narrativas, contando el día 0.
- 14 lugares con slugs estables.
- 40 fotografías y 6 vídeos.
- 14 relaciones de lugar con jornada.
- Asignaciones para héroes, mosaicos, galerías, vídeos, fichas, cierre y portadas.
- Variantes de portada A, B, C y D.
- `india-2018` como enlace NFC inactivo.

Los medios permanecen en `public/demo/india/real/imported`. El seed guarda sus rutas públicas, pero no sube, mueve, recomprime ni elimina archivos.

## Flujo seguro

```bash
npm run db:india:dry-run
npm run db:india:import
npm run db:india:verify
npm run db:india:compare
```

El dry-run esperado informa 1 viaje, 9 días, 14 lugares, 40 fotos, 6 vídeos, 117 asignaciones, 4 hero sets, 13 relaciones de portada y 1 enlace NFC. Sin credenciales, `verify` y `compare` terminan como `SKIPPED`; no simulan una conexión.

La importación es idempotente gracias a IDs UUID deterministas y upserts. No hay borrados inesperados. La escritura se realiza por tablas y lotes, no como una transacción remota única; si falla a mitad, se vuelve a ejecutar y se verifica el resultado completo.

## Rollback y recuperación

Para una base local, `npx supabase db reset` recrea el esquema. En remoto, revisa el historial de migraciones, revierte la migración con un cambio SQL explícito o restaura una copia de seguridad según el procedimiento de Supabase. No uses el importador para borrar datos.

La fuente local sigue intacta como fallback de desarrollo y comparación. No se elimina ningún TS, JSON ni medio original.

## Activación posterior

Después de verificar el contenido, configura `TRAVEL_DATA_SOURCE=supabase` en un entorno de prueba y revisa `/`, `/viajes/india`, fichas, galerías, visor, vídeos, variantes y `/n/india-2018`. Activa el enlace NFC solo cuando el viaje publicado y sus medios estén comprobados.
