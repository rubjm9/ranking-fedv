-- ================================================
-- Migración: Convertir team_id de números a UUIDs
-- Problema: Los team_id en positions son números (4, 5, 6...) en lugar de UUIDs
-- Solución: Crear nueva tabla teams con UUIDs y migrar datos
-- ================================================

-- 1. Crear tabla temporal con estructura correcta
CREATE TABLE IF NOT EXISTS teams_new (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  club VARCHAR(255),
  region_id UUID REFERENCES regions(id),
  email VARCHAR(255),
  logo TEXT,
  location VARCHAR(255),
  is_filial BOOLEAN DEFAULT false,
  parent_team_id UUID REFERENCES teams_new(id),
  has_different_names BOOLEAN DEFAULT false,
  name_open VARCHAR(255),
  name_women VARCHAR(255),
  name_mixed VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Migrar datos existentes (si los hay)
-- Esto creará UUIDs nuevos para cada equipo existente
INSERT INTO teams_new (
  name, club, region_id, email, logo, location, 
  is_filial, has_different_names, name_open, name_women, name_mixed
)
SELECT 
  name, club, region_id, email, logo, location,
  is_filial, has_different_names, name_open, name_women, name_mixed
FROM teams
ON CONFLICT DO NOTHING;

-- 3. Crear tabla de mapeo temporal para actualizar referencias
CREATE TEMP TABLE team_id_mapping AS
SELECT 
  old_teams.id as old_id,
  new_teams.id as new_id
FROM teams old_teams
JOIN teams_new new_teams ON old_teams.name = new_teams.name;

-- 4. Actualizar tabla positions con nuevos UUIDs
UPDATE positions 
SET team_id = mapping.new_id::text
FROM team_id_mapping mapping
WHERE positions.team_id = mapping.old_id::text;

-- 5. Actualizar tabla current_rankings con nuevos UUIDs
UPDATE current_rankings 
SET team_id = mapping.new_id::text
FROM team_id_mapping mapping
WHERE current_rankings.team_id = mapping.old_id::text;

-- 6. Actualizar referencias de parent_team_id en teams_new
UPDATE teams_new 
SET parent_team_id = mapping.new_id
FROM team_id_mapping mapping
WHERE teams_new.parent_team_id = mapping.old_id;

-- 7. Eliminar tabla antigua y renombrar la nueva
DROP TABLE IF EXISTS teams CASCADE;
ALTER TABLE teams_new RENAME TO teams;

-- 8. Recrear índices
CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);
CREATE INDEX IF NOT EXISTS idx_teams_region ON teams(region_id);
CREATE INDEX IF NOT EXISTS idx_teams_parent ON teams(parent_team_id);
CREATE INDEX IF NOT EXISTS idx_teams_filial ON teams(is_filial);

-- 9. Recrear foreign keys
ALTER TABLE positions 
ADD CONSTRAINT fk_positions_team_id 
FOREIGN KEY (team_id) REFERENCES teams(id);

ALTER TABLE current_rankings 
ADD CONSTRAINT fk_current_rankings_team_id 
FOREIGN KEY (team_id) REFERENCES teams(id);

-- 10. Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Trigger para actualizar timestamp automáticamente
DROP TRIGGER IF EXISTS trigger_update_teams_updated_at ON teams;
CREATE TRIGGER trigger_update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_teams_updated_at();

-- 12. Verificar la migración
DO $$
DECLARE
  team_count INTEGER;
  position_count INTEGER;
  ranking_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO team_count FROM teams;
  SELECT COUNT(*) INTO position_count FROM positions WHERE team_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  SELECT COUNT(*) INTO ranking_count FROM current_rankings WHERE team_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  
  RAISE NOTICE 'Migración completada:';
  RAISE NOTICE '- Equipos migrados: %', team_count;
  RAISE NOTICE '- Posiciones con UUIDs válidos: %', position_count;
  RAISE NOTICE '- Rankings con UUIDs válidos: %', ranking_count;
END $$;

