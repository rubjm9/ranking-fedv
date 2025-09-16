-- Corregir función calculate_general_ranking para usar comillas dobles
CREATE OR REPLACE FUNCTION calculate_general_ranking(
  season_param TEXT
) RETURNS TABLE(
  team_id TEXT,
  team_name TEXT,
  region_name TEXT,
  total_points DECIMAL(10,2),
  tournaments_count INTEGER,
  rank INTEGER,
  previous_rank INTEGER,
  change INTEGER
) AS $$
DECLARE
  current_year INTEGER;
  previous_year INTEGER;
  two_years_ago INTEGER;
  three_years_ago INTEGER;
BEGIN
  -- Extraer año de la temporada (ej: "2024/2025" -> 2024)
  current_year := CAST(SPLIT_PART(season_param, '/', 1) AS INTEGER);
  previous_year := current_year - 1;
  two_years_ago := current_year - 2;
  three_years_ago := current_year - 3;
  
  RETURN QUERY
  WITH team_points AS (
    SELECT 
      t.id as team_id,
      t.name as team_name,
      r.name as region_name,
      COALESCE(SUM(
        CASE 
          WHEN EXTRACT(YEAR FROM tr."startDate") = current_year THEN
            CASE 
              WHEN tr.type = 'REGIONAL' THEN p.points * COALESCE(tr.regional_coefficient, 1.0) * 1.0
              ELSE p.points * 1.0
            END
          WHEN EXTRACT(YEAR FROM tr."startDate") = previous_year THEN
            CASE 
              WHEN tr.type = 'REGIONAL' THEN p.points * COALESCE(tr.regional_coefficient, 1.0) * 0.8
              ELSE p.points * 0.8
            END
          WHEN EXTRACT(YEAR FROM tr."startDate") = two_years_ago THEN
            CASE 
              WHEN tr.type = 'REGIONAL' THEN p.points * COALESCE(tr.regional_coefficient, 1.0) * 0.5
              ELSE p.points * 0.5
            END
          WHEN EXTRACT(YEAR FROM tr."startDate") = three_years_ago THEN
            CASE 
              WHEN tr.type = 'REGIONAL' THEN p.points * COALESCE(tr.regional_coefficient, 1.0) * 0.2
              ELSE p.points * 0.2
            END
          ELSE 0
        END
      ), 0) as total_points,
      COUNT(DISTINCT tr.id) as tournaments_count
    FROM teams t
    LEFT JOIN regions r ON t."regionId" = r.id
    LEFT JOIN positions p ON p."teamId" = t.id
    LEFT JOIN tournaments tr ON p."tournamentId" = tr.id
    WHERE tr.is_finished = true
    AND EXTRACT(YEAR FROM tr."startDate") BETWEEN three_years_ago AND current_year
    GROUP BY t.id, t.name, r.name
  ),
  ranked_teams AS (
    SELECT 
      tp.*,
      ROW_NUMBER() OVER (ORDER BY tp.total_points DESC)::INTEGER as rank
    FROM team_points tp
    WHERE tp.total_points > 0
  )
  SELECT 
    rt.team_id,
    rt.team_name,
    rt.region_name,
    rt.total_points,
    rt.tournaments_count,
    rt.rank,
    0::INTEGER as previous_rank, -- TODO: Implementar cálculo de ranking anterior
    0::INTEGER as change -- TODO: Implementar cálculo de cambio
  FROM ranked_teams rt
  ORDER BY rt.total_points DESC;
END;
$$ LANGUAGE plpgsql;


