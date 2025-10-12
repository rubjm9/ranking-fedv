-- ================================================
-- Migración: Sistema híbrido de ranking
-- Tabla: team_season_points (cache materializada)
-- ================================================

-- 1. Crear tabla team_season_points
CREATE TABLE IF NOT EXISTS team_season_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL,
  season VARCHAR(10) NOT NULL, -- Formato: "2024-25"
  
  -- Puntos base por modalidad (sin coeficientes de antigüedad)
  beach_mixed_points DECIMAL(10,2) DEFAULT 0,
  beach_open_points DECIMAL(10,2) DEFAULT 0,
  beach_women_points DECIMAL(10,2) DEFAULT 0,
  grass_mixed_points DECIMAL(10,2) DEFAULT 0,
  grass_open_points DECIMAL(10,2) DEFAULT 0,
  grass_women_points DECIMAL(10,2) DEFAULT 0,
  
  -- Metadata
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_complete BOOLEAN DEFAULT false, -- TRUE cuando la temporada ha cerrado oficialmente
  completion_date TIMESTAMP WITH TIME ZONE, -- Fecha en que se marcó como completa
  
  -- Estadísticas adicionales (opcional, para análisis futuros)
  tournaments_played JSONB DEFAULT '{}', -- {"beach_mixed": 5, "beach_open": 3, ...}
  best_position JSONB DEFAULT '{}', -- {"beach_mixed": 1, "beach_open": 3, ...}
  
  -- Constraints
  UNIQUE(team_id, season),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_team_season_points_team 
  ON team_season_points(team_id);

CREATE INDEX IF NOT EXISTS idx_team_season_points_season 
  ON team_season_points(season);

CREATE INDEX IF NOT EXISTS idx_team_season_points_team_season 
  ON team_season_points(team_id, season);

CREATE INDEX IF NOT EXISTS idx_team_season_points_complete 
  ON team_season_points(season, is_complete);

-- 3. Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_team_season_points_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear trigger para actualizar timestamp
DROP TRIGGER IF EXISTS trigger_update_team_season_points_timestamp 
  ON team_season_points;

CREATE TRIGGER trigger_update_team_season_points_timestamp
  BEFORE UPDATE ON team_season_points
  FOR EACH ROW
  EXECUTE FUNCTION update_team_season_points_updated_at();

-- 5. Comentarios para documentación
COMMENT ON TABLE team_season_points IS 
  'Cache materializada de puntos por equipo y temporada. Se actualiza automáticamente desde positions.';

COMMENT ON COLUMN team_season_points.beach_mixed_points IS 
  'Puntos base (sin coeficiente de antigüedad) en playa mixto para esta temporada';

COMMENT ON COLUMN team_season_points.is_complete IS 
  'TRUE cuando la temporada ha cerrado oficialmente y ya no se esperan más cambios';

-- 6. Política de seguridad (Row Level Security)
-- Permitir lectura pública, escritura solo para roles autorizados
ALTER TABLE team_season_points ENABLE ROW LEVEL SECURITY;

-- Política de lectura: todos pueden leer
CREATE POLICY "Permitir lectura pública de puntos por temporada"
  ON team_season_points
  FOR SELECT
  USING (true);

-- Política de escritura: solo usuarios autenticados
CREATE POLICY "Permitir escritura a usuarios autenticados"
  ON team_season_points
  FOR ALL
  USING (auth.role() = 'authenticated');

-- ================================================
-- Fin de migración
-- ================================================

-- Para verificar que se creó correctamente:
-- SELECT * FROM team_season_points LIMIT 5;

