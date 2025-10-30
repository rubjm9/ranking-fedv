-- ================================================
-- Migración 007B: Crear índices para team_season_rankings
-- ================================================

-- Índices básicos
CREATE INDEX IF NOT EXISTS idx_team_season_rankings_team 
  ON team_season_rankings(team_id);

CREATE INDEX IF NOT EXISTS idx_team_season_rankings_season 
  ON team_season_rankings(season);

CREATE INDEX IF NOT EXISTS idx_team_season_rankings_team_season 
  ON team_season_rankings(team_id, season);

-- Índices compuestos para consultas de modalidad específica
CREATE INDEX IF NOT EXISTS idx_team_season_rankings_season_beach_mixed 
  ON team_season_rankings(season, beach_mixed_rank);

CREATE INDEX IF NOT EXISTS idx_team_season_rankings_season_beach_open 
  ON team_season_rankings(season, beach_open_rank);

CREATE INDEX IF NOT EXISTS idx_team_season_rankings_season_beach_women 
  ON team_season_rankings(season, beach_women_rank);

CREATE INDEX IF NOT EXISTS idx_team_season_rankings_season_grass_mixed 
  ON team_season_rankings(season, grass_mixed_rank);

CREATE INDEX IF NOT EXISTS idx_team_season_rankings_season_grass_open 
  ON team_season_rankings(season, grass_open_rank);

CREATE INDEX IF NOT EXISTS idx_team_season_rankings_season_grass_women 
  ON team_season_rankings(season, grass_women_rank);

-- Verificar índices creados
SELECT 
  'Índices creados exitosamente' as status,
  COUNT(*) as total_indexes
FROM pg_indexes 
WHERE tablename = 'team_season_rankings';
