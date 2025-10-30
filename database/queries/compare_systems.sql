-- ================================================
-- VALIDACIÓN: Comparar con current_rankings
-- ================================================

-- Comparar top 10 de beach_mixed entre nuevo y viejo sistema
-- (Para verificar que los valores tienen sentido)

WITH nuevo_sistema AS (
  SELECT 
    t.name as equipo,
    tsr.beach_mixed_points,
    tsr.beach_mixed_rank
  FROM team_season_rankings tsr
  JOIN teams t ON t.id = tsr.team_id
  WHERE tsr.season = '2025-26'
  ORDER BY tsr.beach_mixed_rank ASC
  LIMIT 10
),
viejo_sistema AS (
  SELECT 
    t.name as equipo,
    cr.total_points,
    cr.rank
  FROM current_rankings cr
  JOIN teams t ON t.id = cr.team_id
  WHERE cr.ranking_category = 'beach_mixed'
  ORDER BY cr.rank ASC
  LIMIT 10
)
SELECT 
  n.equipo,
  n.beach_mixed_rank as rank_nuevo,
  n.beach_mixed_points as puntos_nuevo,
  v.rank as rank_viejo,
  v.total_points as puntos_viejo
FROM nuevo_sistema n
LEFT JOIN viejo_sistema v ON n.equipo = v.equipo
ORDER BY n.beach_mixed_rank ASC;
