-- ================================================
-- Migración 015: Crear tabla regional_coefficients
-- con soporte de modalidad (6 coeficientes por región/temporada)
--
-- NOTA: Elimina la tabla legacy (esquema: region_id TEXT snake_case,
-- sin modality) que tenía 5 placeholders con coefficient=1.0.
-- Los datos se regeneran con el proceso de backfill.
-- ================================================

-- Eliminar tabla legacy para recrear con esquema correcto
DROP TABLE IF EXISTS regional_coefficients;

CREATE TABLE regional_coefficients (
  id TEXT PRIMARY KEY,
  "regionId" TEXT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  season TEXT NOT NULL,
  modality TEXT NOT NULL,
  coefficient DECIMAL(4,3) NOT NULL DEFAULT 1.0,
  "isManualOverride" BOOLEAN DEFAULT false,
  "calculatedValue" DECIMAL(4,3),
  "appliedAt" TIMESTAMPTZ DEFAULT NOW(),
  "appliedBy" TEXT,
  UNIQUE("regionId", season, modality)
);

CREATE INDEX idx_rc_season_modality ON regional_coefficients(season, modality);
CREATE INDEX idx_rc_region ON regional_coefficients("regionId");

COMMENT ON TABLE regional_coefficients IS
  'Coeficientes regionales por temporada y modalidad.
   season = temporada DE LA QUE se calcularon los datos (T-1).
   Se aplican a torneos REGIONAL de la temporada siguiente (T).
   Rango: 0.80 (mínimo) a 1.20 (máximo).
   Solo se aplican a torneos REGIONAL, nunca a CE1 ni CE2.';

COMMENT ON COLUMN regional_coefficients.season IS
  'Temporada base del cálculo (T-1). El coeficiente aplica a los regionales de T.';

COMMENT ON COLUMN regional_coefficients.modality IS
  'beach_mixed | beach_open | beach_women | grass_mixed | grass_open | grass_women';
