# 🥏 FEDV Ultimate Frisbee Ranking System

Sistema de ranking oficial de la Federación Española de Disco Volador (FEDV) para equipos de Ultimate Frisbee en España.

## 🚀 Características

### ✨ Funcionalidades Principales
- **Sistema de Ranking Automático**: Cálculo automático de puntos basado en resultados de torneos
- **Gestión de Equipos**: CRUD completo con soporte para equipos filiales y nombres específicos por modalidad
- **Gestión de Regiones**: Coeficientes regionales configurables
- **Gestión de Torneos**: Tipos de torneo, superficies y modalidades
- **Panel de Administración**: Interfaz completa para gestión del sistema
- **Sitio Público**: Consulta de rankings y resultados para usuarios públicos

### 🎯 Funcionalidades Avanzadas
- **Equipos Filiales**: Sistema jerárquico de equipos (club principal + equipos filiales)
- **Nombres Específicos**: Soporte para nombres distintos en Open, Women y Mixed
- **Import/Export**: Funcionalidad completa para importar/exportar datos en CSV y Excel
- **Autenticación JWT**: Sistema seguro de autenticación para administradores
- **Responsive Design**: Interfaz adaptada a todos los dispositivos

## 🏗️ Arquitectura

### 📁 Estructura del Proyecto
```
ranking-fedv/
├── frontend/          # Aplicación React (Vite + TypeScript)
├── backend/           # API Node.js (Express + Prisma)
├── shared/            # Tipos y utilidades compartidas
├── docs/             # Documentación del proyecto
└── tests/            # Tests automatizados
```

### 🛠️ Stack Tecnológico

#### Frontend
- **React 18** con TypeScript
- **Vite** como bundler
- **Tailwind CSS** para estilos
- **React Query** para gestión de estado
- **React Router** para navegación
- **Lucide React** para iconos
- **React Hook Form** para formularios

#### Backend
- **Node.js** con Express
- **TypeScript** para tipado
- **Prisma ORM** para base de datos
- **PostgreSQL** con Supabase
- **JWT** para autenticación
- **Jest** para testing

## 🚀 Instalación

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- PostgreSQL (o Supabase)

### 1. Clonar el repositorio
```bash
git clone https://github.com/rubjm9/ranking-fedv.git
cd ranking-fedv
```

### 2. Instalar dependencias
```bash
# Instalar dependencias del frontend
cd frontend
npm install

# Instalar dependencias del backend
cd ../backend
npm install
```

### 3. Configurar variables de entorno

#### Backend (.env)
```env
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/ranking_fedv"

# JWT
JWT_SECRET="tu-secreto-jwt-super-seguro"

# Servidor
PORT=3001
NODE_ENV=development

# Admin inicial del seed (elige tus propios valores, no los subas al repositorio)
ADMIN_EMAIL="tu-email-de-admin@ejemplo.com"
ADMIN_PASSWORD="<contraseña-segura>"

# Frontend URL (para CORS)
FRONTEND_URL="http://localhost:5173"
```

### 4. Configurar base de datos
```bash
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 5. Ejecutar el proyecto
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 📖 Uso

### 🔐 Acceso al Sistema
- **URL Frontend**: http://localhost:5173
- **Acceso**: los usuarios se crean en Supabase Auth; no hay credenciales por defecto en el código.
- **Roles**: `admin` (gestión de usuarios) y `editor` (resto del backoffice). El rol vive en `app_metadata.role` de Supabase Auth.
- **Usuarios**: la sección `/admin/users` solo es visible para admins. Si no hay ningún admin, asígnalo una vez en SQL:

```sql
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
WHERE email = 'tu-email-de-admin@ejemplo.com';
```

Tras el primer admin, el resto de usuarios se gestiona desde el backoffice. Hay que cerrar sesión y volver a entrar para que el JWT recoja el rol nuevo.

### 🎯 Funcionalidades Principales

#### Panel de Administración
- **Dashboard**: Vista general del sistema
- **Equipos**: Gestión completa de equipos y equipos filiales
- **Regiones**: Configuración de regiones y coeficientes
- **Torneos**: Gestión de torneos y resultados
- **Ranking**: Visualización y gestión del ranking
- **Usuarios**: Alta, edición, reset de contraseña y desactivación (solo rol admin)
- **Import/Export**: Funcionalidad de importación y exportación de datos

#### Sitio Público
- **Ranking**: Consulta del ranking actual
- **Equipos**: Información detallada de equipos
- **Regiones**: Estadísticas por región
- **Torneos**: Historial de torneos y resultados

## 🎨 Características de UX/UI

### ✨ Diseño Moderno
- **Interfaz limpia**: Diseño minimalista y profesional
- **Tipografía DM Sans**: Legibilidad optimizada
- **Paleta de colores**: Consistente y accesible
- **Iconografía**: Lucide React para iconos modernos

### 📱 Responsive Design
- **Mobile First**: Optimizado para dispositivos móviles
- **Tablet**: Interfaz adaptada para tablets
- **Desktop**: Experiencia completa en pantallas grandes

### 🎯 Experiencia de Usuario
- **Navegación intuitiva**: Estructura clara y lógica
- **Feedback visual**: Estados de carga y confirmaciones
- **Validación en tiempo real**: Errores y validaciones inmediatas
- **Accesibilidad**: Cumple estándares de accesibilidad web

## 🔧 Desarrollo

### Scripts Disponibles

#### Frontend
```bash
npm run dev          # Desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Linting
```

#### Backend
```bash
npm run dev          # Desarrollo con hot reload
npm run build        # Build de producción
npm run start        # Producción
npm run test         # Tests
npm run lint         # Linting
```

### Estructura de Código
- **TypeScript**: Tipado estricto en todo el proyecto
- **ESLint + Prettier**: Formateo y linting automático
- **Conventional Commits**: Estándar de commits
- **Modular Architecture**: Código organizado y reutilizable

## 📊 Base de Datos

### Esquema Principal
- **Teams**: Equipos con soporte para filiales
- **Regions**: Regiones con coeficientes
- **Tournaments**: Torneos y resultados
- **Positions**: Posiciones en torneos
- **RankingHistory**: Historial de rankings
- **Users**: Usuarios administradores

### Relaciones
- Equipos pueden tener equipos filiales
- Equipos pertenecen a regiones
- Torneos pueden estar asociados a regiones
- Posiciones vinculan equipos y torneos

## 🧪 Testing

### Frontend
- **React Testing Library**: Tests de componentes
- **Jest**: Framework de testing
- **MSW**: Mock Service Worker para APIs

### Backend
- **Jest**: Framework de testing
- **Supertest**: Testing de APIs
- **Prisma**: Testing de base de datos

## 🚀 Despliegue

### Frontend (Vercel)
```bash
npm run build
# Subir dist/ a Vercel
```

### Backend (Railway/Heroku)
```bash
npm run build
# Configurar variables de entorno
# Deploy automático desde GitHub
```

## 🤝 Contribución

### Guías de Contribución
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares de Código
- **TypeScript**: Tipado estricto
- **ESLint**: Reglas de linting
- **Prettier**: Formateo automático
- **Conventional Commits**: Estándar de commits

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Equipo

- **Desarrollo**: Sistema completo de ranking FEDV
- **Diseño**: Interfaz moderna y accesible
- **Arquitectura**: Monorepo escalable

## 📞 Contacto

- **GitHub**: [@rubjm9](https://github.com/rubjm9)
- **Proyecto**: [ranking-fedv](https://github.com/rubjm9/ranking-fedv)

---

**FEDV Ultimate Frisbee Ranking System** - Sistema oficial de ranking de la Federación Española de Disco Volador 🥏
