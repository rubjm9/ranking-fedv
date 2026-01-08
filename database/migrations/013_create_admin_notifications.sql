-- ================================================
-- Migración 013: Crear tabla de notificaciones de administración
-- Sistema semiautomático para detectar subtemporadas/temporadas completadas
-- ================================================

-- 1. Crear tabla admin_notifications
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Tipo de notificación
  type VARCHAR(50) NOT NULL, -- 'subseason_complete', 'season_complete', 'data_inconsistency', etc.
  
  -- Información del evento
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Datos relacionados (JSON para flexibilidad)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Estado de la notificación
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'read', 'dismissed', 'resolved'
  
  -- Para qué temporada/subtemporada es relevante
  season VARCHAR(10),
  subseason INTEGER, -- 1-4 para subtemporadas
  category VARCHAR(50), -- beach_mixed, beach_open, etc. o 'global'
  
  -- Enlaces de acción
  action_url VARCHAR(255), -- URL del panel donde consolidar/cerrar
  action_label VARCHAR(100), -- Texto del botón de acción
  
  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID, -- ID del usuario que resolvió
  
  -- Para evitar notificaciones duplicadas
  fingerprint VARCHAR(255) UNIQUE -- Hash único para evitar duplicados
);

-- 2. Crear índices
CREATE INDEX IF NOT EXISTS idx_admin_notifications_status 
  ON admin_notifications(status);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_type 
  ON admin_notifications(type);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_created 
  ON admin_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_season 
  ON admin_notifications(season, subseason);

-- 3. Comentarios para documentación
COMMENT ON TABLE admin_notifications IS 
  'Notificaciones para el panel de administración. Sistema semiautomático para alertar sobre subtemporadas/temporadas completadas y otros eventos importantes.';

COMMENT ON COLUMN admin_notifications.type IS 
  'Tipo de notificación: subseason_complete, season_complete, data_inconsistency, ranking_update_required, etc.';

COMMENT ON COLUMN admin_notifications.fingerprint IS 
  'Hash único para evitar notificaciones duplicadas. Formato: {type}_{season}_{subseason}_{category}';

COMMENT ON COLUMN admin_notifications.metadata IS 
  'Datos adicionales en JSON: tournaments_count, teams_affected, detection_reason, etc.';

-- 4. Política de seguridad (Row Level Security)
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Política de lectura: usuarios autenticados pueden leer
CREATE POLICY "Permitir lectura a usuarios autenticados"
  ON admin_notifications
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política de escritura: solo usuarios autenticados
CREATE POLICY "Permitir escritura a usuarios autenticados"
  ON admin_notifications
  FOR ALL
  USING (auth.role() = 'authenticated');

-- 5. Función para crear notificación evitando duplicados
CREATE OR REPLACE FUNCTION create_admin_notification(
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT,
  p_season VARCHAR(10) DEFAULT NULL,
  p_subseason INTEGER DEFAULT NULL,
  p_category VARCHAR(50) DEFAULT NULL,
  p_action_url VARCHAR(255) DEFAULT NULL,
  p_action_label VARCHAR(100) DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_fingerprint VARCHAR(255);
  v_notification_id UUID;
BEGIN
  -- Generar fingerprint único
  v_fingerprint := p_type || '_' || COALESCE(p_season, 'null') || '_' || 
                   COALESCE(p_subseason::TEXT, 'null') || '_' || 
                   COALESCE(p_category, 'null');
  
  -- Insertar solo si no existe ya una notificación pendiente con el mismo fingerprint
  INSERT INTO admin_notifications (
    type, title, message, season, subseason, category, 
    action_url, action_label, metadata, fingerprint
  )
  VALUES (
    p_type, p_title, p_message, p_season, p_subseason, p_category,
    p_action_url, p_action_label, p_metadata, v_fingerprint
  )
  ON CONFLICT (fingerprint) DO NOTHING
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Verificar creación
SELECT 
  'Tabla admin_notifications creada exitosamente' as status,
  COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'admin_notifications';



