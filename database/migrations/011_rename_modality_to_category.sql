-- Migración 011: Renombrar columna 'modality' a 'category' en tabla 'tournaments'
-- 
-- Esta migración actualiza la terminología de la base de datos para alinearse con
-- las definiciones correctas:
-- - Modalidad: Disco Volador entero (a nivel legal y CSD)
-- - Superficie: Disciplina concreta (ultimate césped, ultimate playa, disc golf)
-- - Categoría: Clasificación según edad/género (mixto, open, women, sub24...)
--
-- La columna 'modality' en 'tournaments' almacenaba valores como 'OPEN', 'MIXED', 'WOMEN',
-- que corresponden a la definición de 'Categoría', por lo que se renombra a 'category'.

BEGIN;

-- Renombrar la columna
ALTER TABLE tournaments 
  RENAME COLUMN modality TO category;

-- Actualizar comentarios si existen
COMMENT ON COLUMN tournaments.category IS 
  'Categoría del torneo: OPEN, MIXED, WOMEN (clasificación según edad/género)';

COMMIT;

