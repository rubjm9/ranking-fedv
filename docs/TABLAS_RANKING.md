# Tablas del sistema de ranking

Resumen de las tablas principales y para qué sirve cada una (no se duplican; tienen roles distintos).

---

## team_season_points

- **Qué es:** Cache de **puntos base** por equipo y temporada (una fila por equipo por temporada).
- **Contenido:** Puntos por modalidad (`beach_mixed_points`, `beach_open_points`, `beach_women_points`, `grass_mixed_points`, `grass_open_points`, `grass_women_points`) y rankings de subtemporada (open y women por separado: `subseason_2_beach_open_rank`, `subseason_2_beach_women_rank`, etc.).
- **Origen:** Se rellena desde `positions` (al guardar resultados o al usar “Regenerar temporada” en /admin/seasons).
- **Uso:** Cálculo de rankings por modalidad (con coeficientes de antigüedad), historial de subtemporadas en detalle de equipo y gráficas de evolución. Los rankings **Open y Women** se guardan por separado; solo se suman para rankings globales (playa, césped o general).

---

## team_season_rankings

- **Qué es:** Tabla de **rankings ya calculados** por equipo y temporada (una fila por equipo por temporada).
- **Contenido:** Puesto y puntos por modalidad (`beach_mixed_rank`, `beach_open_rank`, …) y ranking global, más columnas de evolución (cambios de posición entre subupdates).
- **Origen:** Se calcula a partir de `team_season_points` (coeficientes aplicados) mediante scripts/admin o servicios de actualización.
- **Uso:** Consultas rápidas de ranking por temporada y comparativas (sin recalcular cada vez).

---

## current_rankings

- **Estado:** **Eliminada** en la migración 010. Su función la cubre `team_season_rankings`.

---

## ranking_history

- **Estado:** No existe como tabla en el esquema actual. El “historial” que ves en la app (gráfica de evolución del equipo) se construye **en tiempo real** desde `team_season_points` (columnas de subtemporada y puntos por modalidad) en `teamDetailService.generateRankingHistory()`.

---

## Resumen

| Tabla                 | Rol                         | Rellenada por                          |
|-----------------------|-----------------------------|----------------------------------------|
| **team_season_points**| Puntos y ranks por subtemporada (open/women por separado) | Regenerar desde positions / al guardar CE1 |
| **team_season_rankings** | Rankings finales por temporada y modalidad | Cálculo desde team_season_points       |
| **current_rankings**  | Obsoleta (eliminada)        | —                                      |
| **ranking_history**   | No es tabla; es dato derivado | teamDetailService desde team_season_points |
