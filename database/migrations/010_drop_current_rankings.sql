-- ================================================
-- Migración: Eliminar tabla current_rankings
-- ================================================
-- 
-- ⚠️  IMPORTANTE: SOLO EJECUTAR DESPUÉS DE:
-- 
-- 1. Migración 007 ejecutada (team_season_rankings creada)
-- 2. Migración de datos completada (migrateToNewRankingSystem.ts)
-- 3. Sistema validado en producción
-- 4. Sin errores durante al menos 1 semana
-- 5. Confirmación de que team_season_rankings funciona correctamente
-- 
-- ================================================

-- 1. Crear tabla de respaldo (por seguridad)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'current_rankings') THEN
    -- Crear respaldo con timestamp
    EXECUTE format(
      'CREATE TABLE current_rankings_backup_%s AS SELECT * FROM current_rankings',
      to_char(now(), 'YYYYMMDD_HH24MISS')
    );
    RAISE NOTICE 'Respaldo creado: current_rankings_backup_%', to_char(now(), 'YYYYMMDD_HH24MISS');
  END IF;
END $$;

-- 2. Verificar que team_season_rankings tiene datos
DO $$ 
DECLARE
  rankings_count INTEGER;
  current_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rankings_count FROM team_season_rankings;
  SELECT COUNT(*) INTO current_count FROM current_rankings;
  
  IF rankings_count = 0 THEN
    RAISE EXCEPTION 'ABORT: team_season_rankings está vacía. Ejecuta primero la migración de datos.';
  END IF;
  
  IF rankings_count < (current_count / 6) THEN
    RAISE WARNING 'ADVERTENCIA: team_season_rankings tiene menos registros de lo esperado.';
    RAISE WARNING 'current_rankings: % registros', current_count;
    RAISE WARNING 'team_season_rankings: % registros', rankings_count;
    RAISE WARNING 'Verifica que la migración se ejecutó correctamente antes de continuar.';
  END IF;
  
  RAISE NOTICE 'Verificación OK: team_season_rankings tiene % registros', rankings_count;
END $$;

-- 3. Eliminar tabla current_rankings
DROP TABLE IF EXISTS current_rankings CASCADE;

-- 4. Verificar que se eliminó correctamente
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'current_rankings') THEN
    RAISE EXCEPTION 'ERROR: No se pudo eliminar current_rankings';
  ELSE
    RAISE NOTICE 'OK: Tabla current_rankings eliminada exitosamente';
  END IF;
END $$;

-- 5. Listar tablas de respaldo disponibles
SELECT 
  'Respaldos disponibles' as status,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE tablename LIKE 'current_rankings_backup%'
ORDER BY tablename DESC;

-- ================================================
-- Notas post-eliminación:
-- ================================================
-- 
-- 1. Las tablas de respaldo se pueden eliminar después de 1 mes:
--    DROP TABLE current_rankings_backup_YYYYMMDD_HH24MISS;
-- 
-- 2. Si necesitas restaurar (emergencia):
--    CREATE TABLE current_rankings AS 
--    SELECT * FROM current_rankings_backup_YYYYMMDD_HH24MISS;
-- 
-- 3. Actualizar código:
--    - Eliminar referencias a current_rankings
--    - Usar team_season_rankings en su lugar
--    - Limpiar funciones deprecated
-- 
-- ================================================
-- Fin de migración
-- ================================================

