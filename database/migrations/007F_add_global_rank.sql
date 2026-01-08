-- ================================================
-- Migración 007F: Agregar ranking global pre-calculado
-- ================================================

-- Agregar columnas para ranking global
ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS global_rank INTEGER;

ALTER TABLE team_season_rankings
ADD COLUMN IF NOT EXISTS global_points DECIMAL(10,2) DEFAULT 0;

-- Índice para consultas de ranking global
CREATE INDEX IF NOT EXISTS idx_team_season_rankings_season_global 
  ON team_season_rankings(season, global_rank) 
  WHERE global_rank IS NOT NULL;

-- Comentarios
COMMENT ON COLUMN team_season_rankings.global_rank IS 
  'Posición en el ranking global (suma de todas las 6 superficies)';
  
COMMENT ON COLUMN team_season_rankings.global_points IS 
  'Puntos totales en ranking global (suma de todas las superficies)';

-- Verificar estructura
SELECT 
  'Columnas agregadas exitosamente' as status,
  COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'team_season_rankings'
  AND column_name IN ('global_rank', 'global_points');
