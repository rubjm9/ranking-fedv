/**
 * Servicio unificado para actualizar rankings
 * Centraliza todas las operaciones de actualización en una sola función
 */

import seasonPointsService from './seasonPointsService'
import teamSeasonRankingsService from './teamSeasonRankingsService'

export interface UpdateResult {
  success: boolean
  message: string
  steps: {
    regenerateSeasons: { success: boolean; message: string; seasons: string[] }
    rebuildRankings: { success: boolean; message: string; totalUpdated: number }
  }
}

const rankingUpdateService = {
  /**
   * Función principal: Actualiza completamente el sistema de rankings
   * 1. Recalcula los puntos de todas las posiciones con la curva vigente
   * 2. Regenera todas las temporadas en team_season_points
   * 3. Reconstruye team_season_rankings (fuente de verdad del ranking público)
   */
  async updateCompleteRankingSystem(): Promise<UpdateResult> {
    console.log('🚀 Iniciando actualización completa del sistema de rankings...')

    const result: UpdateResult = {
      success: false,
      message: '',
      steps: {
        regenerateSeasons: { success: false, message: '', seasons: [] },
        rebuildRankings: { success: false, message: '', totalUpdated: 0 }
      }
    }

    try {
      // PASO 0: Recalcular puntos de todas las posiciones con la curva vigente
      // (regenerateAllSeasons solo suma puntos ya guardados, así que esto va primero)
      console.log('🧮 Paso 0: Recalculando puntos de posiciones con la curva vigente...')
      const recomputeResult = await seasonPointsService.recomputeAllPositionPoints()
      if (!recomputeResult.success) {
        result.message = `Error recalculando puntos de posiciones: ${recomputeResult.message}`
        return result
      }
      console.log(`✅ ${recomputeResult.updated} posiciones recalculadas`)

      // PASO 1: Regenerar todas las temporadas (team_season_points)
      console.log('📅 Paso 1: Regenerando todas las temporadas...')
      const regenerateResult = await seasonPointsService.regenerateAllSeasons()

      result.steps.regenerateSeasons = {
        success: regenerateResult.success,
        message: regenerateResult.message,
        seasons: regenerateResult.seasons
      }

      if (!regenerateResult.success) {
        result.message = `Error en regeneración: ${regenerateResult.message}`
        return result
      }

      console.log(`✅ Temporadas regeneradas: ${regenerateResult.seasons.join(', ')}`)

      // PASO 2: Reconstruir los rankings históricos (team_season_rankings)
      // Esta es la tabla que lee la web pública (incluye cambios de posición).
      console.log('🏆 Paso 2: Reconstruyendo rankings históricos...')
      const rankingsResult = await teamSeasonRankingsService.recalculateAllSeasons()

      result.steps.rebuildRankings = {
        success: rankingsResult.success,
        message: rankingsResult.message,
        totalUpdated: rankingsResult.totalUpdated
      }

      if (!rankingsResult.success) {
        result.message = `Error reconstruyendo rankings: ${rankingsResult.message}`
        return result
      }

      // Resultado final
      result.success = result.steps.regenerateSeasons.success && result.steps.rebuildRankings.success

      if (result.success) {
        result.message = `✅ Actualización completa exitosa: ${regenerateResult.seasons.length} temporadas regeneradas, ${rankingsResult.totalUpdated} registros de ranking reconstruidos`
      } else {
        result.message = `⚠️ Actualización parcial: ${regenerateResult.message} | ${result.steps.rebuildRankings.message}`
      }

      console.log('🎉 Actualización completa finalizada:', result.message)
      return result

    } catch (error: any) {
      console.error('❌ Error en actualización completa:', error)
      result.message = `Error crítico: ${error.message || 'Error desconocido'}`
      return result
    }
  },

  /**
   * Función rápida: Reconstruye solo los rankings (team_season_rankings) desde
   * los puntos ya almacenados en team_season_points, sin recomputar posiciones
   * ni puntos. Útil cuando team_season_points ya está correcto y solo hay que
   * reordenar los rankings.
   */
  async syncCurrentRankingsOnly(): Promise<{ success: boolean; message: string }> {
    console.log('🏆 Reconstruyendo rankings desde team_season_points...')

    try {
      const result = await teamSeasonRankingsService.recalculateAllSeasons()

      if (result.success) {
        return {
          success: true,
          message: `✅ ${result.totalUpdated} registros de ranking reconstruidos`
        }
      } else {
        return {
          success: false,
          message: `⚠️ ${result.message}`
        }
      }

    } catch (error: any) {
      console.error('❌ Error en reconstrucción de rankings:', error)
      return {
        success: false,
        message: `Error: ${error.message || 'Error desconocido'}`
      }
    }
  }
}

export default rankingUpdateService
