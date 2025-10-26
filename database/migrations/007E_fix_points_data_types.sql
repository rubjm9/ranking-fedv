-- ================================================
-- Corregir tipos de datos en team_season_rankings
-- Cambiar columnas de puntos de INTEGER a DECIMAL(10,2)
-- ================================================

-- Cambiar tipos de datos de puntos de INTEGER a DECIMAL
ALTER TABLE team_season_rankings 
ALTER COLUMN beach_mixed_points TYPE DECIMAL(10,2);

ALTER TABLE team_season_rankings 
ALTER COLUMN beach_open_points TYPE DECIMAL(10,2);

ALTER TABLE team_season_rankings 
ALTER COLUMN beach_women_points TYPE DECIMAL(10,2);

ALTER TABLE team_season_rankings 
ALTER COLUMN grass_mixed_points TYPE DECIMAL(10,2);

ALTER TABLE team_season_rankings 
ALTER COLUMN grass_open_points TYPE DECIMAL(10,2);

ALTER TABLE team_season_rankings 
ALTER COLUMN grass_women_points TYPE DECIMAL(10,2);

-- Verificar tipos de datos actualizados
SELECT 
  column_name,
  data_type,
  numeric_precision,
  numeric_scale
FROM information_schema.columns 
WHERE table_name = 'team_season_rankings'
  AND column_name LIKE '%_points'
ORDER BY column_name;
