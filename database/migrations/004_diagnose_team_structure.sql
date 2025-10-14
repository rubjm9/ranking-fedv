-- ================================================
-- Script de diagnóstico: Verificar estructura de teams
-- Ejecutar ANTES de la migración para entender el problema
-- ================================================

-- 1. Verificar estructura actual de la tabla teams
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'teams' 
ORDER BY ordinal_position;

-- 2. Verificar tipos de datos en team_id de positions
SELECT 
  team_id,
  typeof(team_id) as data_type,
  COUNT(*) as count
FROM positions 
GROUP BY team_id, typeof(team_id)
ORDER BY count DESC
LIMIT 10;

-- 3. Verificar si hay referencias válidas entre teams y positions
SELECT 
  'Positions con team_id que NO existe en teams' as issue,
  COUNT(*) as count
FROM positions p
LEFT JOIN teams t ON p.team_id = t.id::text
WHERE t.id IS NULL

UNION ALL

SELECT 
  'Positions con team_id que SÍ existe en teams' as issue,
  COUNT(*) as count
FROM positions p
INNER JOIN teams t ON p.team_id = t.id::text;

-- 4. Verificar estructura de la tabla regions (para foreign key)
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'regions' 
ORDER BY ordinal_position;

-- 5. Verificar si regions usa UUIDs
SELECT 
  id,
  typeof(id) as data_type,
  COUNT(*) as count
FROM regions 
GROUP BY id, typeof(id)
LIMIT 5;

