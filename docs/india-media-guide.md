# Medios reales de India

El piloto usa una selección reproducible de medios locales que permanecen fuera del repositorio. La carpeta de origen se indica al importador mediante `INDIA_SOURCE_DIR` cuando se necesita regenerar los derivados.

## Importacion

Ejecutar desde la raiz del proyecto:

```bash
npm run import:india
```

El script conserva los originales fuera de la web y genera:

- `public/demo/india/real/imported`: WebP optimizados, miniaturas y clips MP4 seleccionados.
- `data/india-media-manifest.json`: inventario completo, relacion original/derivado, dimensiones, fechas, clasificacion y omisiones.
- `docs/india-place-review.md`: revisión editorial por día.

La seleccion se limita a una densidad revisable por dia y se decide con fecha, carpeta, nombre descriptivo y metadatos disponibles. Los archivos no seleccionados siguen en el manifest con su motivo de omision.

## Criterio editorial

Las fechas y la ruta Delhi -> Jaipur -> Agra corresponden a la edición actual del piloto. Las identificaciones que no tienen nombre confirmado se presentan de forma descriptiva.

Las fotografias conservan su orientacion y proporcion. La portada usa un collage real; los dias combinan fotografia principal, mosaicos de orientacion mixta, galeria y video cuando existe un clip asociado.

## Variantes de portada

La comparacion visual se puede abrir con estos parametros en `/viajes/india`:

- `?portada=a`: horizontal dominante y dos verticales.
- `?portada=b`: vertical dominante y dos horizontales.
- `?portada=c`: mosaico de cuatro fotografias.
- `?portada=d`: video corto con dos fotografias de respaldo.

La variante A es la predeterminada mientras se revisan las cuatro opciones.

No se deben mover, renombrar ni eliminar los originales de la carpeta de descarga. No se conectan servicios externos ni almacenamiento remoto en esta fase.
