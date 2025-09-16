-- Diagnóstico del esquema de Supabase
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar estructura de la tabla regions
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'regions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar estructura de la tabla teams
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'teams' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar estructura de la tabla tournaments
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tournaments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar estructura de la tabla positions
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'positions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Verificar datos existentes en regions
SELECT * FROM regions LIMIT 5;
