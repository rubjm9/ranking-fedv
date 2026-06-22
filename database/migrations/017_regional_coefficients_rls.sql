-- ================================================
-- Migración 017: RLS para regional_coefficients
-- Alineado con team_season_points / team_season_rankings:
-- lectura pública, escritura solo usuarios autenticados (admin).
-- ================================================

ALTER TABLE regional_coefficients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura pública de coeficientes regionales" ON regional_coefficients;
CREATE POLICY "Permitir lectura pública de coeficientes regionales"
  ON regional_coefficients
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir escritura a usuarios autenticados" ON regional_coefficients;
CREATE POLICY "Permitir escritura a usuarios autenticados"
  ON regional_coefficients
  FOR ALL
  USING (auth.role() = 'authenticated');
