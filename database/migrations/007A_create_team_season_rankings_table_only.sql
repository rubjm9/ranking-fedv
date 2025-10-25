-- ================================================
-- Migración 007A: Crear tabla team_season_rankings (SOLO TABLA)
-- ================================================

-- Crear tabla team_season_rankings
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

-- Verificar que se creó correctamente
SELECT 
  'Tabla team_season_rankings creada exitosamente' as status,
  COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'team_season_rankings';
