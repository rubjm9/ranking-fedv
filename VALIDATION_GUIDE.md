# Guía de Validación del Nuevo Sistema de Rankings

## 📋 Resumen

Esta guía proporciona pasos detallados para validar que el nuevo sistema de rankings funciona correctamente después de la migración.

---

## ✅ Estado Actual

**Migración completada:**
- ✅ Tabla `team_season_rankings` creada
- ✅ 280 registros migrados
- ✅ 5 temporadas procesadas
- ✅ Sin errores durante la migración

**Próximo paso:** Validar que el sistema funciona correctamente

---

## 🔍 VALIDACIÓN PASO A PASO

### **1. Verificación Básica en la Web (5 minutos)**

#### **1.1 Página de Ranking General**

1. **Abrir:** `http://localhost:5173/ranking`
2. **Hacer clic** en el tab "Ranking General"
3. **Verificar:** Se muestra un gráfico con la evolución del ranking

**Qué verificar:**
- ✅ El gráfico se muestra sin errores
- ✅ Hay puntos de datos visibles
- ✅ La leyenda es legible
- ✅ No hay errores en la consola (F12)

#### **1.2 Página de Ranking Nuevo**

1. **Abrir:** `http://localhost:5173/ranking-new`
2. **Hacer clic** en el tab "Ranking General"
3. **Verificar:** Se muestra un gráfico con explicación detallada

**Qué verificar:**
- ✅ El gráfico se muestra correctamente
- ✅ Hay puntos de datos visibles
- ✅ La explicación es clara
- ✅ No hay errores en la consola

#### **1.3 Página de Detalle de Equipo**

1. **Abrir:** `http://localhost:5173/teams`
2. **Hacer clic** en un equipo (ej: "AC Palma")
3. **Scroll** hasta la sección "Evolución del Ranking"
4. **Verificar:** Se muestra un gráfico con la evolución histórica

**Qué verificar:**
- ✅ El gráfico se muestra con datos
- ✅ La evolución histórica es visible
- ✅ Hay puntos por temporada
- ✅ No hay errores en la consola

---

### **2. Validación de Datos en Supabase (10 minutos)**

#### **2.1 Ejecutar Consulta de Validación**

1. **Ir a:** Supabase Dashboard → SQL Editor
2. **Copiar** el contenido de `database/queries/validate_rankings.sql`
3. **Pegar y ejecutar**
4. **Verificar resultados:**

**Resultados esperados:**
- Total de registros: **280**
- 5 temporadas disponibles
- AC Palma tiene datos en todas las temporadas
- Top 5 de beach_mixed tiene sentido lógico

#### **2.2 Comparar con Sistema Antiguo**

1. **Ejecutar** la consulta en `database/queries/compare_systems.sql`
2. **Verificar:** Los rankings nuevos tienen sentido vs los antiguos
3. **Revisar:** Diferencias menores son esperables (debido a antigüedad)

---

### **3. Validación de Funcionalidades (15 minutos)**

#### **3.1 Rankings por Modalidad Individual**

**En `/ranking/` o `/ranking-new/`:**

1. **Verificar** que se muestra:
   - Beach Mixed (Playa Mixto)
   - Beach Open (Playa Open)
   - Beach Women (Playa Women)
   - Grass Mixed (Césped Mixto)
   - Grass Open (Césped Open)
   - Grass Women (Césped Women)

2. **Hacer clic** en cada modalidad
3. **Verificar** que los rankings se muestran correctamente

#### **3.2 Rankings Combinados**

**Verificar que se calculan correctamente:**
- Ranking de Playa (suma de beach_mixed + beach_open + beach_women)
- Ranking de Césped (suma de grass_mixed + grass_open + grass_women)
- Ranking Open (suma de beach_open + grass_open)
- Ranking Women (suma de beach_women + grass_women)
- Ranking Mixto (suma de beach_mixed + grass_mixed)

#### **3.3 Gráficas de Evolución**

**En cualquier gráfica de evolución:**

1. **Verificar** que se muestran:
   - Líneas con colores diferentes
   - Leyenda clara
   - Valores en el tooltip al pasar el mouse

2. **Verificar** que los datos tienen sentido:
   - Las posiciones cambian con el tiempo
   - No hay saltos absurdos
   - La evolución es gradual

---

### **4. Testing Avanzado (Opcional)**

#### **4.1 Verificar Rankings Específicos**

**Ejecutar en Supabase SQL Editor:**

```sql
-- Ver ranking completo de beach_mixed en temporada actual
SELECT 
  t.name as equipo,
  tsr.beach_mixed_rank as posicion,
  tsr.beach_mixed_points as puntos
FROM team_season_rankings tsr
JOIN teams t ON t.id = tsr.team_id
WHERE tsr.season = '2025-26'
  AND tsr.beach_mixed_rank IS NOT NULL
ORDER BY tsr.beach_mixed_rank ASC
LIMIT 20;
```

**Verificar:**
- ✅ Los equipos tienen sentido (no hay datos inventados)
- ✅ Las posiciones son secuenciales (1, 2, 3, 4...)
- ✅ Los puntos son lógicos (mayores = mejor posición)

#### **4.2 Verificar Históricos**

**Ver evolución de un equipo específico:**

```sql
-- AC Palma - evolución en beach_mixed
SELECT 
  season,
  beach_mixed_rank as posicion,
  beach_mixed_points as puntos
FROM team_season_rankings
WHERE team_id = (SELECT id FROM teams WHERE name = 'AC Palma')
  AND beach_mixed_rank IS NOT NULL
ORDER BY season DESC;
```

**Verificar:**
- ✅ Hay datos en todas las temporadas disponibles
- ✅ La evolución tiene sentido
- ✅ No hay posiciones absurdas

---

### **5. Comparación con Sistema Anterior**

#### **5.1 Verificar Coherencia**

**Ejecutar:**

```sql
-- Comparar top 10 de beach_mixed entre sistemas
-- (Ver database/queries/compare_systems.sql)

-- Esperar:
- Rankings similares (puede haber diferencias por antigüedad)
- Equipos importantes en el top
- Sin pérdida de información significativa
```

#### **5.2 Verificar Puntos**

**Comparar puntos totales:**

```sql
SELECT 
  t.name,
  tsr.beach_mixed_points as puntos_nuevo,
  cr.total_points as puntos_viejo,
  ABS(tsr.beach_mixed_points - cr.total_points) as diferencia
FROM team_season_rankings tsr
JOIN current_rankings cr ON tsr.team_id = cr.team_id AND cr.ranking_category = 'beach_mixed'
JOIN teams t ON t.id = tsr.team_id
WHERE tsr.season = '2025-26'
ORDER BY diferencia DESC
LIMIT 10;
```

**Verificar:**
- ✅ Diferencias son pequeñas (dependiendo de antigüedad)
- ✅ No hay diferencias absurdas (más de 100%)

---

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### **Problema 1: "No hay datos históricos disponibles"**

**Causa:** La tabla `team_season_rankings` está vacía o el servicio no puede acceder.

**Solución:**
```sql
-- Verificar que hay datos
SELECT COUNT(*) FROM team_season_rankings;

-- Si está vacío, ejecutar migración nuevamente desde /admin/migrate-rankings
```

### **Problema 2: Gráfica muestra "No data"**

**Causa:** El componente no puede obtener datos de la API.

**Solución:**
1. **Abrir consola** del navegador (F12)
2. **Ver errores** en la pestaña Console
3. **Verificar** que no hay errores de CORS o autenticación
4. **Revisar** la pestaña Network para ver qué requests fallan

### **Problema 3: Rankings diferentes entre sistemas**

**Causa:** El nuevo sistema aplica coeficientes de antigüedad, el viejo no.

**Solución:** Esto es **esperado y correcto**. El nuevo sistema:
- Considera 4 temporadas
- Aplica coeficientes (1.0, 0.8, 0.5, 0.2)
- Prioriza equipos consistentes en el tiempo

### **Problema 4: Algunas modalidades sin datos**

**Causa:** No hay datos históricos para esa modalidad.

**Ejemplo:** beach_open en 2021-22 tiene 0 equipos porque no había ese tipo de torneos.

**Solución:** Esto es normal. El sistema registra 0 si no hay datos.

---

## ✅ CHECKLIST DE VALIDACIÓN

### **Validación Básica**
- [ ] Gráfico visible en `/ranking/` (tab Ranking General)
- [ ] Gráfico visible en `/ranking-new/` (tab Ranking General)
- [ ] Gráfico visible en `/teams/[id]` (sección Evolución)
- [ ] No hay errores en consola del navegador
- [ ] 280 registros en `team_season_rankings`

### **Validación de Datos**
- [ ] 5 temporadas disponibles
- [ ] Top 5 de beach_mixed tiene sentido
- [ ] AC Palma tiene datos históricos completos
- [ ] Rankings son secuenciales (1, 2, 3, 4...)

### **Validación de Funcionalidades**
- [ ] Rankings por modalidad individual funcionan
- [ ] Rankings combinados se calculan correctamente
- [ ] Gráficas muestran evolución histórica
- [ ] Tooltips muestran información correcta

### **Validación Avanzada (Opcional)**
- [ ] Comparación con `current_rankings` es coherente
- [ ] Diferencias de puntos son razonables
- [ ] Históricos completos para múltiples equipos
- [ ] Sin pérdida de información

---

## 📊 RESULTADOS ESPERADOS

### **Datos en team_season_rankings**

```sql
-- Estructura esperada
- Total registros: 280
- Temporadas: 5 (2021-22, 2022-23, 2023-24, 2024-25, 2025-26)
- Columnas por equipo/temporada: 18 (id, team_id, season, 6x rank, 6x points, timestamps)
- Tipos: DECIMAL(10,2) para puntos, INTEGER para rankings
```

### **Datos Esperados por Temporada**

- **2025-26:** ~61 equipos (56 beach_mixed, 48 beach_open, etc.)
- **2024-25:** ~63 equipos
- **2023-24:** ~63 equipos
- **2022-23:** ~54 equipos
- **2021-22:** ~39 equipos (solo beach_mixed, otras modalidades con 0)

### **Equipos Top en beach_mixed (ejemplo)**

```sql
-- Debería verse algo como:
1. Algun equipo importante (puntos altos)
2. Otro equipo importante
3. ...
```

---

## 🎯 PRÓXIMOS PASOS DESPUÉS DE VALIDACIÓN

### **Si todo funciona correctamente:**

1. **Esperar 1 semana** sin errores
2. **Ejecutar migración 008** (limpiar `team_season_points`)
3. **Ejecutar migración 009** (preparar coeficientes regionales)
4. **Ejecutar migración 010** (eliminar `current_rankings`)
5. **Marcar como completado**

### **Si hay problemas:**

1. **Anotar** el problema específico
2. **Revisar** esta guía para solución
3. **Consultar** logs en consola
4. **Comparar** con `current_rankings`
5. **Solicitar** ayuda si es necesario

---

## 📞 SOPORTE

**Si encuentras problemas durante la validación:**

1. **Consultar** logs en consola del navegador (F12)
2. **Revisar** esta guía de solución de problemas
3. **Verificar** que la migración se completó correctamente
4. **Comparar** con datos antiguos en `current_rankings`

**Archivos útiles:**
- `database/queries/validate_rankings.sql` - Consultas de validación
- `database/queries/compare_systems.sql` - Comparación de sistemas
- `MIGRATION_GUIDE.md` - Guía completa de migración

---

**Última actualización:** 26 de octubre de 2025  
**Versión:** 1.0.0  
**Estado:** ✅ Migración completada, en validación
