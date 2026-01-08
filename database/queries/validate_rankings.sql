-- ================================================
-- VALIDACIÓN: Verificar datos de rankings migrados
-- ================================================

-- 1. Verificar que tenemos datos en team_season_rankings
SELECT COUNT(*) as total_registros 
FROM team_season_rankings;

-- 2. Ver temporadas disponibles
SELECT 
  season,
  COUNT(*) as equipos
FROM team_season_rankings
GROUP BY season
ORDER BY season DESC;

-- 3. Ver ejemplo de datos completos de un equipo (AC Palma)
SELECT 
  t.name as equipo,
  tsr.season,
  tsr.beach_mixed_rank,
  tsr.beach_mixed_points,
  tsr.beach_open_rank,
  tsr.beach_open_points,
  tsr.grass_mixed_rank,
  tsr.grass_mixed_points
FROM team_season_rankings tsr
JOIN teams t ON t.id = tsr.team_id
WHERE t.name = 'AC Palma'
ORDER BY tsr.season DESC;

-- 4. Ver top 5 de beach_mixed en temporada actual
SELECT 
  t.name as equipo,
  tsr.beach_mixed_rank,
  tsr.beach_mixed_points
FROM team_season_rankings tsr
JOIN teams t ON t.id = tsr.team_id
WHERE tsr.season = '2025-26'
  AND tsr.beach_mixed_rank IS NOT NULL
ORDER BY tsr.beach_mixed_rank ASC
LIMIT 5;

-- 5. Ver si hay rankings completos (todas las superficies con data)
SELECT 
  season,
  COUNT(*) as equipos,
  COUNT(beach_mixed_rank) as con_beach_mixed,
  COUNT(beach_open_rank) as con_beach_open,
  COUNT(beach_women_rank) as con_beach_women,
  COUNT(grass_mixed_rank) as con_grass_mixed,
  COUNT(grass_open_rank) as con_grass_open,
  COUNT(grass_women_rank) as con_grass_women
FROM team_season_rankings
GROUP BY season
ORDER BY season DESC;
