# India automatic recovery plan

Estado: aplicado en Supabase y Cloudflare R2 el 3 de agosto de 2026. Sin commit ni push.

## Resumen

- Candidatos analizados: 68.
- Recuperacion propuesta inicialmente: 25 imagenes, todas para galeria.
- Decision posterior: incorporar los 68 candidatos preparados por indicacion expresa, sin sustituir portadas ni fotos principales.
- Recuperacion aplicada: 63 imagenes y 5 videos, todos seleccionados.
- Recuperacion principal o portada: 0.
- Videos recuperados: 5, sin poster nuevo.
- Rechazo editorial previo: 41; queda como referencia de la primera seleccion, no como exclusion operativa final.
- Excepciones previas: 2; se incorporaron al lote ampliado sin convertirlas en portada o medio principal.
- Hash exacto coincidente con un medio activo: 0.
- Objetos R2 nuevos: 131: 63 WebP completos, 63 miniaturas WebP y 5 videos MP4.
- Objetos R2 de India tras la operacion: 220; peso total: 156.018.465 bytes.
- Registros nuevos en Supabase: 68; total de medios de India: 114.
- Asignaciones nuevas: 113: 68 `day_gallery` y 45 `place`. Los cinco videos se mantienen en las galerias diarias para no sustituir los videos destacados existentes.
- Posters previstos: 0.
- Cambios en portada o fotos principales: ninguno.

La comparacion combina nombre, fecha, hora, carpeta, dimensiones, candidatos de lugar, hash SHA-256 y una comparacion perceptual basica sobre miniaturas. La revision visual se hizo sobre copias temporales; los originales no se modificaron.

## Recuperar para galeria

Todas estas entradas se registrarian como `selected`, con rol `day_gallery` y entrada automatica en el album completo. Cuando el lugar esta confirmado, tambien se propone una asignacion `place` para la galeria de esa ficha. No se propone `day_hero`, `day_mosaic`, `place_cover`, `hero` ni `closing`.

| Archivo | Jornada | Lugar | Similar activo | Confianza | Motivo |
|---|---|---|---|---|---|
| IMG_20180904_071633_QutbMinar.jpg | 2018-09-04 | Qutb Minar | IMG_20180904_074253__QutbMinar.jpg | medium | Perspectiva interior distinta y horizontal. |
| IMG_20180904_085442_Templo del Loto.jpg | 2018-09-04 | Templo del Loto | IMG_20180904_090821__Templo del Loto.jpg | medium | Personas y contexto exterior que completan la ficha. |
| IMG_20180904_105938_QutbMinar.jpg | 2018-09-04 | Qutb Minar | IMG_20180904_103556_QutbMinar.jpg | medium | Orientacion vertical y encuadre complementario. |
| IMG_20180904_151914_Swaminarayan Akshardham.jpg | 2018-09-04 | Sin lugar confirmado | Ninguno | high | Lugar y actividad no representados en los medios activos; solo galeria de jornada. |
| IMG_20180904_152043_Lapiscinadelhoteldedelhi.jpg | 2018-09-04 | Sin lugar confirmado | VID_20180904_151914_Lapiscinadelhoteldedelhi2.mp4 | high | Fotografia de piscina que completa el video existente. |
| IMG_20180905_074203_CallesDelhi.jpg | 2018-09-05 | Trayecto | VID_20180905_074203_Eltraficodedelhi2.mp4 | medium | Fotografia del trafico junto al video activo. |
| IMG_20180905_110751_Vacas de camino a Jaipur.jpg | 2018-09-05 | Trayecto | IMG_20180905_124934_Recorridoen4x4hastaelpalaciodelosmaharaha.jpg | high | Actividad de viaje no presente en la seleccion actual. |
| IMG_20180905_131307_Shahpura Haveli.jpg | 2018-09-05 | Shahpura Haveli | IMG_20180905_130747_Shahpura Haveli.jpg | medium | Perspectiva con personas y color interior. |
| IMG_20180905_143748_Shahpura Haveli.jpg | 2018-09-05 | Shahpura Haveli | IMG_20180905_131133_Shahpura Haveli.jpg | high | Interaccion con personas, diferente a los encuadres activos. |
| IMG_20180905_144555_Recorridoen4x4hastaelpalaciodelosmaharaha.jpg | 2018-09-05 | Trayecto | IMG_20180905_143905_Recorridoen4x4hastaelpalaciodelosmaharaha.jpg | medium | Vista horizontal del trayecto. |
| IMG_20180906_082740_Amber Fort.jpg | 2018-09-06 | Amber Fort | IMG_20180906_081132_recorridoelefantesjaipur_Amber Fort.jpg | high | Vista amplia del recinto, valida para galeria. |
| IMG_20180906_085637_Amber Fort.jpg | 2018-09-06 | Amber Fort | IMG_20180906_081135_recorridoelefantesjaipur_Amber Fort.jpg | medium | Encuadre desde una ventana, aporta profundidad. |
| IMG_20180906_090005_Vistas desde el Amber Fort.jpg | 2018-09-06 | Amber Fort | IMG_20180906_081135_recorridoelefantesjaipur_Amber Fort.jpg | high | Paisaje y vista general no presentes en la seleccion activa. |
| IMG_20180906_122251_Amber Fort.jpg | 2018-09-06 | Amber Fort | IMG_20180906_181156_recorridoelefantesjaipur_Amber Fort.jpg | medium | Personas y arquitectura en otro punto del recinto. |
| IMG_20180906_124002_Recorridoentuktukporjaipur.jpg | 2018-09-06 | Trayecto | IMG_20180906_123856_Recorridoentuktukporjaipur.jpg | medium | Otra perspectiva del tuk-tuk. |
| IMG_20180906_141316_visitafabricaalfombras.jpg | 2018-09-06 | Fabrica de alfombras de Jaipur | Ninguno | high | Actividad especifica no representada. |
| IMG_20180906_141611_visitafabricaalfombras.jpg | 2018-09-06 | Fabrica de alfombras de Jaipur | Ninguno | high | Trabajo y personas; completa la actividad. |
| IMG_20180906_141905_visitafabricaalfombras.jpg | 2018-09-06 | Fabrica de alfombras de Jaipur | Ninguno | high | Detalle adicional de la actividad. |
| IMG_20180908_083222_TajMahal.jpg | 2018-09-08 | Taj Mahal | IMG_20180908_083626_govindeneltajmahal.jpg | medium | Puerta de entrada y contexto del acceso. |
| IMG_20180908_084128_TajMahal.jpg | 2018-09-08 | Taj Mahal | IMG_20180908_083656_tajmahal.jpg | medium | Retrato de viaje frente al monumento. |
| IMG_20180908_084131_Fotogrupaltajmajal.jpg | 2018-09-08 | Taj Mahal | Ninguno | high | Fotografia de grupo que documenta el viaje. |
| IMG_20180908_092914_TajMahal.jpg | 2018-09-08 | Taj Mahal | IMG_20180908_093240_TajMahal.jpg | medium | Interior y visitantes, perspectiva diferente. |
| IMG_20180908_095151_TajMahal.jpg | 2018-09-08 | Taj Mahal | IMG_20180908_093240_TajMahal.jpg | medium | Vista amplia con cielo dramatico. |
| IMG_20180908_095352_anipidefotos_TajMahal.jpg | 2018-09-08 | Taj Mahal | IMG_20180908_101257_tajmahal.jpg | high | Encuentro con personas y monjes, contenido nuevo. |
| IMG_20180908_180226_TajMahal.jpg | 2018-09-08 | Taj Mahal | IMG_20180908_093240_TajMahal.jpg | medium | Vista de tarde que amplia la secuencia del monumento. |

Distribucion propuesta: 5 medios para el 4 de septiembre, 5 para el 5, 8 para el 6 y 7 para el 8. Las asignaciones de lugar serian 19 y las de jornada 25. Los 6 restantes quedarian solo en la galeria de la jornada y el album completo.

La distribucion anterior corresponde a la propuesta editorial inicial de 25 medios. La ejecucion ampliada quedo distribuida por jornada asi: 13 medios el 4 de septiembre, 13 el 5, 16 el 6, 6 el 7 y 20 el 8. El album completo incluye los 68 medios nuevos porque todos quedaron en `selected`; las galerias siguen cerradas inicialmente en la interfaz publica.

## Excepciones

| Archivo | Jornada | Lugar | Confianza | Accion |
|---|---|---|---|---|
| IMG_20180907_11281_Chand Baori.jpg | 2018-09-07 desconocida | Chand Baori | low | `manual_exception`: sin fecha ni hora; ademas parece variante del medio activo. No subir. |
| IMG_20180907_162919_Laxmi Vilas Palace.jpg | 2018-09-07 | Laxmi Vilas Palace | low | `manual_exception`: la arquitectura no coincide con suficiente seguridad con la secuencia activa. No subir. |

## Rechazados

Los siguientes no generan objetos ni registros seleccionados. En caso de necesitar trazabilidad, se pueden registrar como `rejected` con el motivo indicado.

### reject_burst: 28

`VID_20180904_112408_Lavidaenlascallesdedehli2.mp4`, `VID_20180904_112408_Lavidaenlascallesdedehli3.mp4`, `IMG_20180904_112408_CallesDelhi.jpg`, `IMG_20180904_113810_CallesDelhi.jpg`, `IMG_20180904_152007_Lapiscinadelhoteldedelhi.jpg`, `VID_20180905_074203_Eltraficodedelhi3.mp4`, `VID_20180905_124934_Recorridoen4x4hastaelpalaciodelosmaharaha3.mp4`, `VID_20180905_124934_Recorridoen4x4hastaelpalaciodelosmaharaha4.mp4`, `IMG_20180905_131315_Shahpura Haveli.jpg`, `IMG_20180905_143937_Recorridoen4x4hastaelpalaciodelosmaharaha.jpg`, `IMG_20180906_083002_Amber Fort.jpg`, `IMG_20180906_083109_Amber Fort.jpg`, `IMG_20180906_085725_Amber Fort.jpg`, `IMG_20180906_085939_Amber Fort.jpg`, `IMG_20180906_090358_Amber Fort.jpg`, `IMG_20180906_095000_Amber Fort.jpg`, `IMG_20180906_095057_Amber Fort.jpg`, `IMG_20180907_141703_Laxmi Vilas Palace.jpg`, `IMG_20180907_141717_Laxmi Vilas Palace.jpg`, `IMG_20180907_141953_Laxmi Vilas Palace.jpg`, `IMG_20180908_084130_TajMahal.jpg`, `IMG_20180908_084131_TajMahal.jpg`, `IMG_20180908_084136_TajMahal.jpg`, `IMG_20180908_084411_TajMahal.jpg`, `IMG_20180908_084655_TajMahal.jpg`, `IMG_20180908_085757_TajMahal.jpg`, `IMG_20180908_091659_TajMahal.jpg`, `IMG_20180908_181746_TajMahal.jpg`.

Motivo: misma secuencia temporal, encuadre casi identico o variante de video ya seleccionado.

### reject_duplicate: 9

`IMG_20180908_084129_TajMahal.jpg`, `IMG_20180908_100040_anipidefotos_TajMahal.jpg`, `IMG_20180908_100519_TajMahal.jpg`, `IMG_20180908_101408_lepidenfotoacarlos_TajMahal.jpg`, `IMG_20180904_112404_CallesDelhi.jpg`, `IMG_20180904_122620_Templo del Loto.jpg`, `IMG_20180905_110232_CallesDelhi.jpg`, `IMG_20180905_125225_Recorridoen4x4hastaelpalaciodelosmaharaha.jpg`, `IMG_20180906_080136__recorridoelefantesjaipur_Amber Fort.jpg`.

Motivo: repeticion editorial de un contenido ya suficientemente representado. No se encontro coincidencia binaria exacta; es un rechazo por similitud y densidad narrativa.

### reject_quality: 1

`IMG_20180907_091456_CallesJaipur.jpg`.

Motivo: encuadre y calidad inferiores frente a la secuencia activa.

### reject_irrelevant: 3

`IMG_20180904_143942_CallesDelhi.jpg`, `IMG_20180905_162750_CallesDelhi.jpg`, `IMG_20180908_092757.jpg`.

Motivo: no aportan una actividad, lugar o perspectiva suficientemente nueva para el album.

## Estado operativo final

La politica CORS del bucket fue configurada manualmente para `http://localhost:3000` y `https://travel-magnets.vercel.app`, con `GET`, `HEAD` y `PUT`. El preflight local respondio `204` con los metodos y cabeceras necesarias.

La prueba temporal del gestor se completo con URL presignada, PUT directo, verificacion, registro temporal y limpieza controlada. Los objetos temporales y el registro temporal fueron eliminados.

La recuperacion ampliada se ejecuto de forma idempotente: se reutilizaron los registros y objetos coincidentes, se verificaron 131 objetos publicos, todos con MIME, tamano, `Cache-Control`, ETag y SHA-256 correctos. Los cinco videos respondieron a solicitudes `Range` con HTTP 206.

Politica CORS aplicada, sin origen comodin:

- Origenes: `https://travel-magnets.vercel.app` y `http://localhost:3000`.
- Metodos: `PUT`, `HEAD`, `GET`.
- Cabeceras: `Content-Type`, `Cache-Control` y cabeceras `x-amz-*` necesarias para la firma.
