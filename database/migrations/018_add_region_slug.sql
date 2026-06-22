-- ================================================
-- Migración 018: Añadir slug a regiones para URLs públicas
-- Formato: nombre normalizado (minúsculas, sin tildes, guiones)
-- Ejemplo: "Andalucía" -> "andalucia"
-- ================================================

ALTER TABLE regions ADD COLUMN IF NOT EXISTS slug TEXT;

COMMENT ON COLUMN regions.slug IS 'URL pública de la región en /regiones/:slug. Derivado del nombre, único.';

CREATE UNIQUE INDEX IF NOT EXISTS regions_slug_unique ON regions(slug) WHERE slug IS NOT NULL;

-- Validación: comprobar que la columna existe
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'regions' AND column_name = 'slug';
