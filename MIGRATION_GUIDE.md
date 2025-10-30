# Guía de Migración al Nuevo Sistema de Rankings

## 📋 Resumen

Esta guía describe cómo completar la migración del sistema de rankings antiguo (`current_rankings`) al nuevo sistema optimizado (`team_season_rankings`).

---

## ✅ Progreso Actual

### Completado (Fases 1-3)

- ✅ **Migraciones de Base de Datos** (007, 008, 009, 010)
- ✅ **Servicio teamSeasonRankingsService.ts** 
- ✅ **Script de Migración migrateToNewRankingSystem.ts**
- ✅ **Actualización de Servicios** (seasonPointsService, hybridRankingService, dynamicRankingService)
- ✅ **Página de Administración** (MigrateRankingsPage)
- ✅ **Commits realizados** (4 commits en feature/team-detail-ui-improvements)

### Pendiente (Fase 4-6)

- ⏳ **Ejecutar Migración 007 en Supabase**
- ⏳ **Ejecutar Script de Migración de Datos**
- ⏳ **Validación y Testing**
- ⏳ **Ejecutar Migraciones de Limpieza**
- ⏳ **Limpieza de Código Legacy**

---

## 🚀 Pasos para Completar la Implementación

### Fase 4: Ejecutar Migraciones en Supabase

#### Paso 1: Ejecutar Migración 007

1. Ir a Supabase Dashboard → SQL Editor
2. Abrir el archivo `database/migrations/007_create_team_season_rankings.sql`
3. Copiar y pegar el contenido completo
4. Ejecutar la consulta
5. Verificar que la tabla se creó correctamente:

```sql
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'team_season_rankings'
ORDER BY ordinal_position;
```

**Resultado esperado:** 18 columnas (id, team_id, season, 6x rank, 6x points, timestamps)

#### Paso 2: Verificar Índices

```sql
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'team_season_rankings';
```

**Resultado esperado:** 9 índices creados

---

### Fase 5: Migración de Datos

#### Opción A: Desde el Dashboard (Recomendado)

1. Acceder al admin: `http://localhost:5173/admin`
2. Ir a: **"Migrar Sistema Rankings"**
3. Leer todas las advertencias e instrucciones
4. Clic en **"Ejecutar Migración"**
5. Esperar a que termine (puede tardar varios minutos)
6. Revisar el reporte de migración

**Monitoreo:**
- Abrir consola del navegador (F12)
- Ver logs detallados del progreso
- Verificar que no haya errores

#### Opción B: Desde la Terminal

```bash
cd /Users/zhinelia.watson/Desktop/dev/ranking-fedv

# Ejecutar script de migración
npm run dev

# En otra terminal:
node -r ts-node/register src/scripts/migrateToNewRankingSystem.ts
```

#### Validación Post-Migración

```sql
-- Verificar registros creados
SELECT COUNT(*) as total_registros 
FROM team_season_rankings;

-- Verificar temporadas migradas
SELECT 
  season, 
  COUNT(*) as equipos 
FROM team_season_rankings 
GROUP BY season 
ORDER BY season DESC;

-- Comparar con current_rankings
SELECT 
  (SELECT COUNT(*) FROM team_season_rankings) as new_system,
  (SELECT COUNT(*) FROM current_rankings) as old_system;
```

---

### Fase 6: Validación y Testing

#### 1. Verificar Rankings en la Web

**Páginas a probar:**
- `/ranking/` - Ranking híbrido
- `/ranking-new/` - Ranking nuevo
- `/teams/[id]` - Detalle de equipo (gráfica de evolución)

**Qué verificar:**
- Los rankings se muestran correctamente
- Las gráficas tienen datos
- No hay errores en consola
- Los puntos y posiciones coinciden

#### 2. Comparar con Sistema Anterior

```sql
-- Comparar rankings de temporada actual
SELECT 
  t.name as equipo,
  cr.total_points as puntos_antiguos,
  tsr.beach_mixed_points + tsr.beach_open_points + 
  tsr.beach_women_points + tsr.grass_mixed_points + 
  tsr.grass_open_points + tsr.grass_women_points as puntos_nuevos
FROM current_rankings cr
JOIN team_season_rankings tsr ON cr.team_id = tsr.team_id
JOIN teams t ON t.id = cr.team_id
WHERE cr.ranking_category = 'beach_mixed'
  AND tsr.season = '2024-25'
ORDER BY puntos_antiguos DESC
LIMIT 10;
```

#### 3. Testing Manual

**Checklist:**
- [ ] Rankings por modalidad individual funcionan
- [ ] Gráficas de evolución muestran datos históricos
- [ ] No hay errores 404 o 500
- [ ] Rendimiento es similar o mejor
- [ ] Rankings combinados se calculan correctamente

---

### Fase 7: Limpieza (Después de 1 Semana de Validación)

#### Paso 1: Ejecutar Migración 008

```sql
-- Limpiar team_season_points
-- Abrir: database/migrations/008_cleanup_team_season_points.sql
-- Ejecutar en Supabase SQL Editor
```

#### Paso 2: Ejecutar Migración 009

```sql
-- Preparar coeficientes regionales
-- Abrir: database/migrations/009_prepare_regional_coefficients.sql
-- Ejecutar en Supabase SQL Editor
```

#### Paso 3: Ejecutar Migración 010 (⚠️ DESPUÉS DE VALIDACIÓN)

**⚠️ SOLO ejecutar después de:**
- ✅ 1 semana sin errores en producción
- ✅ Validación completa
- ✅ Backup de current_rankings realizado
- ✅ Confirmación del equipo

```sql
-- Eliminar current_rankings
-- Abrir: database/migrations/010_drop_current_rankings.sql
-- Ejecutar en Supabase SQL Editor
```

#### Paso 4: Limpiar Código Deprecated

Archivos a actualizar:
- `src/services/seasonPointsService.ts` - Eliminar funciones deprecated
- `src/services/hybridRankingService.ts` - Eliminar syncWithCurrentRankings
- `src/services/rankingService.ts` - Eliminar funciones que usan current_rankings

---

## 📊 Ventajas del Nuevo Sistema

### Mejoras Implementadas

1. **Rankings Históricos Completos**
   - Consultar cualquier ranking de cualquier temporada
   - Datos persistidos en base de datos
   - No requiere recálculo constante

2. **Por Modalidad Individual**
   - 6 rankings separados: beach_mixed, beach_open, beach_women, grass_mixed, grass_open, grass_women
   - No mezcla open+women en un solo ranking
   - Más precisión y claridad

3. **Mejor Rendimiento**
   - Rankings pre-calculados
   - Menos consultas a la base de datos
   - Cache estructurada

4. **Preparado para el Futuro**
   - Sistema listo para coeficientes regionales
   - Columna `has_regional_coefficient` en positions
   - No requiere cambios mayores al implementar

5. **Simplificación**
   - Elimina duplicación de current_rankings
   - Código más limpio y mantenible
   - Menos complejidad

---

## 🔧 Mantenimiento

### Actualización de Rankings

**Automático:**
Los rankings se actualizan automáticamente cuando:
- Se completa un torneo de 1ª división
- Se actualiza team_season_points
- Se ejecuta el trigger recalculateRankingsForSeason()

**Manual:**
Desde el dashboard admin:
1. Ir a "Actualizar Rankings"
2. Seleccionar temporada
3. Clic en "Recalcular"

### Recalcular Todas las Temporadas

```typescript
// Desde la consola del navegador en /admin
import teamSeasonRankingsService from '@/services/teamSeasonRankingsService'

const result = await teamSeasonRankingsService.recalculateAllSeasons()
console.log(result)
```

---

## ⚠️ Solución de Problemas

### Problema: "team_season_rankings does not exist"

**Solución:** Ejecutar migración 007 en Supabase

### Problema: "No hay datos históricos"

**Solución:** 
1. Verificar que team_season_points tiene datos
2. Ejecutar script de migración
3. Verificar logs en consola

### Problema: Rankings no coinciden con los anteriores

**Investigación:**
```sql
-- Comparar puntos por equipo
SELECT 
  t.name,
  cr.total_points as old_points,
  tsr.beach_mixed_points as new_points,
  cr.ranking_category,
  tsr.season
FROM current_rankings cr
JOIN team_season_rankings tsr ON cr.team_id = tsr.team_id
JOIN teams t ON t.id = cr.team_id
WHERE ABS(cr.total_points - tsr.beach_mixed_points) > 0.01
ORDER BY t.name;
```

### Problema: Migración muy lenta

**Optimización:**
- Ejecutar en horario de baja actividad
- Verificar índices en base de datos
- Revisar logs para detectar cuellos de botella

---

## 📝 Notas Importantes

1. **Coeficientes Regionales:**
   - Actualmente en 1.0 (sin efecto)
   - Sistema preparado para futura implementación
   - No requiere cambios en rankings actuales

2. **Compatibilidad:**
   - Funciones deprecated mantienen compatibilidad
   - Eliminación gradual después de validación
   - Sistema nuevo puede coexistir con el antiguo

3. **Backup:**
   - Migración 010 crea backup automático antes de eliminar
   - Formato: `current_rankings_backup_YYYYMMDD_HHMMSS`
   - Mantener backups por al menos 1 mes

---

## 🎯 Checklist Final

### Pre-Migración
- [ ] Backup de base de datos completa
- [ ] Migración 007 ejecutada
- [ ] Código deployed en development
- [ ] Team lead informado

### Migración
- [ ] Script ejecutado exitosamente
- [ ] 0 errores en la migración
- [ ] Todos los registros creados
- [ ] Validación SQL pasada

### Post-Migración
- [ ] Rankings visibles en web
- [ ] Gráficas funcionando
- [ ] No hay errores en consola
- [ ] Rendimiento aceptable
- [ ] 1 semana de validación en producción

### Limpieza
- [ ] Migración 008 ejecutada
- [ ] Migración 009 ejecutada
- [ ] Migración 010 ejecutada (después de validación)
- [ ] Código deprecated eliminado
- [ ] Documentación actualizada

---

## 📞 Soporte

Si encuentras problemas durante la migración:
1. Revisa los logs en consola
2. Verifica el estado de las tablas en Supabase
3. Consulta esta guía
4. Revisa los commits para ver cambios específicos

---

**Última actualización:** 25 de octubre de 2025
**Versión:** 1.0.0
**Branch:** feature/team-detail-ui-improvements

