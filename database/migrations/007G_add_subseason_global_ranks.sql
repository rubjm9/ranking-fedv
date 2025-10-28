-- ================================================
-- Migración 007G: Agregar columnas de subtemporadas para ranking general
-- ================================================

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

-- Comentarios
COMMENT ON COLUMN team_season_rankings.subupdate_1_global_rank IS 
  'Posición en ranking global después de jugarse playa mixto (temporada actual *1 + anteriores *0.8, *0.5, *0.2)';
  
COMMENT ON COLUMN team_season_rankings.subupdate_2_global_rank IS 
  'Posición en ranking global después de jugarse playa open/women (temporada actual *1 + anteriores *0.8, *0.5, *0.2)';
  
COMMENT ON COLUMN team_season_rankings.subupdate_3_global_rank IS 
  'Posición en ranking global después de jugarse césped mixto (temporada actual *1 + anteriores *0.8, *0.5, *0.2)';
  
COMMENT ON COLUMN team_season_rankings.subupdate_4_global_rank IS 
  'Posición en ranking global al finalizar temporada (todas las modalidades *1, temporada anterior *0.8, *0.5, *0.2)';

COMMENT ON COLUMN team_season_rankings.subupdate_1_global_points IS 
  'Puntos globales después de primera actualización (playa mixto con coeficientes aplicados)';
  
COMMENT ON COLUMN team_season_rankings.subupdate_2_global_points IS 
  'Puntos globales después de segunda actualización (playa open/women con coeficientes aplicados)';
  
COMMENT ON COLUMN team_season_rankings.subupdate_3_global_points IS 
  'Puntos globales después de tercera actualización (césped mixto con coeficientes aplicados)';
  
COMMENT ON COLUMN team_season_rankings.subupdate_4_global_points IS 
  'Puntos globales al final de temporada (todas las modalidades con coeficientes aplicados)';

-- Verificar estructura
SELECT 
  'Columnas de subtemporadas agregadas exitosamente' as status,
  COUNT(*) as total_new_columns
FROM information_schema.columns 
WHERE table_name = 'team_season_rankings'
  AND column_name LIKE 'subupdate_%';
