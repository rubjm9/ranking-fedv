/**
 * Función para calcular y guardar rankings globales de subtemporadas
 * Esta función calcula las 4 actualizaciones anuales del ranking global
 * para una temporada específica
 */

import { supabase } from '../services/supabaseService'
import { getCoefficientsForSubupdate, calculateWeightedPoints } from '../utils/coefficientCalculator'

interface SubupdateGlobalRanking {
  team_id: string
  rank: number
  points: number
}

/**
 * Calcular y guardar rankings globales por subtemporada para una temporada
 */
export const calculateAndSaveSubseasonGlobalRankings = async (
  season: string
): Promise<void> => {
  if (!supabase) {
    throw new Error('Supabase no configurado')
  }

  console.log(`🔄 Calculando rankings globales de subtemporadas para ${season}...`)

  // Paso 1: Obtener todos los equipos con datos de esta temporada
  const { data: seasonData } = await supabase
    .from('team_season_rankings')
    .select('team_id, beach_mixed_points, beach_open_points, beach_women_points, grass_mixed_points, grass_open_points, grass_women_points')
    .eq('season', season)

  if (!seasonData || seasonData.length === 0) {
    console.log(`⚠️ No hay datos para temporada ${season}`)
    return
  }

  // Para cada una de las 4 subtemporadas
  for (let subupdate = 1; subupdate <= 4; subupdate++) {
    console.log(`\n📊 Calculando subupdate ${subupdate} para temporada ${season}...`)

    const coefficients = getCoefficientsForSubupdate(subupdate as 1 | 2 | 3 | 4, season)
    
    // Obtener todos los equipos que participaron
    const allTeams = await supabase
      .from('team_season_points')
      .select('team_id')
      .eq('season', season)

    if (!allTeams.data) continue

    const teamGlobalPoints: Array<{ team_id: string, total: number }> = []

    // Para cada equipo, calcular puntos globales con coeficientes
    for (const team of allTeams.data) {
      let globalPoints = 0

      // Sumar puntos de todas las modalidades con sus coeficientes
      for (const modality of [
        'beach_mixed',
        'beach_open', 
        'beach_women',
        'grass_mixed',
        'grass_open',
        'grass_women'
      ]) {
        const modalityCoeffs = coefficients[modality]
        if (!modalityCoeffs) continue

        for (const [targetSeason, coeff] of Object.entries(modalityCoeffs)) {
          const { data } = await supabase
            .from('team_season_points')
            .select(`${modality}_points`)
            .eq('team_id', team.team_id)
            .eq('season', targetSeason)
            .single()

          if (data && data[`${modality}_points`]) {
            globalPoints += data[`${modality}_points`] * coeff
          }
        }
      }

      teamGlobalPoints.push({
        team_id: team.team_id,
        total: globalPoints
      })
    }

    // Ordenar por puntos totales
    teamGlobalPoints.sort((a, b) => b.total - a.total)

    console.log(`✅ Calculados ${teamGlobalPoints.length} equipos para subupdate ${subupdate}`)

    // Guardar en team_season_rankings
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

    console.log(`✅ Guardados rankings de subupdate ${subupdate}`)
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
