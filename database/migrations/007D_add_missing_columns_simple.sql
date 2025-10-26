-- ================================================
-- Migración 007D (Versión Simplificada): Agregar columnas faltantes
-- ================================================

-- Agregar columnas de rankings
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

-- Agregar columna calculated_at
ALTER TABLE team_season_rankings 
ADD COLUMN IF NOT EXISTS calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

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
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'team_season_rankings'
ORDER BY ordinal_position;
