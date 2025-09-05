# Configuración de Supabase

Este documento explica cómo configurar tu aplicación para usar Supabase como base de datos y servicio de autenticación.

## 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Anota los siguientes datos de tu proyecto:
   - URL del proyecto
   - Clave anónima (anon key)
   - Clave de servicio (service role key)
   - Contraseña de la base de datos

## 2. Configurar variables de entorno

### Backend

1. Copia el archivo `backend/supabase-config.example` como `backend/.env`
2. Reemplaza los valores con los de tu proyecto Supabase:

```env
# Base de datos - Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:[TU-PASSWORD]@db.[TU-PROJECT-REF].supabase.co:5432/postgres"

# Supabase
SUPABASE_URL="https://[TU-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="[TU-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[TU-SERVICE-ROLE-KEY]"
```

### Frontend

1. Copia el archivo `frontend/supabase-config.example` como `frontend/.env.local`
2. Reemplaza los valores:

```env
# Supabase
VITE_SUPABASE_URL="https://[TU-PROJECT-REF].supabase.co"
VITE_SUPABASE_ANON_KEY="[TU-ANON-KEY]"

# API Backend
VITE_API_URL="http://localhost:3001"
```

## 3. Configurar la base de datos

### Generar el cliente de Prisma

```bash
cd backend
npm run db:generate
```

### Ejecutar migraciones

```bash
npm run db:migrate
```

### Migrar datos existentes (si los tienes)

```bash
npm run tsx src/scripts/migrateToSupabase.ts
```

## 4. Configurar autenticación en Supabase

1. Ve a tu proyecto en Supabase
2. Ve a Authentication > Settings
3. Configura las URLs permitidas:
   - Site URL: `http://localhost:5173`
   - Redirect URLs: `http://localhost:5173/**`

## 5. Configurar políticas de seguridad (RLS)

En el SQL Editor de Supabase, ejecuta las siguientes políticas:

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para lectura pública
CREATE POLICY "Allow public read access" ON regions FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON teams FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON positions FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON ranking_history FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON configurations FOR SELECT USING (true);

-- Políticas para administradores
CREATE POLICY "Allow admin full access" ON regions FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');
CREATE POLICY "Allow admin full access" ON teams FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');
CREATE POLICY "Allow admin full access" ON tournaments FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');
CREATE POLICY "Allow admin full access" ON positions FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');
CREATE POLICY "Allow admin full access" ON ranking_history FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');
CREATE POLICY "Allow admin full access" ON configurations FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');
CREATE POLICY "Allow admin full access" ON users FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');
CREATE POLICY "Allow admin full access" ON audit_logs FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');
```

## 6. Actualizar el frontend

Para usar la autenticación de Supabase, actualiza tu `App.tsx`:

```tsx
import { AuthProvider } from '@/contexts/SupabaseAuthContext'

// En lugar de AuthProvider, usa SupabaseAuthContext
```

## 7. Probar la conexión

1. Inicia el backend:
```bash
cd backend
npm run dev
```

2. Inicia el frontend:
```bash
cd frontend
npm run dev
```

3. Ve a `http://localhost:5173` y prueba el login

## 8. Despliegue

Para producción, actualiza las variables de entorno con:
- URLs de producción
- Claves de producción
- Configuración de CORS apropiada

## Solución de problemas

### Error de conexión a la base de datos
- Verifica que la URL de la base de datos sea correcta
- Asegúrate de que la contraseña no tenga caracteres especiales sin escapar

### Error de autenticación
- Verifica que las claves de Supabase sean correctas
- Asegúrate de que las URLs estén configuradas en Supabase

### Error de CORS
- Verifica que `FRONTEND_URL` esté configurado correctamente
- Asegúrate de que las URLs estén en la lista de dominios permitidos en Supabase
