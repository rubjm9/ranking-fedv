-- Probar el ranking de Mixto-Playa de forma simplificada
-- Primero verificar que tenemos torneos de Mixto-Playa
SELECT 
  id,
  name,
  type,
  surface,
  modality,
  season,
  split,
  is_finished,
  regional_coefficient
FROM tournaments 
WHERE split = 'playa-mixto' 
AND season = '2025/2026'
ORDER BY "startDate";

-- Verificar que tenemos posiciones para estos torneos
SELECT 
  t.name as tournament_name,
  COUNT(p.id) as positions_count,
  SUM(p.points) as total_points
FROM tournaments t
LEFT JOIN positions p ON t.id = p."tournamentId"
WHERE t.split = 'playa-mixto' 
AND t.season = '2025/2026'
GROUP BY t.id, t.name
ORDER BY t."startDate";

-- Calcular ranking manualmente
WITH team_points AS (
  SELECT 
    t.id as team_id,
    t.name as team_name,
    r.name as region_name,
    COALESCE(SUM(
      CASE 
        WHEN tr.type = 'REGIONAL' THEN p.points * COALESCE(tr.regional_coefficient, 1.0)
        ELSE p.points
      END
    ), 0) as total_points,
    COUNT(DISTINCT tr.id) as tournaments_count
  FROM teams t
  LEFT JOIN regions r ON t."regionId" = r.id
  LEFT JOIN positions p ON p."teamId" = t.id
  LEFT JOIN tournaments tr ON p."tournamentId" = tr.id
  WHERE tr.season = '2025/2026' 
  AND tr.split = 'playa-mixto'
  AND tr.is_finished = true
  GROUP BY t.id, t.name, r.name
)
SELECT 
  tp.team_id,
  tp.team_name,
  tp.region_name,
  tp.total_points,
  tp.tournaments_count,
  ROW_NUMBER() OVER (ORDER BY tp.total_points DESC)::INTEGER as rank
FROM team_points tp
WHERE tp.total_points > 0
ORDER BY tp.total_points DESC;


