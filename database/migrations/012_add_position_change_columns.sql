-- ================================================
-- Migración 012: Agregar columnas de cambio de posición pre-calculado
-- Optimización: Evita recalcular position_change en cada carga de página
-- ================================================

-- Columnas de cambio de posición por superficie
ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS beach_mixed_position_change INTEGER DEFAULT 0;

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS beach_open_position_change INTEGER DEFAULT 0;

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS beach_women_position_change INTEGER DEFAULT 0;

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS grass_mixed_position_change INTEGER DEFAULT 0;

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS grass_open_position_change INTEGER DEFAULT 0;

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS grass_women_position_change INTEGER DEFAULT 0;

-- Columnas de cambio de posición global por subtemporada
ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS subupdate_1_global_position_change INTEGER DEFAULT 0;

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS subupdate_2_global_position_change INTEGER DEFAULT 0;

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS subupdate_3_global_position_change INTEGER DEFAULT 0;

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS subupdate_4_global_position_change INTEGER DEFAULT 0;

-- Columnas de cambio de puntos por superficie (para estadísticas de "equipo revelación")
ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS beach_mixed_points_change DECIMAL(10,2) DEFAULT 0;

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS beach_open_points_change DECIMAL(10,2) DEFAULT 0;

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS beach_women_points_change DECIMAL(10,2) DEFAULT 0;

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS grass_mixed_points_change DECIMAL(10,2) DEFAULT 0;

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS grass_open_points_change DECIMAL(10,2) DEFAULT 0;

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS grass_women_points_change DECIMAL(10,2) DEFAULT 0;

-- Columnas de cambio de puntos global
ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS subupdate_1_global_points_change DECIMAL(10,2) DEFAULT 0;

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS subupdate_2_global_points_change DECIMAL(10,2) DEFAULT 0;

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS subupdate_3_global_points_change DECIMAL(10,2) DEFAULT 0;

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS subupdate_4_global_points_change DECIMAL(10,2) DEFAULT 0;

-- Comentarios para documentación
COMMENT ON COLUMN team_season_rankings.beach_mixed_position_change IS 
  'Cambio de posición respecto a la temporada anterior en playa mixto. Positivo = subió, Negativo = bajó';

COMMENT ON COLUMN team_season_rankings.beach_open_position_change IS 
  'Cambio de posición respecto a la temporada anterior en playa open. Positivo = subió, Negativo = bajó';

COMMENT ON COLUMN team_season_rankings.beach_women_position_change IS 
  'Cambio de posición respecto a la temporada anterior en playa women. Positivo = subió, Negativo = bajó';

COMMENT ON COLUMN team_season_rankings.grass_mixed_position_change IS 
  'Cambio de posición respecto a la temporada anterior en césped mixto. Positivo = subió, Negativo = bajó';

COMMENT ON COLUMN team_season_rankings.grass_open_position_change IS 
  'Cambio de posición respecto a la temporada anterior en césped open. Positivo = subió, Negativo = bajó';

COMMENT ON COLUMN team_season_rankings.grass_women_position_change IS 
  'Cambio de posición respecto a la temporada anterior en césped women. Positivo = subió, Negativo = bajó';

COMMENT ON COLUMN team_season_rankings.subupdate_1_global_position_change IS 
  'Cambio de posición global respecto a subupdate_1 de la temporada anterior';

COMMENT ON COLUMN team_season_rankings.subupdate_2_global_position_change IS 
  'Cambio de posición global respecto a subupdate_2 de la temporada anterior';

COMMENT ON COLUMN team_season_rankings.subupdate_3_global_position_change IS 
  'Cambio de posición global respecto a subupdate_3 de la temporada anterior';

COMMENT ON COLUMN team_season_rankings.subupdate_4_global_position_change IS 
  'Cambio de posición global respecto a subupdate_4 de la temporada anterior';

COMMENT ON COLUMN team_season_rankings.beach_mixed_points_change IS 
  'Cambio de puntos respecto a la temporada anterior en playa mixto';

COMMENT ON COLUMN team_season_rankings.subupdate_4_global_points_change IS 
  'Cambio de puntos globales respecto a subupdate_4 de la temporada anterior';

-- Verificar estructura
SELECT 
  'Columnas de cambio de posición agregadas exitosamente' as status,
  COUNT(*) as total_new_columns
FROM information_schema.columns 
WHERE table_name = 'team_season_rankings'
  AND column_name LIKE '%_change';



