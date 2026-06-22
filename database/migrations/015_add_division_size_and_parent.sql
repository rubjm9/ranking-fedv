-- ================================================
-- Migración: Escalafón nacional único (curva por tramos) + offset dinámico
-- Tabla: tournaments
-- La 2ª división (CE2) continúa la curva nacional justo después del último
-- equipo de su 1ª (CE1). Se declara el tamaño de división y la asociación CE2->CE1
-- para que el offset sea dinámico y correcto.
-- ================================================

-- Tamaño de la división (nº de equipos). Para CE1 es su propio tamaño;
-- para CE2 refleja el tamaño de la 1ª asociada (= offset en la curva).
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS "divisionSize" INTEGER;

-- Enlace de un CE2 a su CE1 (misma superficie/categoría/año).
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS "parentTournamentId" UUID REFERENCES tournaments(id);

CREATE INDEX IF NOT EXISTS idx_tournaments_parent ON tournaments("parentTournamentId");

COMMENT ON COLUMN tournaments."divisionSize" IS 'Nº de equipos de la división. CE1: su propio tamaño; CE2: tamaño de la 1ª asociada (offset en la curva).';
COMMENT ON COLUMN tournaments."parentTournamentId" IS 'CE2 -> CE1 asociado (misma superficie/categoría/año).';

-- ------------------------------------------------
-- Backfill
-- ------------------------------------------------

-- 1) CE1 sin divisionSize: nº de posiciones registradas (mín. estándar 16).
UPDATE tournaments t
SET "divisionSize" = GREATEST(16, sub.cnt)
FROM (
  SELECT "tournamentId" AS tid, COUNT(*)::int AS cnt
  FROM positions
  GROUP BY "tournamentId"
) sub
WHERE t.id = sub.tid
  AND t.type = 'CE1'
  AND t."divisionSize" IS NULL;

-- CE1 sin posiciones registradas: estándar 16.
UPDATE tournaments
SET "divisionSize" = 16
WHERE type = 'CE1' AND "divisionSize" IS NULL;

-- 2) Asociar cada CE2 a su CE1 por (surface, category, year).
UPDATE tournaments ce2
SET "parentTournamentId" = ce1.id
FROM tournaments ce1
WHERE ce2.type = 'CE2'
  AND ce1.type = 'CE1'
  AND ce2."parentTournamentId" IS NULL
  AND ce1.surface = ce2.surface
  AND ce1.category = ce2.category
  AND ce1.year = ce2.year;

-- 3) CE2: copiar el divisionSize de su CE1 (offset). Sin CE1 -> estándar 16.
UPDATE tournaments ce2
SET "divisionSize" = COALESCE(ce1."divisionSize", 16)
FROM tournaments ce1
WHERE ce2.type = 'CE2'
  AND ce2."parentTournamentId" = ce1.id
  AND ce2."divisionSize" IS NULL;

UPDATE tournaments
SET "divisionSize" = 16
WHERE type = 'CE2' AND "divisionSize" IS NULL;

-- Nota: el recálculo de positions.points con la nueva curva se ejecuta desde la
-- app (rankingUpdateService.updateCompleteRankingSystem -> recomputeAllPositionPoints).
