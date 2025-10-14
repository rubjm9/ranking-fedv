-- ================================================
-- Migración: Cambiar team_season_points para usar TEXT en lugar de UUID
-- Problema: Los team_id en positions son números ("4", "5", "6"...) no UUIDs
-- Solución: Cambiar team_id de UUID a TEXT en team_season_points
-- ================================================

-- 1. Eliminar la tabla actual (si existe)
DROP TABLE IF EXISTS team_season_points CASCADE;

-- 2. Crear la tabla con team_id como TEXT (SIN índices dentro)
CREATE TABLE team_season_points (
  team_id TEXT NOT NULL,
  season TEXT NOT NULL,
  beach_mixed_points DECIMAL(10,2) DEFAULT 0,
  beach_open_points DECIMAL(10,2) DEFAULT 0,
  beach_women_points DECIMAL(10,2) DEFAULT 0,
  grass_mixed_points DECIMAL(10,2) DEFAULT 0,
  grass_open_points DECIMAL(10,2) DEFAULT 0,
  grass_women_points DECIMAL(10,2) DEFAULT 0,
  tournaments_played INTEGER DEFAULT 0,
  best_position INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Clave primaria compuesta
  PRIMARY KEY (team_id, season)
);

-- 3. Crear índices por separado (sintaxis correcta para PostgreSQL)
CREATE INDEX idx_team_season_points_team_id ON team_season_points (team_id);
CREATE INDEX idx_team_season_points_season ON team_season_points (season);
-- Índice con expresión para puntos totales (sintaxis corregida)
CREATE INDEX idx_team_season_points_total_points ON team_season_points (
  (beach_mixed_points + beach_open_points + beach_women_points + 
   grass_mixed_points + grass_open_points + grass_women_points)
);

-- 4. Comentarios para documentación
COMMENT ON TABLE team_season_points IS 'Puntos agregados por equipo y temporada para el sistema híbrido de ranking';
COMMENT ON COLUMN team_season_points.team_id IS 'ID del equipo (TEXT para compatibilidad con positions.teamId)';
COMMENT ON COLUMN team_season_points.season IS 'Temporada en formato YYYY-YY (ej: 2024-25)';
COMMENT ON COLUMN team_season_points.beach_mixed_points IS 'Puntos totales en playa mixto para esta temporada';
COMMENT ON COLUMN team_season_points.beach_open_points IS 'Puntos totales en playa open para esta temporada';
COMMENT ON COLUMN team_season_points.beach_women_points IS 'Puntos totales en playa women para esta temporada';
COMMENT ON COLUMN team_season_points.grass_mixed_points IS 'Puntos totales en césped mixto para esta temporada';
COMMENT ON COLUMN team_season_points.grass_open_points IS 'Puntos totales en césped open para esta temporada';
COMMENT ON COLUMN team_season_points.grass_women_points IS 'Puntos totales en césped women para esta temporada';
COMMENT ON COLUMN team_season_points.tournaments_played IS 'Número de torneos jugados en esta temporada';
COMMENT ON COLUMN team_season_points.best_position IS 'Mejor posición obtenida en esta temporada';
COMMENT ON COLUMN team_season_points.last_updated IS 'Última actualización del registro';

-- 5. Verificar que la tabla se creó correctamente
SELECT 
  'Tabla team_season_points creada exitosamente' as status,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'team_season_points';

-- 6. Mostrar la estructura de la nueva tabla
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'team_season_points' 
ORDER BY ordinal_position;
