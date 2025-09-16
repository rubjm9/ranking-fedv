-- Agregar campo descripción a la tabla tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS description TEXT;

-- Actualizar algunos torneos de ejemplo con descripciones
UPDATE tournaments SET description = 'El campeonato más importante de España para equipos de primera división. Celebrado en diferentes ciudades cada año con la participación de los mejores equipos del país.' WHERE type = 'CE1';

UPDATE tournaments SET description = 'Campeonato de segunda división que sirve como puente hacia la primera división. Participan equipos en ascenso y aquellos que buscan mejorar su nivel competitivo.' WHERE type = 'CE2';

UPDATE tournaments SET description = 'Torneo regional que determina los representantes de cada región en los campeonatos nacionales. Participan equipos de diferentes niveles de la región.' WHERE type = 'REGIONAL';

-- Verificar que se agregó el campo
SELECT 
  id,
  name,
  type,
  description
FROM tournaments 
WHERE description IS NOT NULL
LIMIT 3;


