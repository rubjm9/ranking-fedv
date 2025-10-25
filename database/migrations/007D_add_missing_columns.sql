-- ================================================
-- Migración 007D: Agregar columnas faltantes a team_season_rankings
-- ================================================

-- Agregar columnas de rankings que faltaron
ALTER TABLE team_season_rankings 
ADD COLUMN IF NOT EXISTS beach_mixed_rank INTEGER;

ALTER TABLE team_season_rankings 
ADD COLUMN IF NOT EXISTS beach_open_rank INTEGER;

ALTER TABLE team_season_rankings 
ADD COLUMN IF NOT EXISTS beach_women_rank INTEGER;

ALTER TABLE team_season_rankings 
ADD COLUMN IF NOT EXISTS grass_mixed_rank INTEGER;

ALTER TABLE team_season_rankings 
ADD COLUMN IF NOT EXISTS grass_open_rank INTEGER;

ALTER TABLE team_season_rankings 
ADD COLUMN IF NOT EXISTS grass_women_rank INTEGER;

-- Agregar columna calculated_at que faltó
ALTER TABLE team_season_rankings 
ADD COLUMN IF NOT EXISTS calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Cambiar tipos de datos de puntos de INTEGER a DECIMAL(10,2)
ALTER TABLE team_season_rankings 
ALTER COLUMN beach_mixed_points TYPE DECIMAL(10,2);

ALTER TABLE team_season_rankings 
ALTER COLUMN beach_open_points TYPE DECIMAL(10,2);

ALTER TABLE team_season_rankings 
ALTER COLUMN beach_women_points TYPE DECIMAL(10,2);

ALTER TABLE team_season_rankings 
ALTER COLUMN grass_mixed_points TYPE DECIMAL(10,2);

ALTER TABLE team_season_rankings 
ALTER COLUMN grass_open_points TYPE DECIMAL(10,2);

ALTER TABLE team_season_rankings 
ALTER COLUMN grass_women_points TYPE DECIMAL(10,2);

-- Agregar constraint único que faltó
ALTER TABLE team_season_rankings 
ADD CONSTRAINT IF NOT EXISTS unique_team_season UNIQUE(team_id, season);

-- Verificar estructura final
SELECT 
  'Columnas agregadas exitosamente' as status,
  COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'team_season_rankings';

-- Mostrar estructura completa
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'team_season_rankings'
ORDER BY ordinal_position;
