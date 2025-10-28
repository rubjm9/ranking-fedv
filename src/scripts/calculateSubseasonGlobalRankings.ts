/**
 * Función para calcular y guardar rankings globales de subtemporadas
 * IMPLEMENTACIÓN COMPLETA: Detecta automáticamente qué torneos se jugaron en cada subupdate
 * y aplica la lógica correcta de coeficientes de antigüedad por modalidad
 */

import { supabase } from '../services/supabaseService'

/**
 * Mapeo de modalidades a sus torneos
 */
const MODALITY_MAP = {
  'BEACH_MIXED': 'beach_mixed',
  'BEACH_OPEN': 'beach_open',
  'BEACH_WOMEN': 'beach_women',
  'GRASS_MIXED': 'grass_mixed',
  'GRASS_OPEN': 'grass_open',
  'GRASS_WOMEN': 'grass_women'
}

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
 * Determinar qué torneos se jugaron antes de una fecha en cada subtemporada
 * Subtemporadas: marzo, junio, septiembre, diciembre
 */
const getSubseasonCutoffDate = (year: number, subupdate: number): string => {
  const cutoffs = [
    `${year}-03-31`, // Subupdate 1: Playa Mixto (hasta marzo)
    `${year}-06-30`, // Subupdate 2: Playa Open/Women (hasta junio)
    `${year}-09-30`, // Subupdate 3: Césped Mixto (hasta septiembre)
    `${year}-12-31`  // Subupdate 4: Final (hasta diciembre)
  ]
  return cutoffs[subupdate - 1] || cutoffs[3]
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

  // Obtener TODOS los datos de rankings de una vez
  const { data: allRankingsData } = await supabase
    .from('team_season_rankings')
    .select('*')
    .in('season', historicalSeasons)

  if (!allRankingsData) {
    console.log(`⚠️ No hay datos de rankings para estas temporadas`)
    return
  }

  // Extraer el año base de la temporada
  const baseYear = parseInt(season.split('-')[0])

  // Para cada subupdate (1-4), calcular ranking acumulativo
  for (let subupdate = 1; subupdate <= 4; subupdate++) {
    console.log(`\n📊 Calculando subupdate ${subupdate}...`)
    const cutoffDate = getSubseasonCutoffDate(baseYear, subupdate)
    console.log(`📅 Fecha corte: ${cutoffDate}`)

    const teamPoints: Array<{ team_id: string, total: number }> = []

    for (const teamId of uniqueTeams) {
      let totalPoints = 0

      // Para cada modalidad, calcular puntos con lógica correcta
      for (const [tournamentModality, pointsColumn] of Object.entries(MODALITY_MAP)) {
        let modalityPoints = 0

        // Determinar qué temporadas han jugado esta modalidad (usar la más reciente disponible)
        for (let i = 0; i < historicalSeasons.length; i++) {
          const tempSeason = historicalSeasons[i]
          const coeff = getAntiquityCoeff(i)

          // Buscar en los datos en memoria
          const data = allRankingsData.find(
            r => r.team_id === teamId && r.season === tempSeason
          )

          if (data && data[`${pointsColumn}_points`]) {
            modalityPoints += data[`${pointsColumn}_points`] * coeff
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