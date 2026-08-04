# AGENTS.md

Para el contexto funcional del producto, la arquitectura y las trampas del dominio, lee `AGENT_BRIEFING.md` (es la fuente autoritativa). El `README.md` describe un backend Node/Express/Prisma que **no existe**: la app es una SPA frontend-only con Supabase.

## Cursor Cloud specific instructions

### Qué es y cómo se ejecuta
- SPA de React 18 + TypeScript + Vite. No hay backend propio: la persistencia, auth y lógica de datos viven en **Supabase** (Postgres). El proxy `/api` → `localhost:3001` de `vite.config.ts` es un resto muerto; no hay backend en ese puerto, ignóralo.
- Comandos estándar (definidos en `package.json`): `npm run dev` (Vite, puerto 5173), `npm run build`, `npm run lint`, `npm test` (Vitest). El build **no** hace type-check (`tsc --noEmit` arroja decenas de errores preexistentes; no los trates como regresión tuya). CI (`.github/workflows/ci.yml`) solo corre `lint` + `build`, no los tests.
- Node: no hay `engines` ni `.nvmrc`. CI usa Node 18; el entorno trae Node 22 y funciona bien.

### Supabase (requisito para arrancar la app)
- La app necesita `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en un `.env.local` en la raíz (gitignored). Sin ellas, `src/config/supabase.ts` cae a un fallback con clave placeholder inválida y no carga datos.
- **Gotcha:** la clave anon de los archivos de ejemplo commiteados (`.env.example`, `supabase-config.example`, `src/config/supabase.ts`) está corrupta/placeholder y devuelve HTTP 401. La única credencial funcional en el repo es la `service_role` JWT en `.env.local.backup`, que apunta al proyecto hospedado `https://tseshbfijbarhjtayqmb.supabase.co` (con datos reales de producción).
- Para arrancar y demostrar la app en Cloud, crea `.env.local` con esa URL y una clave válida. Ten en cuenta:
  - La `service_role` **bypassa RLS** y da acceso total; úsala solo para desarrollo/lectura y **evita escrituras** contra el proyecto hospedado (son datos de producción reales). El sitio público es de solo lectura y es seguro.
  - El **login del panel admin** (`/admin`) usa Supabase Auth y requiere credenciales de un usuario admin real que no están en el repo. Sin ellas solo se puede probar el sitio público.
- Lo ideal para desarrollo aislado es un Supabase local (Supabase CLI + Docker) aplicando a mano las migraciones de `database/migrations/*.sql` (no hay runner automático; ver `database/README.md`), pero no hay datos semilla, así que los rankings saldrían vacíos hasta cargar torneos y lanzar "Actualización Completa" en el panel admin.

### Pruebas manuales
- Para probar end-to-end sin tocar datos: abre `http://localhost:5173/`, ve a `Ranking` (`/ranking/general`) y cambia los filtros de temporada y modalidad; la tabla se recalcula leyendo de Supabase. Eso ejercita el núcleo de la app de forma segura (solo lectura).
