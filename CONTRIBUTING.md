# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir al **FEDV Ultimate Frisbee Ranking System**! 

## 📋 Índice

- [Cómo Contribuir](#cómo-contribuir)
- [Configuración del Entorno](#configuración-del-entorno)
- [Estándares de Código](#estándares-de-código)
- [Proceso de Pull Request](#proceso-de-pull-request)
- [Reportar Bugs](#reportar-bugs)
- [Solicitar Features](#solicitar-features)

## 🚀 Cómo Contribuir

### 1. Fork el Repositorio
1. Ve a [https://github.com/rubjm9/ranking-fedv](https://github.com/rubjm9/ranking-fedv)
2. Haz clic en "Fork" en la esquina superior derecha
3. Clona tu fork localmente:
   ```bash
   git clone https://github.com/TU_USUARIO/ranking-fedv.git
   cd ranking-fedv
   ```

### 2. Configura el Entorno de Desarrollo
```bash
# Instalar dependencias
cd frontend && npm install
cd ../backend && npm install

# Configurar variables de entorno
cp backend/env.example backend/.env
# Editar backend/.env con tus configuraciones

# Configurar base de datos
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 3. Crea una Rama para tu Feature
```bash
git checkout -b feature/nombre-de-tu-feature
```

### 4. Desarrolla tu Feature
- Escribe código limpio y bien documentado
- Sigue los estándares de código establecidos
- Añade tests para nuevas funcionalidades
- Actualiza la documentación si es necesario

### 5. Commit tus Cambios
```bash
git add .
git commit -m "feat: add new feature description"
```

### 6. Push y Crea un Pull Request
```bash
git push origin feature/nombre-de-tu-feature
```

## ⚙️ Configuración del Entorno

### Prerrequisitos
- Node.js 18+
- npm o yarn
- PostgreSQL (o Supabase)
- Git

### Variables de Entorno
Crea un archivo `.env` en el directorio `backend/`:

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

# Frontend URL (para CORS)
FRONTEND_URL="http://localhost:5173"
```

### Scripts de Desarrollo
```bash
# Frontend
cd frontend
npm run dev          # Desarrollo
npm run build        # Build
npm run lint         # Linting
npm run test         # Tests

# Backend
cd backend
npm run dev          # Desarrollo
npm run build        # Build
npm run start        # Producción
npm run test         # Tests
npm run lint         # Linting
```

## 📝 Estándares de Código

### TypeScript
- **Tipado estricto**: Usa tipos explícitos siempre que sea posible
- **Interfaces**: Define interfaces para objetos complejos
- **Enums**: Usa enums para valores constantes
- **Generics**: Aprovecha los generics cuando sea apropiado

### React (Frontend)
- **Functional Components**: Usa componentes funcionales con hooks
- **Props Interface**: Define interfaces para props
- **Custom Hooks**: Extrae lógica reutilizable en hooks
- **Error Boundaries**: Implementa error boundaries para manejo de errores

### Node.js (Backend)
- **Async/Await**: Usa async/await en lugar de callbacks
- **Error Handling**: Maneja errores apropiadamente
- **Validation**: Valida inputs con express-validator
- **Middleware**: Usa middleware para funcionalidad reutilizable

### Estilo de Código
- **ESLint**: Sigue las reglas de ESLint configuradas
- **Prettier**: Usa Prettier para formateo automático
- **Naming**: Usa nombres descriptivos y consistentes
- **Comments**: Comenta código complejo o no obvio

### Commits
Usa [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add new feature
fix: fix bug
docs: update documentation
style: format code
refactor: refactor code
test: add tests
chore: maintenance tasks
```

## 🔄 Proceso de Pull Request

### 1. Antes de Crear el PR
- [ ] Tu código sigue los estándares establecidos
- [ ] Has añadido tests para nuevas funcionalidades
- [ ] Has actualizado la documentación si es necesario
- [ ] Has probado tu código localmente
- [ ] Has resuelto conflictos si los hay

### 2. Crear el Pull Request
1. Ve a tu fork en GitHub
2. Haz clic en "New Pull Request"
3. Selecciona la rama `main` como base
4. Selecciona tu rama de feature
5. Completa la plantilla del PR

### 3. Plantilla del Pull Request
```markdown
## 📝 Descripción
Breve descripción de los cambios realizados.

## 🎯 Tipo de Cambio
- [ ] Bug fix
- [ ] Nueva feature
- [ ] Breaking change
- [ ] Documentación

## 🧪 Tests
- [ ] Tests unitarios añadidos/actualizados
- [ ] Tests de integración añadidos/actualizados
- [ ] Tests manuales realizados

## 📸 Screenshots (si aplica)
Añade screenshots si hay cambios en la UI.

## ✅ Checklist
- [ ] Mi código sigue los estándares de estilo
- [ ] He auto-revisado mi código
- [ ] He comentado mi código donde sea necesario
- [ ] He hecho los cambios correspondientes en la documentación
- [ ] Mis cambios no generan nuevos warnings
- [ ] He añadido tests que prueban que mi fix funciona
- [ ] Los tests nuevos y existentes pasan localmente
```

### 4. Review Process
- Un maintainer revisará tu PR
- Puede solicitar cambios o mejoras
- Una vez aprobado, se mergeará a `main`

## 🐛 Reportar Bugs

### Antes de Reportar
1. Busca en los issues existentes
2. Verifica que el bug no haya sido reportado ya
3. Intenta reproducir el bug en la última versión

### Plantilla de Bug Report
```markdown
## 🐛 Descripción del Bug
Descripción clara y concisa del bug.

## 🔄 Pasos para Reproducir
1. Ve a '...'
2. Haz clic en '...'
3. Desplázate hacia abajo hasta '...'
4. Ve el error

## ✅ Comportamiento Esperado
Descripción de lo que debería pasar.

## 📸 Screenshots
Añade screenshots si aplica.

## 💻 Información del Sistema
- OS: [ej. macOS, Windows, Linux]
- Browser: [ej. Chrome, Safari, Firefox]
- Version: [ej. 22]

## 📝 Información Adicional
Cualquier información adicional sobre el problema.
```

## 💡 Solicitar Features

### Antes de Solicitar
1. Busca en los issues existentes
2. Verifica que la feature no haya sido solicitada ya
3. Piensa en el impacto y la implementación

### Plantilla de Feature Request
```markdown
## 💡 Descripción de la Feature
Descripción clara y concisa de la feature solicitada.

## 🎯 Problema que Resuelve
Descripción del problema que esta feature resolvería.

## 💭 Solución Propuesta
Descripción de cómo crees que debería implementarse.

## 🔄 Alternativas Consideradas
Otras soluciones que hayas considerado.

## 📝 Información Adicional
Cualquier información adicional o contexto.
```

## 🏷️ Etiquetas de Issues

- `bug`: Bugs reportados
- `enhancement`: Mejoras solicitadas
- `feature`: Nuevas features
- `documentation`: Mejoras en documentación
- `good first issue`: Buenas para principiantes
- `help wanted`: Necesita ayuda
- `priority: high`: Alta prioridad
- `priority: low`: Baja prioridad

## 📞 Contacto

Si tienes preguntas sobre cómo contribuir:

- **Issues**: Usa GitHub Issues para bugs y features
- **Discussions**: Usa GitHub Discussions para preguntas generales
- **Email**: admin@fedv.es

## 🙏 Agradecimientos

¡Gracias por contribuir al FEDV Ultimate Frisbee Ranking System! Tu ayuda hace que este proyecto sea mejor para toda la comunidad de Ultimate Frisbee en España.

---

**FEDV Ultimate Frisbee Ranking System** - Contribuyendo al futuro del Ultimate Frisbee en España 🥏
