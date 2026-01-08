-- ================================================
-- Migración 007G: Agregar columnas de subtemporadas para ranking general
-- ================================================

-- IMPORTANTE: Primero eliminar columnas de 007F si existen
ALTER TABLE team_season_rankings
DROP COLUMN IF EXISTS global_rank;

ALTER TABLE team_season_rankings
DROP COLUMN IF EXISTS global_points;

-- Agregar columnas para cada una de las 4 actualizaciones anuales
-- Estas representan el ranking global en diferentes momentos de la temporada

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS subupdate_1_global_rank INTEGER;

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS subupdate_1_global_points DECIMAL(10,2) DEFAULT 0;

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS subupdate_2_global_rank INTEGER;

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS subupdate_2_global_points DECIMAL(10,2) DEFAULT 0;

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS subupdate_3_global_rank INTEGER;

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS subupdate_3_global_points DECIMAL(10,2) DEFAULT 0;

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS subupdate_4_global_rank INTEGER;

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS subupdate_4_global_points DECIMAL(10,2) DEFAULT 0;

-- Índices para consultas rápidas por subtemporada
CREATE INDEX IF NOT EXISTS idx_team_season_rankings_season_sub1 
  ON team_season_rankings(season, subupdate_1_global_rank) 
  WHERE subupdate_1_global_rank IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_team_season_rankings_season_sub2 
  ON team_season_rankings(season, subupdate_2_global_rank) 
  WHERE subupdate_2_global_rank IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_team_season_rankings_season_sub3 
  ON team_season_rankings(season, subupdate_3_global_rank) 
  WHERE subupdate_3_global_rank IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_team_season_rankings_season_sub4 
  ON team_season_rankings(season, subupdate_4_global_rank) 
  WHERE subupdate_4_global_rank IS NOT NULL;

-- Comentarios (actualizados con lógica correcta de coeficientes)
COMMENT ON COLUMN team_season_rankings.subupdate_1_global_rank IS 
  'Posición en ranking global después de jugarse playa mixto. Play mixto: actual*1, prev*0.8, prev2*0.5, prev3*0.2. Otras superficies: prev*1, prev2*0.8, prev3*0.5, prev4*0.2';
  
COMMENT ON COLUMN team_season_rankings.subupdate_2_global_rank IS 
  'Posición en ranking global después de jugarse playa open/women. Play mixto y open/women: actual*1, prev*0.8, prev2*0.5, prev3*0.2. Césped: prev*1, prev2*0.8, prev3*0.5, prev4*0.2';
  
COMMENT ON COLUMN team_season_rankings.subupdate_3_global_rank IS 
  'Posición en ranking global después de jugarse césped mixto. Play: actual*1, prev*0.8. Césped mixto: actual*1, prev*0.8. Césped open/women: prev*1, prev2*0.8';
  
COMMENT ON COLUMN team_season_rankings.subupdate_4_global_rank IS 
  'Posición en ranking global al finalizar temporada. Todas superficies: actual*1, prev*0.8, prev2*0.5, prev3*0.2';

COMMENT ON COLUMN team_season_rankings.subupdate_1_global_points IS 
  'Puntos globales (suma todas superficies) después de playa mixto con coeficientes aplicados según temporalidad de cada superficie';
  
COMMENT ON COLUMN team_season_rankings.subupdate_2_global_points IS 
  'Puntos globales (suma todas superficies) después de playa open/women con coeficientes aplicados según temporalidad';
  
COMMENT ON COLUMN team_season_rankings.subupdate_3_global_points IS 
  'Puntos globales (suma todas superficies) después de césped mixto con coeficientes aplicados según temporalidad';
  
COMMENT ON COLUMN team_season_rankings.subupdate_4_global_points IS 
  'Puntos globales (suma todas superficies) al final de temporada con coeficientes completos aplicados';

-- Verificar estructura
SELECT 
  'Columnas de subtemporadas agregadas exitosamente' as status,
  COUNT(*) as total_new_columns
FROM information_schema.columns 
WHERE table_name = 'team_season_rankings'
  AND column_name LIKE 'subupdate_%';
