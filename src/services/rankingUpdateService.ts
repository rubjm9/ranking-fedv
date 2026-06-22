/**
 * Servicio unificado para actualizar rankings
 * Centraliza todas las operaciones de actualización en una sola función
 */

import { supabase } from './supabaseService'
import seasonPointsService from './seasonPointsService'
import teamSeasonRankingsService from './teamSeasonRankingsService'
import seasonService from './seasonService'
import hybridRankingService from './hybridRankingService'

export interface UpdateResult {
  success: boolean
  message: string
  steps: {
    recomputePositions?: { success: boolean; message: string; updated: number }
    regionalCoefficients?: { success: boolean; message: string; seasons: string[] }
    regenerateSeasons: { success: boolean; message: string; seasons: string[] }
    historicalRankings?: { success: boolean; message: string; totalUpdated: number }
    syncRankings: { success: boolean; message: string; categories: string[] }
  }
}

const REFERENCE_SEASON = '2024-25' // Temporada de referencia para current_rankings

const SURFACE_CATEGORIES: (keyof typeof hybridRankingService.CategoryPointsMap)[] = [
  'beach_mixed', 'beach_women', 'beach_open',
  'grass_mixed', 'grass_women', 'grass_open'
]

/**
 * Enumera las temporadas con torneos en orden cronológico ascendente.
 * Opcionalmente filtra desde `fromSeason` (incluida).
 */
const listSeasonsAscending = async (fromSeason?: string): Promise<string[]> => {
  if (!supabase) throw new Error('Supabase no está configurado')

  const { data, error } = await supabase
    .from('tournaments')
    .select('year')
    .not('year', 'is', null)
    .order('year', { ascending: true })

  if (error) throw error

  const fromYear = fromSeason ? parseInt(fromSeason.split('-')[0]) : -Infinity
  const years = [...new Set((data || []).map((r: any) => r.year as number))]
    .filter(y => y >= fromYear)

  return years.map(y => `${y}-${String(y + 1).slice(-2)}`)
}

const rankingUpdateService = {
  /**
   * Función principal: reconstruye todo el sistema de rankings de extremo a extremo.
   *
   * 0. Recalcula los puntos base de cada posición con la curva vigente (positions).
   * 1. Recorre las temporadas en orden cronológico y, por cada una:
   *    a. Calcula y guarda los coeficientes regionales (CE1/CE2, ventana de 4 años).
   *    b. Agrega puntos por equipo aplicando el coeficiente regional de T-1 a los
   *       campeonatos REGIONAL (team_season_points).
   *    c. Recalcula los rankings históricos de la temporada (team_season_rankings),
   *       incluyendo los rankings combinados (globales por subactualización).
   * 2. Sincroniza los current_rankings de la temporada de referencia.
   *
   * El orden cronológico es obligatorio: el coeficiente regional que afecta a los
   * regionales de la temporada T se calcula con los resultados nacionales hasta T-1.
   */
  async rebuildFullRankingSystem(options?: { fromSeason?: string }): Promise<UpdateResult> {
    const fromSeason = options?.fromSeason
    console.log(`🚀 Reconstrucción completa del sistema de rankings${fromSeason ? ` desde ${fromSeason}` : ''}...`)

    const result: UpdateResult = {
      success: false,
      message: '',
      steps: {
        recomputePositions: { success: false, message: '', updated: 0 },
        regionalCoefficients: { success: false, message: '', seasons: [] },
        regenerateSeasons: { success: false, message: '', seasons: [] },
        historicalRankings: { success: false, message: '', totalUpdated: 0 },
        syncRankings: { success: false, message: '', categories: [] }
      }
    }

    try {
      // PASO 0: Recalcular puntos base de todas las posiciones con la curva vigente.
      console.log('🧮 Paso 0: Recalculando puntos de posiciones con la curva vigente...')
      const recomputeResult = await seasonPointsService.recomputeAllPositionPoints()
      result.steps.recomputePositions = {
        success: recomputeResult.success,
        message: recomputeResult.message,
        updated: recomputeResult.updated
      }
      if (!recomputeResult.success) {
        result.message = `Error recalculando puntos de posiciones: ${recomputeResult.message}`
        return result
      }
      console.log(`✅ ${recomputeResult.updated} posiciones recalculadas`)

      // Temporadas en orden cronológico ascendente.
      const seasons = await listSeasonsAscending(fromSeason)
      console.log(`📅 Temporadas a procesar (${seasons.length}): ${seasons.join(', ')}`)

      const processedSeasons: string[] = []
      const coefficientSeasons: string[] = []
      let totalRankingsUpdated = 0

      // PASO 1: bucle cronológico (coeficientes -> puntos -> rankings históricos).
      for (const season of seasons) {
        console.log(`\n⏳ Procesando temporada ${season}...`)

        // 1a. Coeficientes regionales de esta temporada (se aplican a los regionales de T+1).
        try {
          const count = await seasonService.calculateAndSaveRegionalCoefficients(season)
          if (count > 0) coefficientSeasons.push(season)
        } catch (error: any) {
          console.error(`❌ Error calculando coeficientes de ${season}:`, error)
        }

        // 1b. Agregar puntos por equipo (aplica coef. regional de T-1 a REGIONAL).
        const pointsResult = await seasonPointsService.calculateAndSaveSeasonPoints(season)
        if (pointsResult.success) {
          processedSeasons.push(season)
        } else {
          console.error(`❌ Error agregando puntos de ${season}: ${pointsResult.message}`)
        }

        // 1c. Recalcular rankings históricos de la temporada (incluye combinados).
        const rankingsResult = await teamSeasonRankingsService.calculateSeasonRankings(season)
        if (rankingsResult.success) {
          totalRankingsUpdated += rankingsResult.updated
        } else {
          console.error(`❌ Error recalculando rankings de ${season}: ${rankingsResult.message}`)
        }
      }

      result.steps.regionalCoefficients = {
        success: true,
        message: `Coeficientes calculados para ${coefficientSeasons.length} temporadas`,
        seasons: coefficientSeasons
      }
      result.steps.regenerateSeasons = {
        success: processedSeasons.length === seasons.length,
        message: `${processedSeasons.length}/${seasons.length} temporadas regeneradas`,
        seasons: processedSeasons
      }
      result.steps.historicalRankings = {
        success: true,
        message: `${totalRankingsUpdated} registros de rankings históricos actualizados`,
        totalUpdated: totalRankingsUpdated
      }

      // PASO 2: Sincronizar current_rankings de la temporada de referencia.
      console.log('🔄 Paso 2: Sincronizando rankings actuales...')
      const syncResults = []
      for (const category of SURFACE_CATEGORIES) {
        try {
          console.log(`🔄 Sincronizando ${category}...`)
          const syncResult = await hybridRankingService.syncWithCurrentRankings(category, REFERENCE_SEASON)
          syncResults.push({ category, ...syncResult })
        } catch (error: any) {
          console.error(`❌ Error sincronizando ${category}:`, error)
          syncResults.push({ category, success: false, message: error.message || 'Error desconocido' })
        }
      }

      const successfulSyncs = syncResults.filter(r => r.success)
      const failedSyncs = syncResults.filter(r => !r.success)

      result.steps.syncRankings = {
        success: failedSyncs.length === 0,
        message: failedSyncs.length === 0
          ? `${successfulSyncs.length} categorías sincronizadas exitosamente`
          : `${successfulSyncs.length} exitosas, ${failedSyncs.length} fallidas`,
        categories: successfulSyncs.map(r => r.category)
      }

      result.success =
        result.steps.recomputePositions.success &&
        result.steps.regenerateSeasons.success &&
        result.steps.syncRankings.success

      result.message = result.success
        ? `✅ Reconstrucción completa: ${processedSeasons.length} temporadas, ${totalRankingsUpdated} rankings históricos, ${successfulSyncs.length} categorías sincronizadas`
        : `⚠️ Reconstrucción parcial: ${result.steps.regenerateSeasons.message} | ${result.steps.syncRankings.message}`

      console.log('🎉 Reconstrucción completa finalizada:', result.message)
      return result

    } catch (error: any) {
      console.error('❌ Error en reconstrucción completa:', error)
      result.message = `Error crítico: ${error.message || 'Error desconocido'}`
      return result
    }
  },

  /**
   * Compatibilidad: actualización completa de todo el histórico.
   * Delega en rebuildFullRankingSystem sin filtro de temporada.
   */
  async updateCompleteRankingSystem(): Promise<UpdateResult> {
    return rankingUpdateService.rebuildFullRankingSystem()
  },

  /**
   * Función rápida: Solo sincroniza rankings actuales
   * Útil cuando solo necesitas actualizar current_rankings
   */
  async syncCurrentRankingsOnly(): Promise<{ success: boolean; message: string }> {
    console.log('🔄 Sincronizando solo rankings actuales...')
    
    try {
      const categories: (keyof typeof hybridRankingService.CategoryPointsMap)[] = [
        'beach_mixed', 'beach_women', 'beach_open',
        'grass_mixed', 'grass_women', 'grass_open'
      ]

      const currentSeason = '2024-25'
      const results = []

      for (const category of categories) {
        const result = await hybridRankingService.syncWithCurrentRankings(category, currentSeason)
        results.push({ category, ...result })
      }

      const successful = results.filter(r => r.success)
      const failed = results.filter(r => !r.success)

      if (failed.length === 0) {
        return {
          success: true,
          message: `✅ ${successful.length} categorías sincronizadas exitosamente`
        }
      } else {
        return {
          success: false,
          message: `⚠️ ${successful.length} exitosas, ${failed.length} fallidas`
        }
      }

    } catch (error: any) {
      console.error('❌ Error en sincronización:', error)
      return {
        success: false,
        message: `Error: ${error.message || 'Error desconocido'}`
      }
    }
  },

  /**
   * Función de diagnóstico: Verifica el estado del sistema
   */
  async diagnoseSystem(): Promise<{
    seasons: { count: number; list: string[] }
    teamSeasonPoints: { count: number }
    currentRankings: { count: number; categories: string[] }
    positions: { count: number }
  }> {
    console.log('🔍 Diagnosticando sistema de rankings...')
    
    // Esta función necesitaría implementarse con consultas específicas
    // Por ahora retornamos estructura básica
    return {
      seasons: { count: 0, list: [] },
      teamSeasonPoints: { count: 0 },
      currentRankings: { count: 0, categories: [] },
      positions: { count: 0 }
    }
  }
}

export default rankingUpdateService
