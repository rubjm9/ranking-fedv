/**
 * Función para calcular y guardar rankings globales de subtemporadas
 * LÓGICA CORRECTA:
 * - Cada subupdate incluye TODAS las 6 modalidades
 * - Para cada modalidad, usa el torneo MÁS RECIENTE disponible con coeficiente 1.0
 * - Los torneos anteriores usan coeficientes 0.8, 0.5, 0.2
 * - Por ejemplo, en subupdate 1 (después de playa mixto):
 *   - Playas open/women: Usan torneo de temporada anterior (coef 1.0) hasta que se juegue el actual
 *   - Césped: Usan torneo de temporada anterior (coef 1.0)
 */

import { supabase } from '../services/supabaseService'

/**
 * Obtener temporadas históricas para una temporada base
 */
const getHistoricalSeasons = (baseSeason: string, count: number = 4): string[] => {
  const [startYear] = baseSeason.split('-')
  const seasons: string[] = []
  
  for (let i = 0; i < count; i++) {
    const year = parseInt(startYear) - i
    const season = `${year}-${(year + 1).toString().slice(-2)}`
    seasons.push(season)
  }
  
  return seasons
}

/**
 * Calcular coeficiente de antigüedad (el más reciente tiene coef 1.0)
 */
const getAntiquityCoeff = (index: number): number => {
  const coeffs = [1.0, 0.8, 0.5, 0.2]
  return coeffs[index] || 0
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

  // Obtener temporadas históricas (current y 3 anteriores)
  const historicalSeasons = getHistoricalSeasons(season, 4)
  console.log(`📅 Temporadas históricas: ${historicalSeasons.join(', ')}`)

  // Obtener TODOS los equipos que participaron en estas temporadas
  const { data: allTeamsData } = await supabase
    .from('team_season_rankings')
    .select('team_id')
    .in('season', historicalSeasons)

  if (!allTeamsData || allTeamsData.length === 0) {
    console.log(`⚠️ No hay datos para temporada ${season}`)
    return
  }

  const uniqueTeams = [...new Set(allTeamsData.map(t => t.team_id))]
  console.log(`👥 Total equipos únicos: ${uniqueTeams.length}`)

  // Obtener TODOS los datos de las 4 temporadas de una sola vez (MUCHO MÁS RÁPIDO)
  const { data: allRankingsData } = await supabase
    .from('team_season_rankings')
    .select('*')
    .in('season', historicalSeasons)

  if (!allRankingsData) {
    console.log(`⚠️ No hay datos de rankings para estas temporadas`)
    return
  }

  // Definir las 6 modalidades
  const modalities = ['beach_mixed', 'beach_open', 'beach_women', 'grass_mixed', 'grass_open', 'grass_women']

  // Para cada subupdate (1-4), calcular ranking acumulativo
  for (let subupdate = 1; subupdate <= 4; subupdate++) {
    console.log(`\n📊 Calculando subupdate ${subupdate}...`)

    const teamPoints: Array<{ team_id: string, total: number }> = []

    for (const teamId of uniqueTeams) {
      let totalPoints = 0

      // Para cada modalidad, calcular puntos acumulativos
      for (const modality of modalities) {
        let modalityPoints = 0

        // Iterar por las 4 temporadas históricas
        for (let i = 0; i < historicalSeasons.length; i++) {
          const tempSeason = historicalSeasons[i]
          const coeff = getAntiquityCoeff(i)

          // Buscar en los datos en memoria (mucho más rápido)
          const data = allRankingsData.find(
            r => r.team_id === teamId && r.season === tempSeason
          )

          if (data && data[`${modality}_points`]) {
            modalityPoints += data[`${modality}_points`] * coeff
          }
        }

        totalPoints += modalityPoints
      }

      teamPoints.push({
        team_id: teamId,
        total: totalPoints
      })
    }

    // Ordenar por puntos totales
    teamPoints.sort((a, b) => b.total - a.total)

    console.log(`✅ Equipos calculados: ${teamPoints.length}`)

    // Guardar rankings en team_season_rankings
    for (let i = 0; i < teamPoints.length; i++) {
      const team = teamPoints[i]
      
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