-- ================================================
-- Migración 019: Estado global del ranking (dirty flag)
-- ================================================

CREATE TABLE IF NOT EXISTS ranking_state (
  id TEXT PRIMARY KEY DEFAULT 'global',
  dirty_since TIMESTAMPTZ,
  last_rebuild_at TIMESTAMPTZ,
  reason TEXT,
  affects_coefficients BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO ranking_state (id)
VALUES ('global')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE ranking_state IS
  'Estado singleton del pipeline de ranking. dirty_since indica cambios en torneos/resultados no reflejados en ranking.';

ALTER TABLE ranking_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura ranking_state autenticados"
  ON ranking_state FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir escritura ranking_state autenticados"
  ON ranking_state FOR ALL
  USING (auth.role() = 'authenticated');
