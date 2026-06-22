-- ================================================
-- Migración 015: Añadir slug a equipos para URLs públicas
-- Formato: nombre normalizado (minúsculas, sin tildes, guiones)
-- Ejemplo: "Málaga Ultimate B" -> "malaga-ultimate-b"
-- ================================================

ALTER TABLE teams ADD COLUMN IF NOT EXISTS slug TEXT;

COMMENT ON COLUMN teams.slug IS 'URL pública del equipo en /equipos/:slug. Derivado del nombre, único.';

CREATE UNIQUE INDEX IF NOT EXISTS teams_slug_unique ON teams(slug) WHERE slug IS NOT NULL;

-- Validación: comprobar que la columna existe
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'teams' AND column_name = 'slug';
