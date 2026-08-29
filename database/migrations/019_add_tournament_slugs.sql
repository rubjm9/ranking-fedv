-- ================================================
-- Migración 019: Añadir slug a campeonatos para URLs públicas
-- Formato: título SEO normalizado (minúsculas, sin tildes, guiones)
-- ================================================

ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS slug TEXT;

COMMENT ON COLUMN tournaments.slug IS 'URL pública en /campeonatos/:slug. Derivado del título SEO, único.';

CREATE UNIQUE INDEX IF NOT EXISTS tournaments_slug_unique ON tournaments(slug) WHERE slug IS NOT NULL;

-- Validación: comprobar que la columna existe
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tournaments' AND column_name = 'slug';
