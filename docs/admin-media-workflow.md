# Flujo del gestor editorial

## Crear y publicar un viaje

1. Entra en `/admin/viajes` y crea un borrador.
2. Completa titulo, slug, fechas, introduccion, ruta, cierre y modo de portada.
3. Crea al menos una jornada y una portada con medios asignados.
4. Crea los lugares y vincula cada ficha a una o varias jornadas.
5. Revisa el estado del viaje y abre `/admin/viajes/<slug>/preview`.
6. Publica solo cuando la validacion no muestre errores.

Los borradores se leen mediante la sesion SSR del administrador. No se abre la RLS publica para borradores.

## Subida directa a R2

El panel pide una URL presignada por archivo. La ruta servidor comprueba sesion, pertenencia a `admin_users`, viaje, tipo, extension y tamaño. La clave se genera en servidor y no acepta rutas locales, URL externas ni segmentos `..`.

El navegador:

- prepara imagen web y miniatura WebP con canvas;
- puede subir un poster manual para videos;
- calcula SHA-256 del original para detectar duplicados;
- sube con `PUT` directamente a R2;
- muestra progreso y permite reintentar;
- confirma el objeto remoto antes de insertar el registro en Supabase.

La API no recibe el binario. Supabase guarda `storage_key`, `thumbnail_key` y `poster_key` como claves relativas. Los objetos se sirven desde R2 y no se eliminan fisicamente desde el panel.

La subida directa necesita una regla CORS en el bucket R2. Permite `PUT`, `GET` y `HEAD` desde `http://localhost:3000` y `https://travel-magnets.vercel.app`, con las cabeceras `Content-Type`, `Cache-Control` y `x-amz-*`. No incluyas credenciales R2 en esa regla.

## Limites

- JPG, JPEG, PNG y WebP: 25 MB por archivo.
- MP4: 250 MB por archivo.
- Miniaturas y posters: 10 MB.
- No se aceptan HEIC, MOV, SVG, ejecutables ni formatos desconocidos.

La comprobacion de MIME y extension se hace en servidor. Las imagenes derivadas no conservan los metadatos privados del original porque se vuelven a renderizar en canvas. La duracion de un video se obtiene en el navegador cuando el contenedor lo permite.

## Revision de candidatos de India

Los candidatos de India se registran con hash de origen y metadatos editoriales. La recuperacion completada dejo 114 medios `selected`; los futuros candidatos pueden revisarse en el gestor de medios:

- pendiente: registrado pero no visible;
- seleccionado: puede aparecer tras asignarlo;
- rechazado: conserva el registro y el motivo, sin borrar objetos.

Para recuperar uno, selecciona el archivo original externo, deja que el navegador prepare los derivados, subelo y asignalo a jornada, lugar y rol. Los hashes y la clave unica evitan duplicar un candidato ya registrado.

## Asignaciones

Un objeto puede tener varias asignaciones sin duplicarse: portada, jornada, galeria, video destacado, lugar y cierre. El orden vive en la asignacion. El foco se conserva en el medio y en los slots de portada.

## NFC y QR

Cada viaje puede tener codigos unicos. Un codigo inactivo devuelve 404 en `/n/<code>`. Activarlo requiere que el viaje este publicado y solo puede existir un codigo activo por viaje. El QR apunta a la misma ruta; la etiqueta fisica queda fuera de este sistema.
