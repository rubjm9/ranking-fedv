-- ================================================
-- Migración: Sistema optimizado de rankings
-- Tabla: team_season_rankings (rankings históricos por modalidad)
-- ================================================

-- 1. Crear tabla team_season_rankings
CREATE TABLE IF NOT EXISTS team_season_rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  season VARCHAR(10) NOT NULL,
  
  -- Rankings y puntos por modalidad (CON coeficientes de antigüedad aplicados)
  beach_mixed_rank INTEGER,
  beach_mixed_points DECIMAL(10,2) DEFAULT 0,
  
  beach_open_rank INTEGER,
  beach_open_points DECIMAL(10,2) DEFAULT 0,
  
  beach_women_rank INTEGER,
  beach_women_points DECIMAL(10,2) DEFAULT 0,
  
  grass_mixed_rank INTEGER,
  grass_mixed_points DECIMAL(10,2) DEFAULT 0,
  
  grass_open_rank INTEGER,
  grass_open_points DECIMAL(10,2) DEFAULT 0,
  
  grass_women_rank INTEGER,
  grass_women_points DECIMAL(10,2) DEFAULT 0,
  
  -- Metadata
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_team_season UNIQUE(team_id, season),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_team_season_rankings_team 
  ON team_season_rankings(team_id);

CREATE INDEX IF NOT EXISTS idx_team_season_rankings_season 
  ON team_season_rankings(season);

CREATE INDEX IF NOT EXISTS idx_team_season_rankings_team_season 
  ON team_season_rankings(team_id, season);

-- Índices compuestos para consultas de modalidad específica
CREATE INDEX IF NOT EXISTS idx_team_season_rankings_season_beach_mixed 
  ON team_season_rankings(season, beach_mixed_rank) 
  WHERE beach_mixed_rank IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_team_season_rankings_season_beach_open 
  ON team_season_rankings(season, beach_open_rank) 
  WHERE beach_open_rank IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_team_season_rankings_season_beach_women 
  ON team_season_rankings(season, beach_women_rank) 
  WHERE beach_women_rank IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_team_season_rankings_season_grass_mixed 
  ON team_season_rankings(season, grass_mixed_rank) 
  WHERE grass_mixed_rank IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_team_season_rankings_season_grass_open 
  ON team_season_rankings(season, grass_open_rank) 
  WHERE grass_open_rank IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_team_season_rankings_season_grass_women 
  ON team_season_rankings(season, grass_women_rank) 
  WHERE grass_women_rank IS NOT NULL;

-- 3. Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_team_season_rankings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear trigger para actualizar timestamp
DROP TRIGGER IF EXISTS trigger_update_team_season_rankings_timestamp 
  ON team_season_rankings;

CREATE TRIGGER trigger_update_team_season_rankings_timestamp
  BEFORE UPDATE ON team_season_rankings
  FOR EACH ROW
  EXECUTE FUNCTION update_team_season_rankings_updated_at();

-- 5. Comentarios para documentación
COMMENT ON TABLE team_season_rankings IS 
  'Rankings históricos por modalidad con coeficientes de antigüedad aplicados. 
   Permite consultar el ranking de cualquier equipo en cualquier temporada y modalidad.';

COMMENT ON COLUMN team_season_rankings.beach_mixed_rank IS 
  'Posición en el ranking de playa mixto (incluye últimas 4 temporadas con coeficientes)';

COMMENT ON COLUMN team_season_rankings.beach_mixed_points IS 
  'Puntos totales de playa mixto con coeficientes aplicados (1.0, 0.8, 0.5, 0.2)';

COMMENT ON COLUMN team_season_rankings.beach_open_rank IS 
  'Posición en el ranking de playa open (incluye últimas 4 temporadas con coeficientes)';

COMMENT ON COLUMN team_season_rankings.beach_open_points IS 
  'Puntos totales de playa open con coeficientes aplicados (1.0, 0.8, 0.5, 0.2)';

COMMENT ON COLUMN team_season_rankings.beach_women_rank IS 
  'Posición en el ranking de playa women (incluye últimas 4 temporadas con coeficientes)';

COMMENT ON COLUMN team_season_rankings.beach_women_points IS 
  'Puntos totales de playa women con coeficientes aplicados (1.0, 0.8, 0.5, 0.2)';

COMMENT ON COLUMN team_season_rankings.grass_mixed_rank IS 
  'Posición en el ranking de césped mixto (incluye últimas 4 temporadas con coeficientes)';

COMMENT ON COLUMN team_season_rankings.grass_mixed_points IS 
  'Puntos totales de césped mixto con coeficientes aplicados (1.0, 0.8, 0.5, 0.2)';

COMMENT ON COLUMN team_season_rankings.grass_open_rank IS 
  'Posición en el ranking de césped open (incluye últimas 4 temporadas con coeficientes)';

COMMENT ON COLUMN team_season_rankings.grass_open_points IS 
  'Puntos totales de césped open con coeficientes aplicados (1.0, 0.8, 0.5, 0.2)';

COMMENT ON COLUMN team_season_rankings.grass_women_rank IS 
  'Posición en el ranking de césped women (incluye últimas 4 temporadas con coeficientes)';

COMMENT ON COLUMN team_season_rankings.grass_women_points IS 
  'Puntos totales de césped women con coeficientes aplicados (1.0, 0.8, 0.5, 0.2)';

COMMENT ON COLUMN team_season_rankings.calculated_at IS 
  'Timestamp de cuando se calcularon los rankings para esta temporada';

-- 6. Política de seguridad (Row Level Security)
ALTER TABLE team_season_rankings ENABLE ROW LEVEL SECURITY;

-- Política de lectura: todos pueden leer
CREATE POLICY "Permitir lectura pública de rankings por temporada"
  ON team_season_rankings
  FOR SELECT
  USING (true);

-- Política de escritura: solo usuarios autenticados
CREATE POLICY "Permitir escritura a usuarios autenticados"
  ON team_season_rankings
  FOR ALL
  USING (auth.role() = 'authenticated');

-- ================================================
-- Fin de migración
-- ================================================

-- Para verificar que se creó correctamente:
SELECT 
  'Tabla team_season_rankings creada exitosamente' as status,
  COUNT(*) as total_indexes
FROM pg_indexes 
WHERE tablename = 'team_season_rankings';

