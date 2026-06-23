/**
 * Servicio unificado para actualizar rankings
 * Centraliza todas las operaciones de actualización en una sola función
 */

import seasonPointsService from './seasonPointsService'
import teamSeasonRankingsService from './teamSeasonRankingsService'
import seasonService from './seasonService'
import rankingStateService from './rankingStateService'

export interface UpdateStepResult {
  success: boolean
  message: string
}

export interface UpdateResult {
  success: boolean
  message: string
  steps: {
    recomputePositions: UpdateStepResult & { updated?: number }
    regionalCoefficients: UpdateStepResult & { seasonsProcessed?: number; totalSaved?: number }
    regenerateSeasons: UpdateStepResult & { seasons: string[] }
    rebuildRankings: UpdateStepResult & { totalUpdated: number }
  }
}

const emptySteps = (): UpdateResult['steps'] => ({
  recomputePositions: { success: false, message: '', updated: 0 },
  regionalCoefficients: { success: false, message: '', seasonsProcessed: 0, totalSaved: 0 },
  regenerateSeasons: { success: false, message: '', seasons: [] },
  rebuildRankings: { success: false, message: '', totalUpdated: 0 },
})

const rankingUpdateService = {
  /**
   * Pipeline completo: posiciones → coeficientes regionales → puntos por temporada → rankings públicos
   */
  async rebuildEverything(): Promise<UpdateResult> {
    console.log('🚀 Iniciando actualización inteligente del ranking...')

    const result: UpdateResult = {
      success: false,
      message: '',
      steps: emptySteps(),
    }

    try {
      console.log('🧮 Paso 1: Recalculando puntos de posiciones...')
      const recomputeResult = await seasonPointsService.recomputeAllPositionPoints()
      result.steps.recomputePositions = {
        success: recomputeResult.success,
        message: recomputeResult.message,
        updated: recomputeResult.updated,
      }
      if (!recomputeResult.success) {
        result.message = `Error en posiciones: ${recomputeResult.message}`
        return result
      }

      console.log('📊 Paso 2: Recalculando coeficientes regionales...')
      const coeffResults = await seasonService.backfillRegionalCoefficients()
      const totalSaved = coeffResults.reduce((sum, r) => sum + r.count, 0)
      result.steps.regionalCoefficients = {
        success: true,
        message:
          coeffResults.length > 0
            ? `${totalSaved} coeficientes guardados en ${coeffResults.length} temporadas`
            : 'No había temporadas con datos para coeficientes',
        seasonsProcessed: coeffResults.length,
        totalSaved,
      }

      console.log('📅 Paso 3: Regenerando puntos por temporada...')
      const regenerateResult = await seasonPointsService.regenerateAllSeasons()
      result.steps.regenerateSeasons = {
        success: regenerateResult.success,
        message: regenerateResult.message,
        seasons: regenerateResult.seasons,
      }
      if (!regenerateResult.success) {
        result.message = `Error regenerando temporadas: ${regenerateResult.message}`
        return result
      }

      console.log('🏆 Paso 4: Reconstruyendo rankings públicos...')
      const rankingsResult = await teamSeasonRankingsService.recalculateAllSeasons()
      result.steps.rebuildRankings = {
        success: rankingsResult.success,
        message: rankingsResult.message,
        totalUpdated: rankingsResult.totalUpdated,
      }
      if (!rankingsResult.success) {
        result.message = `Error reconstruyendo rankings: ${rankingsResult.message}`
        return result
      }

      result.success = true
      result.message = `Actualización completada: ${regenerateResult.seasons.length} temporadas, ${rankingsResult.totalUpdated} registros de ranking`

      await rankingStateService.markRankingClean()
      console.log('🎉 Actualización inteligente finalizada')
      return result
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      console.error('❌ Error en actualización inteligente:', error)
      result.message = `Error crítico: ${message}`
      return result
    }
  },

  /** Alias de compatibilidad */
  async updateCompleteRankingSystem(): Promise<UpdateResult> {
    return rankingUpdateService.rebuildEverything()
  },

  /**
   * Solo reconstruye team_season_rankings desde puntos ya guardados
   */
  async syncCurrentRankingsOnly(): Promise<{ success: boolean; message: string }> {
    console.log('🏆 Reconstruyendo rankings desde team_season_points...')

    try {
      const result = await teamSeasonRankingsService.recalculateAllSeasons()

      if (result.success) {
        return {
          success: true,
          message: `${result.totalUpdated} registros de ranking reconstruidos`,
        }
      }
      return { success: false, message: result.message }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, message: `Error: ${message}` }
    }
  },

  /**
   * Solo recalcula y guarda coeficientes regionales de todas las temporadas
   */
  async recalculateRegionalCoefficientsOnly(): Promise<{
    success: boolean
    message: string
    totalSaved: number
  }> {
    try {
      const results = await seasonService.backfillRegionalCoefficients()
      const totalSaved = results.reduce((sum, r) => sum + r.count, 0)
      return {
        success: true,
        message: `${totalSaved} coeficientes guardados`,
        totalSaved,
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      return { success: false, message, totalSaved: 0 }
    }
  },
}

export default rankingUpdateService
