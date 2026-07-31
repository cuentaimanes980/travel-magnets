# Hoja de ruta

1. **Piloto local:** completado para India con contenido editorial, medios optimizados, portada variable, galerías, visor, lugares y revisión móvil.
2. **Persistencia inicial:** esquema versionado, RLS, repositorio Supabase opcional, seed determinista y comparación local/remota preparados. La aplicación mantiene local por defecto hasta migrar y verificar el proyecto.
3. **Administración:** Supabase Auth, roles, edición de bloques, borradores y publicación controlada.
4. **Medios:** migración futura de derivados y originales a Cloudflare R2, cargas directas con URLs firmadas, miniaturas y vídeo optimizado. No se usará Supabase Storage para este plan.
5. **NFC:** activar enlaces administrados en Supabase y programar tags físicos cuando el contenido publicado esté verificado. `/n/[code]` ya proporciona la resolución de lectura.
6. **Operación:** copias de seguridad, observabilidad, analítica consciente de la privacidad y validación automática de medios.
