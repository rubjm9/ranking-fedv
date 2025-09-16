-- Corregir función calculate_split_ranking para usar comillas dobles
CREATE OR REPLACE FUNCTION calculate_split_ranking(
  season_param TEXT,
  split_param TEXT
) RETURNS TABLE(
  team_id TEXT,
  team_name TEXT,
  region_name TEXT,
  total_points DECIMAL(10,2),
  tournaments_count INTEGER,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
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
    WHERE tr.season = season_param 
    AND tr.split = split_param
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
END;
$$ LANGUAGE plpgsql;


