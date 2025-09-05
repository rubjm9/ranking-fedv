-- Políticas de seguridad para Supabase (RLS)
-- Copia y pega este código en el SQL Editor de Supabase

-- Habilitar RLS en todas las tablas
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para lectura pública (datos que pueden ser consultados por cualquier usuario)
CREATE POLICY "Allow public read access to regions" ON regions FOR SELECT USING (true);
CREATE POLICY "Allow public read access to teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Allow public read access to tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Allow public read access to positions" ON positions FOR SELECT USING (true);
CREATE POLICY "Allow public read access to ranking_history" ON ranking_history FOR SELECT USING (true);
CREATE POLICY "Allow public read access to configurations" ON configurations FOR SELECT USING (true);

-- Políticas para administradores (acceso completo)
CREATE POLICY "Allow admin full access to regions" ON regions FOR ALL USING (
  auth.jwt() ->> 'role' = 'ADMIN' OR 
  auth.jwt() ->> 'email' = 'admin@fedv.es'
);

CREATE POLICY "Allow admin full access to teams" ON teams FOR ALL USING (
  auth.jwt() ->> 'role' = 'ADMIN' OR 
  auth.jwt() ->> 'email' = 'admin@fedv.es'
);

CREATE POLICY "Allow admin full access to tournaments" ON tournaments FOR ALL USING (
  auth.jwt() ->> 'role' = 'ADMIN' OR 
  auth.jwt() ->> 'email' = 'admin@fedv.es'
);

CREATE POLICY "Allow admin full access to positions" ON positions FOR ALL USING (
  auth.jwt() ->> 'role' = 'ADMIN' OR 
  auth.jwt() ->> 'email' = 'admin@fedv.es'
);

CREATE POLICY "Allow admin full access to ranking_history" ON ranking_history FOR ALL USING (
  auth.jwt() ->> 'role' = 'ADMIN' OR 
  auth.jwt() ->> 'email' = 'admin@fedv.es'
);

CREATE POLICY "Allow admin full access to configurations" ON configurations FOR ALL USING (
  auth.jwt() ->> 'role' = 'ADMIN' OR 
  auth.jwt() ->> 'email' = 'admin@fedv.es'
);

CREATE POLICY "Allow admin full access to users" ON users FOR ALL USING (
  auth.jwt() ->> 'role' = 'ADMIN' OR 
  auth.jwt() ->> 'email' = 'admin@fedv.es'
);

CREATE POLICY "Allow admin full access to audit_logs" ON audit_logs FOR ALL USING (
  auth.jwt() ->> 'role' = 'ADMIN' OR 
  auth.jwt() ->> 'email' = 'admin@fedv.es'
);

-- Políticas para usuarios autenticados (solo lectura de sus propios datos)
CREATE POLICY "Allow users to read own data" ON users FOR SELECT USING (
  auth.uid()::text = id
);

-- Función para verificar si un usuario es administrador
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    auth.jwt() ->> 'role' = 'ADMIN' OR 
    auth.jwt() ->> 'email' = 'admin@fedv.es'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener el ID del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS text AS $$
BEGIN
  RETURN auth.uid()::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener el email del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_email()
RETURNS text AS $$
BEGIN
  RETURN auth.jwt() ->> 'email';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_teams_region_id ON teams("regionId");
CREATE INDEX IF NOT EXISTS idx_tournaments_region_id ON tournaments("regionId");
CREATE INDEX IF NOT EXISTS idx_positions_team_id ON positions("teamId");
CREATE INDEX IF NOT EXISTS idx_positions_tournament_id ON positions("tournamentId");
CREATE INDEX IF NOT EXISTS idx_ranking_history_team_id ON ranking_history("teamId");
CREATE INDEX IF NOT EXISTS idx_ranking_history_year ON ranking_history(year);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs("userId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs("createdAt");

-- Comentarios en las tablas
COMMENT ON TABLE regions IS 'Regiones deportivas con sus coeficientes de ranking';
COMMENT ON TABLE teams IS 'Equipos deportivos asociados a regiones';
COMMENT ON TABLE tournaments IS 'Torneos deportivos';
COMMENT ON TABLE positions IS 'Posiciones de equipos en torneos';
COMMENT ON TABLE ranking_history IS 'Historial de rankings por año';
COMMENT ON TABLE configurations IS 'Configuraciones del sistema';
COMMENT ON TABLE users IS 'Usuarios del sistema';
COMMENT ON TABLE audit_logs IS 'Registro de auditoría de acciones';
