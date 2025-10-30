-- ================================================
-- Migración: Preparar sistema para coeficientes regionales
-- Agregar columna para indicar si el coeficiente regional está aplicado
-- ================================================

-- 1. Verificar que existe la tabla regional_coefficients
-- (Ya debería existir según el código actual)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'regional_coefficients') THEN
    RAISE NOTICE 'ADVERTENCIA: La tabla regional_coefficients no existe. Deberá crearse cuando se implemente el sistema.';
  ELSE
    RAISE NOTICE 'OK: La tabla regional_coefficients ya existe.';
  END IF;
END $$;

-- 2. Agregar columna para indicar si los puntos tienen coeficiente regional aplicado
ALTER TABLE positions ADD COLUMN IF NOT EXISTS has_regional_coefficient BOOLEAN DEFAULT false;

-- 3. Marcar todos los puntos existentes como sin coeficiente regional
UPDATE positions SET has_regional_coefficient = false WHERE has_regional_coefficient IS NULL;

-- 4. Crear índice para optimizar consultas futuras
CREATE INDEX IF NOT EXISTS idx_positions_regional_coefficient 
  ON positions(has_regional_coefficient) 
  WHERE has_regional_coefficient = true;

-- 5. Comentarios para documentación
COMMENT ON COLUMN positions.has_regional_coefficient IS 
  'TRUE si los puntos ya incluyen el coeficiente regional aplicado. 
   Por ahora siempre FALSE (coeficiente = 1.0). 
   Se usará en implementación futura del sistema de coeficientes regionales.';

-- 6. Agregar notas sobre el sistema futuro
COMMENT ON TABLE regional_coefficients IS 
  'Coeficientes regionales por temporada. 
   Se calcularán dinámicamente basados en el rendimiento de equipos de cada región.
   Rango: 0.8 (mínimo) a 1.2 (máximo).
   Se aplicarán SOLO a torneos regionales, NO a CE1 ni CE2.';

-- 7. Verificar el estado
SELECT 
  'Preparación completada' as status,
  COUNT(*) as total_positions,
  COUNT(*) FILTER (WHERE has_regional_coefficient = true) as with_coefficient,
  COUNT(*) FILTER (WHERE has_regional_coefficient = false) as without_coefficient
FROM positions;

-- ================================================
-- Notas para implementación futura:
-- ================================================
-- 
-- Cuando se implemente el sistema de coeficientes regionales:
-- 
-- 1. Calcular coeficientes:
--    - Usar seasonService.calculateRegionalCoefficients(season)
--    - Almacenar en tabla regional_coefficients
-- 
-- 2. Aplicar al crear/editar positions:
--    - Si torneo es REGIONAL: points = base_points * region_coefficient
--    - Si torneo es CE1 o CE2: points = base_points (sin coeficiente)
--    - Marcar has_regional_coefficient = true si se aplicó
-- 
-- 3. Recalcular puntos históricos:
--    - Ejecutar para cada temporada desde la implementación
--    - Actualizar team_season_points con nuevos puntos
--    - Recalcular team_season_rankings automáticamente
-- 
-- 4. Validar:
--    - Verificar que puntos regionales tienen coeficiente correcto
--    - Comparar rankings antes/después de implementación
--    - Ajustar parámetros (floor, ceiling, increment) si es necesario
--
-- ================================================
-- Fin de migración
-- ================================================

