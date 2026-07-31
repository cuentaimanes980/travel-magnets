# Guia de contribucion para agentes

- Mantener el contenido de viaje en `data/` y los contratos en `types/`.
- Usar recursos locales en `public/demo/` para prototipos; no enlazar medios remotos efimeros.
- Modelar el contenido editorial con `ContentBlock` antes de crear componentes ad hoc.
- Priorizar la experiencia movil, contraste, textos alternativos y `prefers-reduced-motion`.
- No introducir Supabase, R2, autenticacion o credenciales sin una tarea que lo autorice.
- Ejecutar `npm run lint`, `npm test` y `npm run build` antes de entregar cambios.
