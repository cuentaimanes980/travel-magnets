# Importacion de Crucero Venecia e Islas Griegas

## Estado

- Estado: borrador, no publicado.
- Slug: `crucero-venecia-islas-griegas`.
- Origen: `Downloads/fotos para imanes/Crucero Islas Griegas` (ruta local no versionada).
- Fechas detectadas: del 2 al 9 de septiembre de 2012.
- Preview privado local: `http://localhost:3001/admin/viajes/crucero-venecia-islas-griegas/preview`.
- Los originales de Downloads no se modifican.

## Inventario

- Carpetas con medios: 8 carpetas principales y 13 subcarpetas.
- `Salida-aeropuerto 02-09-12`: 5 archivos.
- `Venecia 03-09-12`: 40 archivos, con calles y canales, Plaza de San Marcos, Riva degli Schiavoni y salida por el Canal de la Giudecca.
- `Dubrovnik 04-09-12`: 27 archivos, con Buza Beach y calles de Dubrovnik.
- `Corfu 05-09-12`: 15 archivos, con calles de Corfu y Faliraki Beach.
- `Olimpia 06-09-12`: 20 archivos.
- `Crucero`: 24 archivos, con camarote, escenas a bordo y cenas.
- `Santorini 08-09-12`: 29 archivos, con el barco a Santorini.
- `Atenas 09-09-12`: 31 archivos, con calles, Estadio Panathinaiko y Parthenon.
- Archivos encontrados: 191 (190 JPG y 1 AVI).
- Bytes de originales: 522250452.

## Itinerario y jornadas

| Dia | Fecha | Jornada | Medios importados |
| --- | --- | --- | ---: |
| 0 | 2012-09-02 | Salida desde Espana | 5 |
| 1 | 2012-09-03 | Venecia | 41 |
| 2 | 2012-09-04 | Dubrovnik | 28 |
| 3 | 2012-09-05 | Corfu | 19 |
| 4 | 2012-09-06 | Olimpia | 24 |
| 5 | 2012-09-07 | Navegacion a bordo | 4 |
| 6 | 2012-09-08 | Santorini | 33 |
| 7 | 2012-09-09 | Atenas | 36 |

La navegacion del 7 de septiembre se conserva como jornada propia porque la secuencia de carpetas deja un intervalo entre Olimpia y Santorini. El contenido de `Crucero` se reparte por secuencia y contexto: la imagen de camarote queda en la salida; las cenas se distribuyen entre los dias 1 a 7; y las escenas restantes del barco se distribuyen entre los dias 3 a 7. No se crea una unica jornada artificial con toda la carpeta.

## Medios y criterios

- Medios importados y seleccionados: 190 (189 imagenes y 1 video).
- Portadas de viaje, principales de jornada, galerias, lugares, cierre y album completo se resuelven mediante asignaciones; las galerias permanecen cerradas inicialmente.
- Se conserva todo el material salvo un duplicado exacto: `Salida-aeropuerto 02-09-12/S6300731.JPG`.
- No se descartaron rafagas ni fotos por calidad; se conservaron las fotos personales utiles para documentar el viaje.
- Las fechas de las carpetas son la fuente de verdad. Los metadatos EXIF presentan fechas inconsistentes y no se usan para reordenar el album.
- El AVI se convierte localmente a MP4 H.264/AAC y se genera un poster WebP. No quedan medios incompatibles en R2.

## R2 y Supabase

- Objetos R2: 380 (189 completos, 189 miniaturas, 1 video y 1 poster).
- Bytes derivados: 95465358.
- Claves: `trips/crucero-venecia-islas-griegas/images/full/`, `images/thumbs/`, `videos/` y `posters/`.
- Repeticion idempotente: 0 subidas nuevas y 380 objetos omitidos por hash coincidente.
- Registros de medios: 190.
- Asignaciones: 437.
- Jornadas: 8.
- Fichas de lugar: 15.
- Variantes de portada: A, B, C y D; A activa en el borrador, B y C en mosaico, D con video y dos fotografias de respaldo.
- Verificacion: faltantes 0, errores publicos 0, errores Range 0, conflictos 0.

## Lugares y Wikipedia

Enlaces del crucero verificados en Wikipedia en espanol:

- Venecia: <https://es.wikipedia.org/wiki/Venecia>
- Plaza de San Marcos: <https://es.wikipedia.org/wiki/Plaza_de_San_Marcos>
- Riva degli Schiavoni: <https://es.wikipedia.org/wiki/Riva_degli_Schiavoni>
- Canal de la Giudecca: <https://es.wikipedia.org/wiki/Canal_de_la_Giudecca>
- Dubrovnik: <https://es.wikipedia.org/wiki/Dubrovnik>
- Corfu: <https://es.wikipedia.org/wiki/Corf%C3%BA>
- Olimpia: <https://es.wikipedia.org/wiki/Olimpia>
- Santorini: <https://es.wikipedia.org/wiki/Santorini>
- Atenas: <https://es.wikipedia.org/wiki/Atenas>
- Partenon: <https://es.wikipedia.org/wiki/Parten%C3%B3n>
- Estadio Panatenaico: <https://es.wikipedia.org/wiki/Estadio_Panathinaik%C3%B3>

Se mantienen sin enlace por no existir un articulo espanol especifico adecuado: Salida desde Espana, Buza Beach, Faliraki Beach y A bordo del crucero.

En India solo se actualizaron enlaces verificados, sin cambiar textos, medios ni asignaciones:

- Jama Masjid: <https://es.wikipedia.org/wiki/Mezquita_Aljama_de_Delhi>
- Gurdwara Bangla Sahib: <https://es.wikipedia.org/wiki/Gurdwara_Bangla_Sahib>
- Raj Ghat: <https://es.wikipedia.org/wiki/Raj_Ghat>
- Qutb Minar: <https://es.wikipedia.org/wiki/Complejo_de_Qutb>
- Templo del Loto: <https://es.wikipedia.org/wiki/Templo_del_loto>
- Amber Fort: <https://es.wikipedia.org/wiki/Fuerte_Amber>
- Jal Mahal: <https://es.wikipedia.org/wiki/Jal_Mahal>
- Chand Baori: <https://es.wikipedia.org/wiki/Chand_Baori>
- Taj Mahal: <https://es.wikipedia.org/wiki/Taj_Mahal>
- Fuerte de Agra: <https://es.wikipedia.org/wiki/Fuerte_de_Agra>

Shahpura Haveli, fabrica de alfombras, Laxmi Vilas Palace y Hotel en Agra quedan con `wikipedia_url = null`.

## Validacion

- Viaje de prueba eliminado junto con sus objetos R2 exclusivos; India no se altero salvo los enlaces Wikipedia indicados.
- El slug de prueba ya no existe y sus rutas publica y de preview devuelven 404.
- El crucero sigue en `draft` y no tiene enlaces NFC activos.
- Todos los objetos publicos responden correctamente; el video admite Range con HTTP 206.
- Las galerias aparecen cerradas inicialmente.
- Preview comprobado en 360x800, 390x844 y escritorio: sin overflow horizontal, sin errores de consola y con medios cargados desde R2.
- Se corrigieron los enlaces internos de lugares para que el preview use el slug del viaje en vez de asumir India.
- `npm run lint`: correcto.
- `npm test`: correcto, 3 pruebas superadas.
- `npm run build`: correcto en copia aislada fuera de OneDrive. Queda solo el aviso no bloqueante de deprecacion de `middleware` de Next.js.
- `git diff --check`: correcto.

## Archivos pendientes de commit

- `docs/crucero-venecia-islas-griegas-import-report.md`
- `scripts/import-cruise.ts`
- `supabase/migrations/20260805_000004_place_wikipedia.sql`
- Cambios de soporte en `types/`, `lib/`, `components/`, `app/admin/`, `package.json` y `package-lock.json`.

No se ha creado commit ni se ha hecho push.
