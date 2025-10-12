# Guía de implementación: Sistema híbrido de ranking

## 📋 Resumen

Se ha implementado un **sistema híbrido** que combina:
- **Datos brutos** (`positions`): Fuente única de verdad
- **Cache materializada** (`team_season_points`): Optimización de consultas

## 🎯 Beneficios

✅ **Rendimiento**: Consultas instantáneas  
✅ **Flexibilidad**: Regenerar desde datos brutos  
✅ **Históricos**: Acceso rápido a temporadas pasadas  
✅ **Gráficas**: Datos listos para visualización  
✅ **Auditoría**: Trazabilidad completa  

## 📦 Archivos creados

1. **`database/migrations/002_create_team_season_points.sql`**  
   SQL para crear la tabla y sus índices

2. **`src/services/seasonPointsService.ts`**  
   Gestión de la tabla team_season_points

3. **`src/services/hybridRankingService.ts`**  
   Sistema híbrido de ranking optimizado

4. **`src/pages/admin/SeasonManagementPage.tsx`**  
   Interfaz de administración

5. **`database/README.md`**  
   Documentación completa

6. **Este archivo**: Guía paso a paso

## 🚀 Pasos de implementación

### Paso 1: Ejecutar migración SQL en Supabase

1. Abre tu **Supabase Dashboard**
2. Ve a **SQL Editor** (icono `</>`  en la barra lateral)
3. Crea un nuevo query
4. Copia todo el contenido de `database/migrations/002_create_team_season_points.sql`
5. Pégalo en el editor
6. Haz clic en **RUN**

**✅ Verificar:** Deberías ver "Success. No rows returned"

### Paso 2: Verificar que la tabla se creó

En el mismo SQL Editor, ejecuta:

```sql
-- Ver estructura de la tabla
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'team_season_points';

-- Ver índices creados
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'team_season_points';

-- Verificar que está vacía
SELECT COUNT(*) FROM team_season_points;
```

**✅ Verificar:** Deberías ver las columnas e índices, con COUNT = 0

### Paso 3: Añadir ruta de administración

Abre `src/App.tsx` y añade la nueva ruta dentro de las rutas de admin:

```typescript
import SeasonManagementPage from './pages/admin/SeasonManagementPage'

// ... dentro de <Routes>
<Route path="admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
  {/* ... otras rutas admin ... */}
  <Route path="seasons" element={<SeasonManagementPage />} />
</Route>
```

### Paso 4: Poblar con datos históricos

1. Inicia tu aplicación: `npm run dev`
2. Ve a **`http://localhost:5173/admin/seasons`**
3. Haz clic en **"Regenerar todas las temporadas"**
4. Espera a que termine (verás un toast de éxito)

**✅ Verificar:** En Supabase, ejecuta:

```sql
SELECT season, COUNT(*) as equipos
FROM team_season_points
GROUP BY season
ORDER BY season DESC;
```

Deberías ver todas tus temporadas con sus equipos.

### Paso 5: Sincronizar rankings actuales

En la misma página `/admin/seasons`:

1. Haz clic en **"Sincronizar rankings actuales"**
2. Esto actualizará `current_rankings` desde `team_season_points`

**✅ Verificar:** Tu ranking público debería seguir mostrando los mismos datos

### Paso 6: (Opcional) Integrar con el sistema automático

Para que `team_season_points` se actualice automáticamente cuando cambien datos:

Edita `src/services/autoRankingService.ts`:

```typescript
import hybridRankingService from './hybridRankingService'

const autoRankingService = {
  onPositionsUpdated: async (category: string, tournamentYear: number) => {
    try {
      // Actualizar team_season_points
      await hybridRankingService.updateSeasonPointsForCategory(
        category as any,
        tournamentYear
      )
      
      // Sincronizar con current_rankings
      const referenceSeason = `${tournamentYear}-${(tournamentYear + 1).toString().slice(-2)}`
      await hybridRankingService.syncWithCurrentRankings(
        category as any,
        referenceSeason
      )
      
      toast.success('Ranking actualizado automáticamente')
    } catch (error: any) {
      console.error('Error en actualización automática:', error)
      toast.error('Error al actualizar ranking')
    }
  }
}
```

## 🔧 Uso del sistema

### Desde la UI (recomendado)

**Página:** `/admin/seasons`

- **Regenerar todas:** Recalcula todas las temporadas desde cero
- **Regenerar temporada:** Recalcula una temporada específica
- **Cerrar temporada:** Marca una temporada como completa
- **Sincronizar rankings:** Actualiza `current_rankings` desde `team_season_points`
- **Estadísticas:** Ver métricas de una temporada

### Desde código

```typescript
import seasonPointsService from './services/seasonPointsService'
import hybridRankingService from './services/hybridRankingService'

// Regenerar todas las temporadas
await seasonPointsService.regenerateAllSeasons()

// Obtener ranking actual (muy rápido)
const ranking = await hybridRankingService.getRankingFromSeasonPoints(
  'beach_mixed',
  '2024-25'
)

// Obtener ranking histórico
const historical = await hybridRankingService.getHistoricalRanking(
  '2023-24',
  'beach_mixed'
)

// Comparar temporadas
const comparison = await hybridRankingService.compareSeasons(
  '2024-25',
  '2023-24',
  'beach_mixed'
)
```

### Desde SQL (análisis directo)

```sql
-- Ranking de una temporada
SELECT 
  t.name,
  tsp.beach_mixed_points,
  tsp.beach_open_points
FROM team_season_points tsp
JOIN teams t ON t.id = tsp.team_id
WHERE tsp.season = '2024-25'
ORDER BY tsp.beach_mixed_points DESC;

-- Evolución de un equipo
SELECT 
  season,
  beach_mixed_points,
  beach_open_points
FROM team_season_points
WHERE team_id = 'uuid-del-equipo'
ORDER BY season DESC;

-- Equipos más activos
SELECT 
  t.name,
  tsp.tournaments_played->>'beach_mixed' as torneos_mixto,
  tsp.beach_mixed_points
FROM team_season_points tsp
JOIN teams t ON t.id = tsp.team_id
WHERE tsp.season = '2024-25'
AND tsp.beach_mixed_points > 0
ORDER BY tsp.beach_mixed_points DESC;
```

## 🐛 Solución de problemas

### Error: "relation team_season_points does not exist"

**Causa:** La migración SQL no se ejecutó correctamente  
**Solución:** Vuelve al Paso 1 y ejecuta la migración

### Los datos no se actualizan

**Causa:** No se ha regenerado o sincronizado  
**Solución:**
1. Ve a `/admin/seasons`
2. Haz clic en "Regenerar todas las temporadas"
3. Luego en "Sincronizar rankings actuales"

### Datos inconsistentes entre tablas

**Causa:** Cambios manuales en `positions` sin actualizar cache  
**Solución:**
```typescript
// Regenerar temporada específica
await seasonPointsService.calculateAndSaveSeasonPoints('2024-25')

// Sincronizar ranking
await hybridRankingService.syncWithCurrentRankings('beach_mixed', '2024-25')
```

### Rendimiento lento en consultas

**Causa:** Falta reindexar  
**Solución:** En Supabase SQL Editor:
```sql
REINDEX TABLE team_season_points;
```

## 📊 Próximas funcionalidades

Con este sistema ya implementado, ahora puedes desarrollar fácilmente:

1. **Rankings históricos** - Página `/ranking/historical`
2. **Gráficas de evolución** - Ver cómo cambian los puntos de un equipo
3. **Comparativas** - Comparar equipos entre temporadas
4. **Estadísticas** - Análisis de tendencias
5. **Exportación** - CSV/Excel de cualquier temporada
6. **Predicciones** - Basadas en datos históricos

## 📝 Notas importantes

- ✅ **Los datos brutos siguen siendo la fuente de verdad**
- ✅ `team_season_points` es solo una cache optimizada
- ✅ Puedes regenerar desde cero cuando quieras
- ✅ Los coeficientes de antigüedad se aplican al leer, no al guardar
- ✅ La tabla guarda puntos BASE (sin coeficientes)

## 🆘 ¿Necesitas ayuda?

Si tienes dudas:
1. Revisa `database/README.md` - Documentación detallada
2. Consulta los servicios:
   - `seasonPointsService.ts` - Gestión de temporadas
   - `hybridRankingService.ts` - Rankings optimizados
3. Usa la consola del navegador para ver logs
4. Revisa la tabla directamente en Supabase

## ✅ Checklist de implementación

- [ ] Paso 1: Ejecutar migración SQL
- [ ] Paso 2: Verificar tabla creada
- [ ] Paso 3: Añadir ruta en App.tsx
- [ ] Paso 4: Regenerar temporadas históricas
- [ ] Paso 5: Sincronizar rankings
- [ ] Paso 6: (Opcional) Integrar con autoRankingService
- [ ] Probar consultas en `/admin/seasons`
- [ ] Verificar que rankings públicos funcionan
- [ ] Probar regeneración de temporada específica

---

**¡Listo!** Ya tienes un sistema híbrido de ranking optimizado y escalable 🚀

