/**
 * Servicio unificado para actualizar rankings
 * Centraliza todas las operaciones de actualización en una sola función
 */

import seasonPointsService from './seasonPointsService'
import hybridRankingService from './hybridRankingService'

export interface UpdateResult {
  success: boolean
  message: string
  steps: {
    regenerateSeasons: { success: boolean; message: string; seasons: string[] }
    syncRankings: { success: boolean; message: string; categories: string[] }
  }
}

const rankingUpdateService = {
  /**
   * Función principal: Actualiza completamente el sistema de rankings
   * 1. Regenera todas las temporadas desde positions
   * 2. Sincroniza current_rankings desde team_season_points
   */
  async updateCompleteRankingSystem(): Promise<UpdateResult> {
    console.log('🚀 Iniciando actualización completa del sistema de rankings...')
    
    const result: UpdateResult = {
      success: false,
      message: '',
      steps: {
        regenerateSeasons: { success: false, message: '', seasons: [] },
        syncRankings: { success: false, message: '', categories: [] }
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

      // PASO 1: Regenerar todas las temporadas
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

      // PASO 2: Sincronizar rankings para todas las categorías
      console.log('🔄 Paso 2: Sincronizando rankings actuales...')
      
      const categories: (keyof typeof hybridRankingService.CategoryPointsMap)[] = [
        'beach_mixed', 'beach_women', 'beach_open',
        'grass_mixed', 'grass_women', 'grass_open'
      ]

      const syncResults = []
      const currentSeason = '2024-25' // Temporada de referencia actual

      for (const category of categories) {
        try {
          console.log(`🔄 Sincronizando ${category}...`)
          const syncResult = await hybridRankingService.syncWithCurrentRankings(category, currentSeason)
          syncResults.push({ category, ...syncResult })
        } catch (error: any) {
          console.error(`❌ Error sincronizando ${category}:`, error)
          syncResults.push({ 
            category, 
            success: false, 
            message: error.message || 'Error desconocido' 
          })
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

      // Resultado final
      result.success = result.steps.regenerateSeasons.success && result.steps.syncRankings.success
      
      if (result.success) {
        result.message = `✅ Actualización completa exitosa: ${regenerateResult.seasons.length} temporadas regeneradas, ${successfulSyncs.length} categorías sincronizadas`
      } else {
        result.message = `⚠️ Actualización parcial: ${regenerateResult.message} | ${result.steps.syncRankings.message}`
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
