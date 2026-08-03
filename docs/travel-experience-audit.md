# Auditoría editorial y de experiencia de los álbumes

Fecha de revisión: 3 de agosto de 2026.

## Causa de las repeticiones

No se encontraron duplicados de objetos por `storage_key` ni por `source_path_hash` en ninguno de los cinco viajes. La causa era una asignación editorial intencionada pero no deduplicada: la misma fila de `media` aparecía como `place_cover` y como `place` del mismo lugar. La página pública no colocaba siempre `place_cover` delante de la galería y la capa de presentación construía las listas sin una identidad común.

La corrección se aplica en la capa de selección pública y en el editor:

- deduplicación por `media_id`, clave R2, hash de origen y URL;
- `place_cover` primero, seguido de `place_gallery`;
- exclusión de la portada de la primera miniatura;
- ningún relleno artificial de slots;
- mosaicos deterministas que separan orientación, tipo y contexto cuando hay opciones;
- advertencias administrativas cuando se repite una clave, un hash o una portada dentro de la galería del mismo lugar.

## Lugares afectados

- India: 14 lugares.
- Crucero: 15 lugares inicialmente; `A bordo del crucero` se convirtió en sección editorial y quedan 14 lugares geográficos/contextuales.
- Liverpool: 6 lugares.
- Londres 2025: 4 lugares.
- Frankfurt: 4 lugares.

La repetición de roles afectaba a los lugares que tenían portada y galería asignadas sobre el mismo medio. No fue necesario borrar medios ni cambiar objetos R2.

## Navegación

- La portada tiene `Empezar el viaje`, con desplazamiento suave, foco accesible en `#resumen` y respeto de `prefers-reduced-motion`.
- El índice visual aparece inmediatamente después de la portada e incluye jornadas, secciones especiales, álbum completo y cierre.
- El indicador de progreso muestra jornada, total, título breve, ciudad y porcentaje; aparece solo al entrar en la primera jornada y se oculta durante el visor.
- Cada jornada tiene una tarjeta `Continuar` con miniatura, fecha, destino y enlace al siguiente bloque.
- La última jornada enlaza al cierre.
- No hay `scroll-snap` obligatorio ni listeners que conviertan cualquier toque en scroll.
- Las galerías mantienen sus estados cerrados, sus filtros, el visor con `contain`, teclado y `Escape`.

## Crucero

### Cambios de estructura

| Entidad anterior | Tipo anterior | Nuevo tipo | Medios reasignados | Nueva ubicación | Motivo |
| --- | --- | --- | ---: | --- | --- |
| A bordo del crucero | Lugar genérico | Sección editorial | 24 únicos | Cinco interludios y `A bordo` completo | El barco es contexto de navegación, no un destino geográfico |

La migración `20260807_000006_cruise_editorial_sections.sql` conserva los 190 registros de medios y elimina únicamente la ficha redundante después de transferir sus relaciones. El crucero queda con:

- `Embarque y primeras horas`: 1 medio, después del día 0.
- `Vida a bordo`: 7 medios, después del día 1.
- `Navegación entre islas`: 3 medios, después del día 4.
- `Atardeceres en cubierta`: 9 medios, después del día 6.
- `Última noche`: 4 medios, después del día 7.
- `A bordo`: 24 medios únicos, galería completa cerrada inicialmente.

La fuente del crucero contiene un vídeo, pero pertenece a `Faliraki Beach`; no existe un vídeo de barco que pueda añadirse sin inventar una asociación. El vídeo permanece en su jornada y filtro correspondiente.

## Revisión por viaje

### India

Se mantiene la estructura de nueve jornadas, las portadas y los 14 lugares. Se corrigió la selección de portadas y miniaturas de lugares, y la jornada sin ficha propia usa ahora su ubicación real en vez de un fallback heredado de India.

### Liverpool

Las secciones `Calles de Liverpool` y `Recuerdos del album` siguen al final, cerradas inicialmente. La selección no altera sus portadas ni convierte automáticamente fotos del álbum físico en portada.

### Londres 2025

Se conserva exactamente el título y slug publicados. Las cuatro fichas tienen selección deduplicada y las dos jornadas no comparten su primera selección por efecto de la nueva capa pública.

### Frankfurt

Se mantienen las cuatro jornadas y los 71 medios. Los mosaicos usan selección estable y se distribuyen sin rellenar con repeticiones.

## Validación

- Rutas comprobadas: India, Crucero Venecia e Islas Griegas, Liverpool, Londres 2025 y Frankfurt.
- Viewports: 360×800, 390×844 y 1280×900.
- Overflow horizontal: ninguno.
- Galerías cerradas inicialmente: todas.
- Medios visibles: R2 en las cinco rutas; sin `/demo/india/real`, localhost ni proxy de Vercel.
- Vídeos: 18/18 responden `206` con solicitudes `Range`.
- Visor: `object-fit: contain`, cierre con botón y `Escape`.
- Portada: las variantes existentes siguen seleccionables por `portada`; la carga normal ya no elige una variante aleatoria en cada visita.
- Índice, `Empezar el viaje`, tarjetas `Continuar`, anclas y foco accesible: comprobados.
- Lint: correcto.
- Tests: 3/3 correctos.
- Build aislado fuera de OneDrive: correcto.

## Pendiente

- La separación de fotografías casi idénticas se basa en metadatos, orientación, tipo, ciudad y orden editorial. No se ha añadido análisis perceptual pesado.
- Next mantiene el aviso no bloqueante de que la convención `middleware` será sustituida por `proxy`.
- No se han creado cambios de NFC, nuevos objetos R2 ni originales locales.
