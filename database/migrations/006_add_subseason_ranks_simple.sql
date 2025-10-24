-- ================================================
-- Migración: Agregar rankings por subtemporada (Versión Simple)
-- Tabla: team_season_points
-- ================================================

-- 1. Eliminar columna existente
ALTER TABLE team_season_points DROP COLUMN IF EXISTS best_position;

-- 2. Agregar nuevas columnas una por una (más compatible)
ALTER TABLE team_season_points ADD COLUMN IF NOT EXISTS subseason_1_beach_mixed_rank INTEGER;
ALTER TABLE team_season_points ADD COLUMN IF NOT EXISTS subseason_2_beach_open_women_rank INTEGER;
ALTER TABLE team_season_points ADD COLUMN IF NOT EXISTS subseason_3_grass_mixed_rank INTEGER;
ALTER TABLE team_season_points ADD COLUMN IF NOT EXISTS subseason_4_grass_open_women_rank INTEGER;
ALTER TABLE team_season_points ADD COLUMN IF NOT EXISTS final_season_global_rank INTEGER;
ALTER TABLE team_season_points ADD COLUMN IF NOT EXISTS subseason_ranks_calculated_at TIMESTAMP WITH TIME ZONE;

-- 3. Comentarios para documentación
COMMENT ON COLUMN team_season_points.subseason_1_beach_mixed_rank IS 'Ranking en subtemporada 1: playa mixto';
COMMENT ON COLUMN team_season_points.subseason_2_beach_open_women_rank IS 'Ranking en subtemporada 2: playa open/women';
COMMENT ON COLUMN team_season_points.subseason_3_grass_mixed_rank IS 'Ranking en subtemporada 3: césped mixto';
COMMENT ON COLUMN team_season_points.subseason_4_grass_open_women_rank IS 'Ranking en subtemporada 4: césped open/women';
COMMENT ON COLUMN team_season_points.final_season_global_rank IS 'Ranking global final de la temporada';
COMMENT ON COLUMN team_season_points.subseason_ranks_calculated_at IS 'Timestamp de cuando se calcularon los rankings por subtemporada';

-- 4. Verificar que las columnas se agregaron correctamente
SELECT 
  'Columnas agregadas exitosamente' as status,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'team_season_points' 
  AND (column_name LIKE 'subseason_%' OR column_name = 'final_season_global_rank')
ORDER BY ordinal_position;

-- ================================================
-- Fin de migración
-- ================================================
