-- Probar la función get_tournament_split
SELECT 
  'playa' as surface,
  'mixto' as modality,
  get_tournament_split('playa', 'mixto') as split;

SELECT 
  'césped' as surface,
  'open' as modality,
  get_tournament_split('césped', 'open') as split;

-- Probar la función calculate_regional_coefficient
SELECT 
  id as region_id,
  name as region_name,
  calculate_regional_coefficient(id, '2024/2025') as coefficient
FROM regions
LIMIT 5;

-- Probar la función calculate_split_ranking (solo si hay datos)
SELECT * FROM calculate_split_ranking('2024/2025', 'playa-mixto')
LIMIT 5;

-- Verificar configuración
SELECT * FROM configuration;

-- Verificar torneos actualizados
SELECT 
  COUNT(*) as total_tournaments,
  COUNT(CASE WHEN season IS NOT NULL THEN 1 END) as with_season,
  COUNT(CASE WHEN split IS NOT NULL THEN 1 END) as with_split,
  COUNT(CASE WHEN is_finished = true THEN 1 END) as finished_tournaments
FROM tournaments;


