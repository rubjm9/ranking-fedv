-- ================================================
-- Migración: Rankings de subtemporada Open y Women por separado
-- Tabla: team_season_points
-- Para rankings globales (playa, césped, general) se suman; para datos se guardan por modalidad.
-- ================================================

-- Columnas por modalidad para subtemporadas 2 y 4 (open y women separados)
ALTER TABLE team_season_points ADD COLUMN IF NOT EXISTS subseason_2_beach_open_rank INTEGER;
ALTER TABLE team_season_points ADD COLUMN IF NOT EXISTS subseason_2_beach_women_rank INTEGER;
ALTER TABLE team_season_points ADD COLUMN IF NOT EXISTS subseason_4_grass_open_rank INTEGER;
ALTER TABLE team_season_points ADD COLUMN IF NOT EXISTS subseason_4_grass_women_rank INTEGER;

COMMENT ON COLUMN team_season_points.subseason_2_beach_open_rank IS 'Ranking en subtemporada 2: solo playa open';
COMMENT ON COLUMN team_season_points.subseason_2_beach_women_rank IS 'Ranking en subtemporada 2: solo playa women';
COMMENT ON COLUMN team_season_points.subseason_4_grass_open_rank IS 'Ranking en subtemporada 4: solo césped open';
COMMENT ON COLUMN team_season_points.subseason_4_grass_women_rank IS 'Ranking en subtemporada 4: solo césped women';
