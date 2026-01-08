-- ================================================
-- Migración 007C: Triggers y políticas para team_season_rankings
-- ================================================

-- Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_team_season_rankings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar timestamp
DROP TRIGGER IF EXISTS trigger_update_team_season_rankings_timestamp 
  ON team_season_rankings;

CREATE TRIGGER trigger_update_team_season_rankings_timestamp
  BEFORE UPDATE ON team_season_rankings
  FOR EACH ROW
  EXECUTE FUNCTION update_team_season_rankings_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE team_season_rankings IS 
  'Rankings históricos por superficie con coeficientes de antigüedad aplicados. 
   Permite consultar el ranking de cualquier equipo en cualquier temporada y superficie.';

COMMENT ON COLUMN team_season_rankings.beach_mixed_rank IS 
  'Posición en el ranking de playa mixto (incluye últimas 4 temporadas con coeficientes)';

COMMENT ON COLUMN team_season_rankings.beach_mixed_points IS 
  'Puntos totales de playa mixto con coeficientes aplicados (1.0, 0.8, 0.5, 0.2)';

COMMENT ON COLUMN team_season_rankings.beach_open_rank IS 
  'Posición en el ranking de playa open (incluye últimas 4 temporadas con coeficientes)';

COMMENT ON COLUMN team_season_rankings.beach_open_points IS 
  'Puntos totales de playa open con coeficientes aplicados (1.0, 0.8, 0.5, 0.2)';

COMMENT ON COLUMN team_season_rankings.beach_women_rank IS 
  'Posición en el ranking de playa women (incluye últimas 4 temporadas con coeficientes)';

COMMENT ON COLUMN team_season_rankings.beach_women_points IS 
  'Puntos totales de playa women con coeficientes aplicados (1.0, 0.8, 0.5, 0.2)';

COMMENT ON COLUMN team_season_rankings.grass_mixed_rank IS 
  'Posición en el ranking de césped mixto (incluye últimas 4 temporadas con coeficientes)';

COMMENT ON COLUMN team_season_rankings.grass_mixed_points IS 
  'Puntos totales de césped mixto con coeficientes aplicados (1.0, 0.8, 0.5, 0.2)';

COMMENT ON COLUMN team_season_rankings.grass_open_rank IS 
  'Posición en el ranking de césped open (incluye últimas 4 temporadas con coeficientes)';

COMMENT ON COLUMN team_season_rankings.grass_open_points IS 
  'Puntos totales de césped open con coeficientes aplicados (1.0, 0.8, 0.5, 0.2)';

COMMENT ON COLUMN team_season_rankings.grass_women_rank IS 
  'Posición en el ranking de césped women (incluye últimas 4 temporadas con coeficientes)';

COMMENT ON COLUMN team_season_rankings.grass_women_points IS 
  'Puntos totales de césped women con coeficientes aplicados (1.0, 0.8, 0.5, 0.2)';

COMMENT ON COLUMN team_season_rankings.calculated_at IS 
  'Timestamp de cuando se calcularon los rankings para esta temporada';

-- Política de seguridad (Row Level Security)
ALTER TABLE team_season_rankings ENABLE ROW LEVEL SECURITY;

-- Política de lectura: todos pueden leer
CREATE POLICY "Permitir lectura pública de rankings por temporada"
  ON team_season_rankings
  FOR SELECT
  USING (true);

-- Política de escritura: solo usuarios autenticados
CREATE POLICY "Permitir escritura a usuarios autenticados"
  ON team_season_rankings
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Verificar configuración completa
SELECT 
  'Configuración completa exitosa' as status,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'team_season_rankings';
