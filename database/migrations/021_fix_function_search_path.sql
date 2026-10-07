-- Fija el search_path de las funciones de public (lint 0011 del Security Advisor).
-- Seguro de ejecutar varias veces; no cambia la lógica de las funciones.
DO $$
DECLARE
  f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND p.proname IN (
        'get_ranking_category','get_current_season','recalculate_season_rankings',
        'create_admin_notification','update_team_season_points_updated_at',
        'update_team_season_rankings_updated_at','calculate_general_ranking',
        'calculate_regional_coefficient','get_tournament_split','recalculate_current_rankings',
        'calculate_split_ranking','calculate_team_ranking','get_region_stats',
        'get_region_ranking','get_team_ranking_history','get_system_stats',
        'test_ranking_structure','calculate_team_ranking_simple','get_sample_data',
        'get_basic_stats','update_updated_at_column'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', f.sig);
  END LOOP;
END $$;
