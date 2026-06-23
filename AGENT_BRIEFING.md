# FEDV Ranking — Briefing para agentes IA

> Documento de arranque para un agente de IA que vaya a trabajar en este repo.
> Es un resumen funcional y orientado a la acción: dónde está cada cosa, cómo
> funciona el cálculo del ranking y qué convenciones/trampas tener en cuenta.
> Para narrativa de producto, ver `README.md` (pero ojo: está parcialmente
> **desactualizado**, ver §2).

---

## 1. Qué es

Sistema de **ranking oficial de la Federación Española de Disco Volador (FEDV)**
para equipos de Ultimate Frisbee. Una **SPA** (panel de administración + sitio
público) que calcula y muestra rankings por temporada a partir de resultados de
torneos. No hay backend propio: **toda la persistencia y la lógica viven en el
frontend + Supabase (Postgres)**.

Dominio en una frase: hay **torneos** con **posiciones** (equipo → puesto →
puntos); los puntos se agregan por **equipo + temporada + modalidad** y se
ordenan en **rankings**.

---

## 2. Stack y arquitectura real

- **Frontend**: React 18 + TypeScript + **Vite**, Tailwind CSS.
- **Estado/datos**: `@tanstack/react-query`, `react-router-dom`.
- **Backend/DB**: **Supabase** (Postgres + Auth + RLS). Cliente en
  `src/services/supabaseService.ts`. No hay API Node/Express/Prisma.
- **UI**: `lucide-react` (iconos), `@dnd-kit/*` (drag&drop de posiciones),
  `react-hot-toast`, `recharts`, `framer-motion`, `react-hook-form` + `zod`.
- **Import/Export**: `exceljs`, `papaparse`, `react-dropzone`, `xlsx`.
- **Tests**: **Vitest** (`vitest.config.ts`, setup en `src/test/setup.ts`).

> ⚠️ **El `README.md` miente en parte**: habla de "backend Node.js + Express +
> Prisma", "JWT", carpetas `frontend/` `backend/` `shared/`. Eso **no existe**.
> La realidad: monorepo plano de frontend, **Supabase-only**, auth vía Supabase.
> No te fíes de esa sección del README.

---

## 3. Arranque rápido

```bash
npm install
npm run dev            # Vite dev server (puerto 5173)
npm run build          # build de producción (NO hace type-check, ver §10)
npm run lint           # eslint (config en .eslintrc.cjs)
npm test               # Vitest (no corre en CI, ver §10)
```

Variables de entorno (ver `.env.example`): credenciales de Supabase
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, etc.). Scripts de mantenimiento
puntual leen `.env.local`:

```bash
npm run backfill-regional-coefficients   # recalcula coeficientes regionales (service role)
npm run backfill-slugs                    # slugs de equipos
npm run backfill-region-slugs             # slugs de regiones
```

---

## 4. Modelo de dominio

| Concepto | Valores | Notas |
|---|---|---|
| **Tipo de torneo** (`type`) | `CE1`, `CE2`, `REGIONAL` | CE1 = Campeonato España 1ª; CE2 = 2ª; REGIONAL = autonómico |
| **Superficie** (`surface`) | `GRASS` (césped), `BEACH` (playa), `INDOOR` | |
| **Categoría** (`category`) | `OPEN`, `WOMEN`, `MIXED` | antes se llamaba `modality` (migración 011) |
| **Modalidad** (clave interna) | `beach_mixed`, `beach_open`, `beach_women`, `grass_mixed`, `grass_open`, `grass_women` | `surface.toLowerCase()_category.toLowerCase()` |
| **Temporada** (`season`) | `"2024-25"` | empieza el 15 de septiembre; `year` = año de inicio |

**Subtemporadas** (4): 1=`beach_mixed`, 2=`beach_open`+`beach_women`,
3=`grass_mixed`, 4=`grass_open`+`grass_women`. Los rankings combinan la
temporada actual + 3 anteriores con **pesos temporales `[1.0, 0.8, 0.5, 0.2]`**.

**Estructura real con regionales**: la 1ª división tiene **16 equipos** y la 2ª
otros **16** (ver §6, offset).

---

## 5. Modelo de datos (tablas Supabase)

| Tabla | Rol | Claves/columnas relevantes |
|---|---|---|
| `tournaments` | torneos | `id` (**TEXT**), `name`, `type`, `year`, `surface`, `category`, `regionId`, `"divisionSize"`, `"parentTournamentId"` |
| `positions` | resultado: equipo en un puesto | `id`, `"tournamentId"`, `"teamId"`, `position`, `points` |
| `teams` | equipos | `id`, `name`, `regionId`, slug… |
| `regions` | regiones/autonomías | `id`, `name`, coef config |
| `team_season_points` | **caché materializada** de puntos por equipo+temporada | `team_id` (**TEXT**), `season`, `beach_mixed_points`, …, columnas de rankings por subtemporada |
| `team_season_rankings` | rankings históricos calculados | por temporada/modalidad |
| `regional_coefficients` | coeficientes regionales por temporada+modalidad | `regionId`, `season`, `modality`, `coefficient`, `isManualOverride` |
| `admin_notifications` | avisos de cierres de subtemporada | |
| `current_rankings` | **eliminada** (migración 010); reemplazada por el flujo híbrido | |

> ⚠️ **Convención de nombres MIXTA** (trampa frecuente):
> - `tournaments`/`positions` usan **camelCase entrecomillado**: `"tournamentId"`, `"teamId"`, `"regionId"`, `"divisionSize"`, `"parentTournamentId"`.
> - `team_season_points`/`team_season_rankings` usan **snake_case**: `team_id`, `season`, `*_points`.
> - `tournaments.id` y `team_season_points.team_id` son **TEXT**, no UUID (migración 005). Cualquier FK nuevo a `tournaments(id)` debe ser **TEXT** (no UUID).

Migraciones en `database/migrations/NNN_*.sql` (numeradas, se aplican a mano en
Supabase). La última de la reforma de puntos es
`016_add_division_size_and_parent.sql`.

---

## 6. Sistema de puntos (el corazón) — `src/utils/tournamentUtils.ts`

**Curva unificada por tramos** (reforma reciente, sustituye a tres tablas fijas):

- **85%** de decaimiento para los puestos **1–8**, **90%** a partir del **9**.
- Misma forma para la curva **nacional** (ancla **1000**) y la **regional** (ancla **100**).
- La **2ª división (CE2) NO empieza de cero**: continúa la curva nacional justo
  detrás de la 1ª mediante un **offset** = `divisionSize` de la 1ª asociada
  (típicamente 16 → el campeón de 2ª es el puesto 17 de la curva).

```ts
nationalCurvePoints(p)   // 1→1000, 8→321, 9→289, 16→138, 17→124, 32→26
regionalCurvePoints(p)   // 1→100, 8→32, 9→29
getPointsForPosition(position, type, offset=0)
  // REGIONAL → regionalCurvePoints(position)
  // CE1      → nationalCurvePoints(position)
  // CE2      → nationalCurvePoints(position + offset)
getOffsetForTournament(type, divisionSize)  // CE2 → divisionSize ?? 16 ; resto → 0
```

`divisionSize` y `parentTournamentId` se declaran por torneo (formularios de
Nuevo/Editar torneo) y permiten un offset **dinámico** sin contar resultados.

---

## 7. Coeficiente regional — `src/services/seasonService.ts` + `src/utils/rankingCalculations.ts`

- Se aplica **solo a torneos `REGIONAL`** (CE1/CE2 conservan sus puntos base).
- Se calcula a partir de los **resultados nacionales (CE1/CE2)** de una ventana
  de 4 años con pesos `[1.0, 0.8, 0.5, 0.2]`, comparando los puntos de cada
  región con la **media nacional** por modalidad.
- Fórmula: `coef = clamp(1 + (pts−media)/media × k, floor, ceiling)` con
  `k = ceiling − 1` (defaults: floor 0.8, ceiling 1.2, increment 0.05).
- **Convención temporal**: el coeficiente calculado con `season=T` se **aplica a
  los torneos REGIONAL de T+1** (`getRegionalCoefficientBaseSeason` = T−1).

---

## 8. Pipeline de cálculo del ranking (CRÍTICO) — `src/services/rankingUpdateService.ts`

Orquestador: **`updateCompleteRankingSystem()`**, disparado desde
`src/pages/admin/RankingUpdatePage.tsx` (botón "Actualización Completa").

Orden (no saltar pasos, el orden importa):

1. **Paso 0** — `seasonPointsService.recomputeAllPositionPoints()`: reescribe
   `positions.points` de **todos** los torneos con la curva vigente. Imprescindible
   tras cambiar la curva, porque la agregación **suma puntos ya guardados**.
2. **Paso 1** — `seasonPointsService.regenerateAllSeasons()`: agrega
   `positions.points` por equipo/modalidad en **`team_season_points`** para todas
   las temporadas (internamente llama a `calculateAndSaveSeasonPoints(T)`, que
   aplica el coef. regional solo a REGIONAL).
3. **Paso 2** — `teamSeasonRankingsService.recalculateAllSeasons()`: reconstruye
   **`team_season_rankings`** (la **fuente de verdad** que lee la web pública;
   incluye cambios de posición). Itera todas las temporadas con
   `calculateSeasonRankings(T)`.

> ⚠️ La tabla `current_rankings` fue **eliminada** (migración 010). La función
> `hybridRankingService.syncWithCurrentRankings` (que escribía a esa tabla) se
> **eliminó**; el paso final correcto es `recalculateAllSeasons` → `team_season_rankings`.

**Reconstrucción rápida** (`syncCurrentRankingsOnly`, botón "Reconstruir Rankings"):
solo el Paso 2 (`recalculateAllSeasons`), sin recomputar posiciones ni regenerar
`team_season_points`. Útil cuando los puntos ya están bien y solo hay que reordenar.

> **Coeficientes regionales**: su *cálculo* (`seasonService.calculateAndSaveRegionalCoefficients`)
> no está dentro de este orquestador en esta rama; se ejecuta aparte (p. ej.
> `npm run backfill-regional-coefficients`). La *aplicación* del coef. ya guardado
> sí ocurre dentro de `calculateAndSaveSeasonPoints`.

---

## 9. Mapa de ficheros clave

**Lógica de puntos / cálculo**
- `src/utils/tournamentUtils.ts` — curva, offset, helpers de torneo/temporada.
- `src/utils/rankingCalculations.ts` — matemática de coef. regional, modalidades, pesos, slugs.
- `src/services/seasonPointsService.ts` — `recomputeAllPositionPoints`, `calculateAndSaveSeasonPoints`, `regenerateAllSeasons`.
- `src/services/rankingUpdateService.ts` — **orquestador** del recálculo.
- `src/services/seasonService.ts` — coeficientes regionales, snapshots, cierre de temporada.
- `src/services/teamSeasonRankingsService.ts` — rankings históricos (`calculateSeasonRankings`, `recalculateAllSeasons`); escribe `team_season_rankings`.
- `src/services/hybridRankingService.ts` — lectura de rankings desde `team_season_points` (`getRankingFromSeasonPoints`, `getCombinedRanking`, `CategoryPointsMap`).

**Datos / CRUD**
- `src/services/apiService.ts` — wrapper grande de Supabase (`tournamentsService`, `teamsService`, `regionsService`, posiciones…). `tournamentsService.getCE1ByModality` puebla el selector de 1ª.
- `src/services/tournamentImportService.ts` — import de Excel/CSV (deriva offset para CE2).
- `src/types/index.ts` — tipos del dominio (`Tournament`, `Position`, etc.).

**UI relevante**
- `src/pages/admin/NewTournamentPage.tsx` y `EditTournamentPage.tsx` — alta/edición + campo "Tamaño de división" (CE1/CE2) y selector "1ª asociada" (CE2), con previsualización de puntos en vivo.
- `src/pages/admin/RankingUpdatePage.tsx` — "Actualizar Rankings": único punto de recálculo global (Actualización Completa + Reconstruir Rankings).
- `src/pages/admin/RankingAdminPageHybrid.tsx` — "Ranking": **solo lectura** (visor con filtros).
- `src/pages/admin/SeasonManagementPage.tsx` — "Temporadas": gestión por temporada (regenerar puntos, cerrar, stats) **+ monitor y cierre de subtemporadas** (absorbió la antigua página "Subtemporadas").
- `ImportExportPage.tsx`, `ConfigurationPage.tsx`, `HistoricoPage.tsx`, páginas de equipos/regiones/torneos.

> **Panel admin (sidebar)**: 10 pestañas. Se eliminaron artefactos de migración
> ya consumida (Migrar Sistema Rankings, Simular Subtemporadas, Comparar Sistemas,
> Diagnóstico DB) y se fusionó "Subtemporadas" en "Temporadas". Menú en
> `src/components/layout/AdminLayout.tsx`.
- Público: `RankingPageNew.tsx`, `HomePage.tsx`, `*DetailPage.tsx` (equipos/regiones/torneos, con slugs y redirecciones legacy).

**DB**: `database/migrations/*.sql`.

---

## 10. Convenciones y trampas (léelas antes de tocar nada)

- **El build NO hace type-check**: `vite build` ignora errores de TS (config en
  `vite.config.ts`). `tsc --noEmit` arroja **decenas de errores preexistentes**
  (sobre todo `supabase is possibly null` y variables sin usar). No los tomes
  como "tu" regresión: compara el conteo antes/después.
- **CI** (`.github/workflows/ci.yml`) corre **lint + build**, **no** los tests
  Vitest, y solo en push a `main`/`develop` o PR a `main`. Si añades lógica,
  ejecuta `npm test` tú mismo.
- **Lint**: config en `.eslintrc.cjs` (`.cjs` porque el proyecto es ESM).
- **Nombres de columnas mixtos** y **IDs TEXT** (ver §5) — la causa nº1 de bugs.
- **`team_season_points` es caché**: cambiar la fórmula no se refleja hasta
  ejecutar el recálculo (§8). El recálculo de puntos vive en
  `recomputeAllPositionPoints` (N+1 queries: una por torneo; correcto pero no
  rapidísimo).
- Idioma del código/UI/commits: **español**.

---

## 11. Tareas comunes — dónde tocar

| Quiero… | Toca… |
|---|---|
| Cambiar la curva de puntos | `src/utils/tournamentUtils.ts` (`curvePoints`/constantes) + tests + recálculo (§8) |
| Cambiar cómo se agregan puntos por temporada | `seasonPointsService.calculateAndSaveSeasonPoints` |
| Ajustar coeficiente regional | `rankingCalculations.ts` (fórmula) + `seasonService` (datos) |
| Añadir campo a torneo | migración SQL + `src/types/index.ts` + `TournamentFormData` (`tournamentUtils.ts`) + formularios New/Edit + passthrough en `apiService` |
| Recalcular todo el ranking | `RankingUpdatePage` → "Actualización Completa" (`updateCompleteRankingSystem`) |
| Importar torneos masivos | `tournamentImportService.ts` |

---

## 12. Estado actual (a la fecha de este briefing)

- Rama de trabajo: **`claude/pensive-noether-lswkla`**. Rama integradora previa:
  `feature/points-reform-merge` (reforma de puntos + coef. regionales + slugs).
- **Reforma de puntos**: completa (curva 85/90, offset CE2, migración 016 con FK
  `TEXT`, tests unitarios de la curva).
- **Home page**: reestructurada (badge de temporada, banner de próximo torneo,
  orden rankings→torneos→cómo funciona) y tabla de puntos corregida a la curva nueva.
- **Panel admin limpiado y consolidado**: eliminadas 4 pestañas de migración
  consumida + fusión de "Subtemporadas" en "Temporadas" (10 pestañas).
- **Pipeline arreglado**: "Actualización Completa" ahora termina en
  `recalculateAllSeasons` → `team_season_rankings` (antes sincronizaba a la tabla
  muerta `current_rankings`); eliminada `syncWithCurrentRankings`.
- Pendiente recomendable: aplicar migraciones en Supabase y lanzar "Actualización
  Completa"; abordar la deuda técnica de `current_rankings` que aún leen
  `homePageService.getRegions/getMainStats` y `rankingService.ts`; opcionalmente
  añadir `npm test` al CI.
