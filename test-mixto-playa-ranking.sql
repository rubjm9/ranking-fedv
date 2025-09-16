-- Probar el ranking de Mixto-Playa con los 4 torneos de ejemplo
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

-- Calcular ranking de Mixto-Playa usando la función
SELECT * FROM calculate_split_ranking('2025/2026', 'playa-mixto')
ORDER BY rank;

-- Verificar equipos y sus puntos por torneo
SELECT 
  t.name as tournament_name,
  tm.name as team_name,
  r.name as region_name,
  p.position,
  p.points,
  CASE 
    WHEN t.type = 'REGIONAL' THEN p.points * COALESCE(t.regional_coefficient, 1.0)
    ELSE p.points
  END as adjusted_points
FROM tournaments t
JOIN positions p ON t.id = p."tournamentId"
JOIN teams tm ON p."teamId" = tm.id
LEFT JOIN regions r ON tm."regionId" = r.id
WHERE t.split = 'playa-mixto' 
AND t.season = '2025/2026'
ORDER BY t."startDate", p.position;


