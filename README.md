# Ranking FEDV - Sistema de Ranking de Ultimate Frisbee

Sistema completo para gestionar y visualizar el ranking de equipos de Ultimate Frisbee en España, desarrollado para la Federación Española de Deportes de Vuelo (FEDV).

## 🏆 Características

- **Ranking Automático**: Cálculo automático del ranking según las reglas FEDV
- **Panel de Administración**: Gestión completa de equipos, torneos y configuraciones
- **Sección Pública**: Visualización del ranking con filtros y gráficas
- **Import/Export**: Carga masiva de resultados y exportación de rankings
- **Gráficas Interactivas**: Evolución histórica y comparativas
- **Diseño Moderno**: UI/UX vanguardista con Tailwind CSS

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+ 
- PostgreSQL (recomendado Supabase)
- npm o yarn

### Configuración

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd ranking-fedv
```

2. **Instalar dependencias**
```bash
npm run install:all
```

3. **Configurar variables de entorno**

Crear archivo `.env` en la raíz del proyecto:
```env
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/ranking_fedv"

# JWT
JWT_SECRET="tu-secreto-jwt-super-seguro"

# Servidor
PORT=3001
NODE_ENV=development

# Admin por defecto
ADMIN_EMAIL="admin@fedv.es"
ADMIN_PASSWORD="admin123"

# Supabase (opcional)
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_ANON_KEY="tu-anon-key"
SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"

# Frontend
VITE_API_URL="http://localhost:3001"
```

4. **Configurar base de datos**
```bash
# Ejecutar migraciones
npm run seed

# O manualmente:
cd backend
npm run db:migrate
npm run seed
```

5. **Iniciar desarrollo**
```bash
npm run dev
```

El frontend estará disponible en `http://localhost:5173` y el backend en `http://localhost:3001`.

## 📊 Estructura del Proyecto

```
ranking-fedv/
├── frontend/          # React + Vite + TypeScript
├── backend/           # Node.js + Express + TypeScript
├── shared/            # Tipos y utilidades compartidas
├── docs/              # Documentación
└── tests/             # Tests end-to-end
```

## 🎯 Funcionalidades Principales

### Panel de Administración (`/admin`)
- **Dashboard**: KPIs y métricas del sistema
- **Gestión de Equipos**: CRUD completo de equipos
- **Gestión de Torneos**: Crear y gestionar torneos
- **Resultados**: Introducir posiciones y resultados
- **Configuración**: Tablas de puntos y ponderadores
- **Import/Export**: Carga masiva y exportación

### Sección Pública (`/`)
- **Ranking Global**: Tabla principal con filtros
- **Ficha de Equipo**: Detalles, histórico y gráficas
- **Ficha de Región**: Coeficientes y resumen
- **Gráficas**: Evolución histórica y comparativas
- **Exportación**: Descarga del ranking en Excel

## 🧮 Algoritmo de Ranking

### Reglas de Cálculo
1. **Puntos por Posición**:
   - 1ª División: 1000, 850, 725, 625, 520, 450...
   - 2ª División: 230, 195, 165, 140, 120, 103...
   - Regionales: 140, 120, 100, 85, 72, 60...

2. **Ponderación Temporal**:
   - Año actual: ×1.0
   - Año -1: ×0.8
   - Año -2: ×0.5
   - Año -3: ×0.2

3. **Coeficiente Regional**:
   - Fórmula: `clamp(suelo + puntos_totales_region * incremento, suelo, techo)`
   - Se aplica solo a puntos regionales

### Proceso de Cálculo
1. Para cada año en los últimos 4 años:
   - Obtener puntos CE (1ª + 2ª división)
   - Obtener puntos regionales × coeficiente regional
   - Sumar CE + regional
   - Multiplicar por ponderador temporal
2. Sumar los 4 años → total acumulado
3. Ordenar por total descendente

## 🛠️ Tecnologías

### Frontend
- **React 18** + **TypeScript**
- **Vite** para build y dev
- **Tailwind CSS** para estilos
- **shadcn/ui** para componentes
- **React Router** para navegación
- **Recharts** para gráficas
- **Lucide React** para iconos

### Backend
- **Node.js** + **Express**
- **TypeScript**
- **PostgreSQL** + **Supabase**
- **Prisma** ORM
- **JWT** para autenticación
- **ExcelJS** para exportación
- **PapaParse** para importación CSV

### Testing
- **Jest** + **Testing Library**
- **Playwright** para e2e (opcional)

## 📝 API Endpoints

### Autenticación
- `POST /api/auth/login` - Login admin

### Equipos
- `GET /api/teams` - Listar equipos
- `POST /api/teams` - Crear equipo
- `PUT /api/teams/:id` - Actualizar equipo
- `GET /api/teams/:id` - Obtener equipo

### Regiones
- `GET /api/regions` - Listar regiones
- `POST /api/regions` - Crear región
- `GET /api/regions/:id` - Obtener región

### Torneos
- `GET /api/tournaments` - Listar torneos
- `POST /api/tournaments` - Crear torneo
- `POST /api/tournaments/:id/positions` - Añadir posiciones

### Ranking
- `GET /api/ranking` - Obtener ranking (con filtros)
- `POST /api/ranking/recalculate` - Recalcular ranking
- `GET /api/export/ranking.xlsx` - Exportar ranking

### Import/Export
- `POST /api/import` - Importar resultados CSV/Excel

## 🚀 Deployment

### Vercel (Recomendado)

1. **Configurar Vercel**
```bash
npm install -g vercel
vercel login
```

2. **Variables de entorno en Vercel**
```env
DATABASE_URL=your-supabase-url
JWT_SECRET=your-jwt-secret
ADMIN_EMAIL=admin@fedv.es
ADMIN_PASSWORD=secure-password
```

3. **Deploy**
```bash
vercel --prod
```

### Supabase

1. Crear proyecto en Supabase
2. Configurar variables de entorno
3. Ejecutar migraciones
4. Deploy frontend en Vercel/Netlify

## 🧪 Testing

```bash
# Tests unitarios
npm test

# Tests frontend
npm run test:frontend

# Tests backend
npm run test:backend

# Tests e2e (opcional)
npm run test:e2e
```

## 📈 Monitoreo y Logs

- **Audit Logs**: Todas las operaciones admin se registran
- **Cálculo History**: Historial de recálculos del ranking
- **Error Tracking**: Logs de errores y excepciones

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o consultas:
- Email: admin@fedv.es
- Documentación: `/docs`
- Issues: GitHub Issues

---

**Desarrollado para la Federación Española de Deportes de Vuelo (FEDV)**
