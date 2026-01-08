/**
 * Función para calcular y guardar rankings globales de subtemporadas
 * 
 * LÓGICA CORRECTA:
 * En cada subupdate se incluyen TODAS las 6 superficies, pero los coeficientes
 * dependen de qué torneos ya se han jugado en la temporada actual.
 * 
 * - Subupdate 1: Tras playa mixto
 *   * beach_mixed actual → x1.0
 *   * Otras 5 superficies (aún no jugadas) se toman de temp anterior → x1.0
 *   * Todas las anteriores → x0.8, x0.5, x0.2
 * 
 * - Subupdate 2: Tras playa open + women
 *   * 3 playas actual → x1.0
 *   * 3 céspeds (aún no jugados) de temp anterior → x1.0
 *   * Todas anteriores → x0.8, x0.5, x0.2
 * 
 * - Subupdate 3: Tras césped mixto
 *   * 3 playas + grass_mixed actual → x1.0
 *   * 2 céspeds restantes de temp anterior → x1.0
 *   * Todas anteriores → x0.8, x0.5, x0.2
 * 
 * - Subupdate 4: Tras césped open + women
 *   * TODAS las 6 superficies actual → x1.0
 *   * Todas anteriores → x0.8, x0.5, x0.2
 * 
 * Las fechas visuales en la gráfica son equidistantes (mar, jun, sep, dic)
 * pero no tienen que corresponder con las fechas reales de los torneos
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
 * Detectar si una superficie ya se ha jugado en un subupdate
 */
const isSurfacePlayed = (subupdate: number, surface: string): boolean => {
  const playedSurfaces = [
    ['beach_mixed'],                                          // Subupdate 1
    ['beach_mixed', 'beach_open', 'beach_women'],             // Subupdate 2
    ['beach_mixed', 'beach_open', 'beach_women', 'grass_mixed'], // Subupdate 3
    ['beach_mixed', 'beach_open', 'beach_women', 'grass_mixed', 'grass_open', 'grass_women'] // Subupdate 4
  ]
  
  return playedSurfaces[subupdate - 1].includes(surface)
}

/**
 * Obtener coeficiente de antigüedad dinámicamente
 * 
 * @param seasonIndex Índice de la temporada histórica (0 = actual, 1 = anterior, etc.)
 * @param subupdate Número de subupdate (1-4)
 * @param surface Superficie a evaluar
 * @returns Coeficiente a aplicar
 */
const getDynamicCoeff = (
  seasonIndex: number,
  subupdate: number,
  surface: string
): number => {
  const isPlayedInCurrentSeason = isSurfacePlayed(subupdate, surface)
  
  // Si ya se jugó en la temp actual, aplicamos coeff estándar
  if (isPlayedInCurrentSeason) {
    const coeffs = [1.0, 0.8, 0.5, 0.2]
    return coeffs[seasonIndex] || 0
  }
  
  // Si NO se ha jugado aún en la temp actual, se usa la temp anterior con x1.0
  // La temp actual tiene x0, y la anterior pasa a ser x1.0
  if (seasonIndex === 0) {
    return 0 // Temp actual no ha jugado
  }
  if (seasonIndex === 1) {
    return 1.0 // Temp anterior es la más reciente
  }
  
  // Las anteriores a la anterior se desplazan
  const coeffs = [0, 0, 0.8, 0.5, 0.2]
  return coeffs[seasonIndex] || 0
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

  // Obtener todos los equipos
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

  // Obtener TODOS los datos de PUNTOS BASE (sin coeficientes aplicados)
  const { data: allPointsData } = await supabase
    .from('team_season_points')
    .select('*')
    .in('season', historicalSeasons)

  if (!allPointsData) {
    console.log(`⚠️ No hay datos de puntos base para estas temporadas`)
    return
  }

  // Todas las 6 superficies
  const allSurfaces = [
    'beach_mixed',
    'beach_open',
    'beach_women',
    'grass_mixed',
    'grass_open',
    'grass_women'
  ]

  // Para cada subupdate (1-4), calcular ranking
  for (let subupdate = 1; subupdate <= 4; subupdate++) {
    console.log(`\n📊 Calculando subupdate ${subupdate}...`)

    const teamPoints: Array<{ team_id: string, total: number }> = []

    for (const teamId of uniqueTeams) {
      let totalPoints = 0

      // Calcular puntos de TODAS las 6 superficies
      for (const surface of allSurfaces) {
        let surfacePoints = 0

        // Iterar por las 4 temporadas históricas
        for (let i = 0; i < historicalSeasons.length; i++) {
          const tempSeason = historicalSeasons[i]
          
          // Obtener coeficiente dinámico basado en subupdate y superficie
          const coeff = getDynamicCoeff(i, subupdate, surface)

          // Buscar en los datos en memoria
          const data = allPointsData.find(
            r => r.team_id === teamId && r.season === tempSeason
          )

          if (data && data[`${surface}_points`] && coeff > 0) {
            surfacePoints += Number(data[`${surface}_points`]) * coeff
          }
        }

        totalPoints += surfacePoints
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
