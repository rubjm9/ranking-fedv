/**
 * Función simplificada para calcular y guardar rankings globales de subtemporadas
 * SIMPLIFICADO: Por ahora, todos los subupdates usan los mismos datos finales
 * TODO: En implementación futura, aplicar lógica correcta de coeficientes por subtemporada
 */

import { supabase } from '../services/supabaseService'

/**
 * Calcular y guardar rankings globales por subtemporada para una temporada
 * SIMPLIFICADO: Por ahora calcula el ranking global sumando las 6 modalidades
 */
export const calculateAndSaveSubseasonGlobalRankings = async (
  season: string
): Promise<void> => {
  if (!supabase) {
    throw new Error('Supabase no configurado')
  }

  console.log(`🔄 Calculando rankings globales de subtemporadas para ${season}...`)

  // Obtener TODOS los equipos de esta temporada en team_season_rankings
  // (ya tienen rankings por modalidad calculados)
  const { data: seasonData } = await supabase
    .from('team_season_rankings')
    .select('*')
    .eq('season', season)

  if (!seasonData || seasonData.length === 0) {
    console.log(`⚠️ No hay datos para temporada ${season}`)
    return
  }

  console.log(`📊 Encontrados ${seasonData.length} equipos para temporada ${season}`)

  // Calcular puntos globales sumando todas las modalidades de cada equipo
  const teamGlobalPoints = seasonData.map((row: any) => {
    const totalPoints = (row.beach_mixed_points || 0) + 
                      (row.beach_open_points || 0) + 
                      (row.beach_women_points || 0) + 
                      (row.grass_mixed_points || 0) + 
                      (row.grass_open_points || 0) + 
                      (row.grass_women_points || 0)

    return {
      team_id: row.team_id,
      total: totalPoints
    }
  })

  // Ordenar por puntos totales y asignar rankings
  teamGlobalPoints.sort((a, b) => b.total - a.total)

  console.log(`✅ Calculados ${teamGlobalPoints.length} equipos`)

  // Guardar para todos los subupdates (por ahora mismo valor)
  // TODO: Implementar lógica diferente por subupdate en el futuro
  for (let subupdate = 1; subupdate <= 4; subupdate++) {
    console.log(`\n📊 Guardando subupdate ${subupdate}...`)

    for (let i = 0; i < teamGlobalPoints.length; i++) {
      const team = teamGlobalPoints[i]
      
      await supabase
        .from('team_season_rankings')
        .update({
          [`subupdate_${subupdate}_global_rank`]: i + 1,
          [`subupdate_${subupdate}_global_points`]: team.total
        })
        .eq('team_id', team.team_id)
        .eq('season', season)
    }

    console.log(`✅ Rankings guardados para subupdate ${subupdate}`)
  }

  console.log(`✅ Rankings globales de subtemporadas calculados para ${season}`)
}

/**
 * Calcular rankings globales para todas las temporadas
 */
export const calculateAllSubseasonGlobalRankings = async (): Promise<void> => {
  if (!supabase) {
    throw new Error('Supabase no configurado')
  }

  console.log('🚀 Iniciando cálculo de rankings globales de subtemporadas...')

  // Obtener todas las temporadas
  const { data: seasonsData } = await supabase
    .from('team_season_rankings')
    .select('season')
    .order('season', { ascending: false })

  if (!seasonsData) return

  const uniqueSeasons = [...new Set(seasonsData.map(s => s.season))]
  console.log(`📅 Total temporadas a procesar: ${uniqueSeasons.length}`)

  for (const season of uniqueSeasons) {
    try {
      await calculateAndSaveSubseasonGlobalRankings(season)
    } catch (error) {
      console.error(`❌ Error procesando temporada ${season}:`, error)
    }
  }

  console.log('✅ Cálculo de rankings globales completado')
}