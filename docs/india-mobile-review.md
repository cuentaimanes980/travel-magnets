# Revision visual movil final de India

Capturas tomadas sobre el build de produccion local de `/viajes/india`, con Playwright CLI y viewports CSS de 390x844 y 360x800. Son artefactos de revision y no forman parte de la web publicada.

## Capturas conservadas

La carpeta [docs/screenshots/mobile-review](screenshots/mobile-review) conserva una seleccion pequena y util:

- Portadas A-D en 390: `india-final-cover-a-390.png`, `india-final-cover-b-390.png`, `india-final-cover-c-390.png`, `india-final-cover-d-390.png`; A tambien en 360: `india-final-cover-a-360.png`.
- Resumen y ruta en ambos tamanos: `india-final-summary-index-390.png`, `india-final-summary-360.png`.
- Jornada, galeria abierta, visor, video, filtros y cierre: `india-final-day-04-390.png`, `india-final-day-04-360.png`, `india-final-day-01-gallery-open-390.png`, `india-final-vertical-viewer-390.png`, `india-final-video-viewer-390.png`, `india-final-album-filters-390.png`, `india-final-closing-390.png`.
- Ficha y ubicacion: `india-final-place-taj-mahal-390.png`, `india-final-place-location-390.png`.

## Comprobaciones

- 390x844 y 360x800: no existe desbordamiento horizontal; el scroll width medido queda dentro del viewport.
- Las cuatro portadas siguen disponibles mediante `?portada=a`, `?portada=b`, `?portada=c` y `?portada=d`.
- La portada A ocupa la primera pantalla con horizontal dominante y dos verticales; el titulo queda en la zona inferior oscura y no tapa el Taj Mahal.
- El indice es discreto, desplegable y permite saltar a Delhi, Jaipur, Agra y a las nueve jornadas.
- Las fotografias de entrada, los mosaicos y las galerias se mantienen dentro del ancho movil. Las capturas se tomaron tras esperar la carga diferida.
- Las galerias empiezan cerradas. Al abrirlas, el visor permite anterior/siguiente, contador, cierre y Escape; las verticales usan `contain` y los videos tienen controles, estan silenciados y no arrancan solos.
- El cierre muestra unicamente `India`, `2-10 de septiembre de 2018`, `Volver al inicio` y `Abrir el album completo`.
- Las fichas muestran zona, ciudad, coordenadas cotejadas cuando existe un punto inequivoco y enlace externo a OpenStreetMap. Los casos sin coordenada inequivoca usan una busqueda nominal.
- Los textos publicos y los `alt` no contienen confianza, provisionalidad, validacion interna ni notas tecnicas.

## Severidad

### Criticos

Ninguno encontrado.

### Mejoras recomendadas

- Valorar en una fase editorial posterior si se reincorpora alguno de los candidatos listados en `docs/india-place-review.md`.
- El nombre del hotel de Agra se mantiene como `Hotel en Agra` porque no existe un nombre confirmado.

### Detalles menores

- La composicion conserva `contain` en medios verticales y panoramicos para no recortar informacion; puede dejar espacio oscuro alrededor de alguna imagen dentro del mosaico.
