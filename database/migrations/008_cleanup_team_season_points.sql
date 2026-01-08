-- ================================================
-- Migración: Limpiar team_season_points
-- Eliminar columnas de rankings por subtemporada
-- ================================================

-- 1. Eliminar columnas de rankings por subtemporada (mezclan superficies)
ALTER TABLE team_season_points DROP COLUMN IF EXISTS subseason_1_beach_mixed_rank;
ALTER TABLE team_season_points DROP COLUMN IF EXISTS subseason_2_beach_open_women_rank;
ALTER TABLE team_season_points DROP COLUMN IF EXISTS subseason_3_grass_mixed_rank;
ALTER TABLE team_season_points DROP COLUMN IF EXISTS subseason_4_grass_open_women_rank;
ALTER TABLE team_season_points DROP COLUMN IF EXISTS final_season_global_rank;
ALTER TABLE team_season_points DROP COLUMN IF EXISTS subseason_ranks_calculated_at;

-- 2. Actualizar comentario de la tabla
COMMENT ON TABLE team_season_points IS 
  'Puntos base por equipo y temporada SIN coeficientes de antigüedad. 
   Los coeficientes regionales se aplicarán en el futuro cuando se implemente el sistema.
   Para rankings con coeficientes aplicados, consultar team_season_rankings.';

-- 3. Actualizar comentarios de columnas
COMMENT ON COLUMN team_season_points.beach_mixed_points IS 
  'Puntos base de playa mixto (sin coeficientes de antigüedad ni coeficiente regional aplicado)';

COMMENT ON COLUMN team_season_points.beach_open_points IS 
  'Puntos base de playa open (sin coeficientes de antigüedad ni coeficiente regional aplicado)';

COMMENT ON COLUMN team_season_points.beach_women_points IS 
  'Puntos base de playa women (sin coeficientes de antigüedad ni coeficiente regional aplicado)';

COMMENT ON COLUMN team_season_points.grass_mixed_points IS 
  'Puntos base de césped mixto (sin coeficientes de antigüedad ni coeficiente regional aplicado)';

COMMENT ON COLUMN team_season_points.grass_open_points IS 
  'Puntos base de césped open (sin coeficientes de antigüedad ni coeficiente regional aplicado)';

COMMENT ON COLUMN team_season_points.grass_women_points IS 
  'Puntos base de césped women (sin coeficientes de antigüedad ni coeficiente regional aplicado)';

-- 4. Verificar que las columnas se eliminaron correctamente
SELECT 
  'Limpieza completada exitosamente' as status,
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'team_season_points' 
  AND column_name LIKE '%points%'
ORDER BY ordinal_position;

-- ================================================
-- Fin de migración
-- ================================================

