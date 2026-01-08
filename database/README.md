# Migraciones de Base de Datos

Este directorio contiene las migraciones SQL para el sistema de ranking.

## Sistema híbrido de ranking

El sistema utiliza un enfoque híbrido que combina:
- **Datos brutos** (`positions`, `tournaments`, `teams`): Fuente única de verdad
- **Cache materializada** (`team_season_points`): Optimización para consultas rápidas

### Ventajas del sistema híbrido:

✅ **Rendimiento**: Consultas instantáneas desde `team_season_points`
✅ **Flexibilidad**: Regenerar desde datos brutos si cambian fórmulas
✅ **Históricos**: Acceso rápido a temporadas pasadas
✅ **Auditoría**: Trazabilidad completa desde `positions`
✅ **Gráficas**: Datos listos para visualización

## Instrucciones de instalación

### 1. Ejecutar migración de team_season_points

1. Abre Supabase Dashboard
2. Ve a **SQL Editor**
3. Copia y pega el contenido de `migrations/002_create_team_season_points.sql`
4. Ejecuta la query

### 2. Verificar la creación

```sql
-- Verificar que la tabla existe
SELECT * FROM team_season_points LIMIT 5;

-- Verificar índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'team_season_points';
```

### 3. Poblar con datos históricos

Desde la aplicación web, ejecuta:

```typescript
import seasonPointsService from './services/seasonPointsService'

// Regenerar todas las temporadas desde datos brutos
await seasonPointsService.regenerateAllSeasons()
```

O usa la consola del navegador:

```javascript
// Desde la consola del navegador en /admin
const response = await fetch('/api/regenerate-seasons', { method: 'POST' })
const result = await response.json()
console.log(result)
```

## Estructura de la tabla

### team_season_points

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único |
| `team_id` | UUID | Referencia al equipo |
| `season` | VARCHAR(10) | Temporada (ej: "2024-25") |
| `beach_mixed_points` | DECIMAL(10,2) | Puntos base en playa mixto |
| `beach_open_points` | DECIMAL(10,2) | Puntos base en playa open |
| `beach_women_points` | DECIMAL(10,2) | Puntos base en playa women |
| `grass_mixed_points` | DECIMAL(10,2) | Puntos base en césped mixto |
| `grass_open_points` | DECIMAL(10,2) | Puntos base en césped open |
| `grass_women_points` | DECIMAL(10,2) | Puntos base en césped women |
| `last_updated` | TIMESTAMP | Última actualización |
| `is_complete` | BOOLEAN | ¿Temporada cerrada? |
| `completion_date` | TIMESTAMP | Fecha de cierre |
| `tournaments_played` | JSONB | Torneos jugados por superficie |
| `best_position` | JSONB | Mejor posición por superficie |

## Flujo de trabajo

### Actualización automática

Cuando se añaden/modifican resultados:

1. **Usuario guarda posiciones** → `apiService.updatePositions()`
2. **Trigger automático** → `autoRankingService.onPositionsUpdated()`
3. **Actualiza cache** → `hybridRankingService.updateSeasonPointsForCategory()`
4. **Sincroniza ranking** → `hybridRankingService.syncWithCurrentRankings()`

### Consultas optimizadas

```typescript
// Ranking actual (usa team_season_points)
const ranking = await hybridRankingService.getRankingFromSeasonPoints(
  'beach_mixed',
  '2024-25'
)

// Ranking histórico (usa team_season_points)
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

## Mantenimiento

### Regenerar desde datos brutos

Si detectas inconsistencias o cambias fórmulas:

```typescript
// Regenerar todas las temporadas
await seasonPointsService.regenerateAllSeasons()

// Regenerar una temporada específica
await seasonPointsService.calculateAndSaveSeasonPoints('2024-25')

// Regenerar para un equipo específico
await seasonPointsService.calculateAndSaveSeasonPoints('2024-25', 'team-uuid')
```

### Cerrar temporada

Cuando una temporada termina oficialmente:

```typescript
await seasonPointsService.closeSeason('2024-25')
```

Esto marca `is_complete = true` y registra la fecha de cierre.

## Troubleshooting

### La tabla no se creó correctamente

```sql
-- Eliminar y recrear
DROP TABLE IF EXISTS team_season_points CASCADE;
-- Luego ejecutar de nuevo la migración
```

### Datos inconsistentes

```typescript
// Verificar integridad
const stats = await seasonPointsService.getSeasonStats('2024-25')
console.log(stats)

// Regenerar desde cero
await seasonPointsService.regenerateAllSeasons()
```

### Rendimiento lento

```sql
-- Verificar índices
EXPLAIN ANALYZE 
SELECT * FROM team_season_points 
WHERE season = '2024-25' 
ORDER BY beach_mixed_points DESC;

-- Reindexar si es necesario
REINDEX TABLE team_season_points;
```

## Próximos pasos

1. ✅ Crear tabla `team_season_points`
2. ✅ Implementar `seasonPointsService`
3. ✅ Implementar `hybridRankingService`
4. ⏳ Integrar con `autoRankingService`
5. ⏳ Actualizar UI para usar nuevo sistema
6. ⏳ Crear página de rankings históricos
7. ⏳ Implementar comparativas visuales
8. ⏳ Añadir gráficas de evolución

## Contacto

Si tienes dudas sobre la implementación, revisa:
- `src/services/seasonPointsService.ts` - Gestión de temporadas
- `src/services/hybridRankingService.ts` - Sistema híbrido
- `src/services/autoRankingService.ts` - Actualización automática

