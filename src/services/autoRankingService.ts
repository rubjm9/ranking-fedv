/**
 * Servicio de actualización automática de rankings
 */

export class AutoRankingService {
  /**
   * Actualizar ranking cuando se modifican posiciones
   */
  static async onPositionsUpdated(tournamentId: string, category: string) {
    console.log(`🔄 Actualizando ranking automáticamente para ${category}...`)
    
    try {
      // Importar dinámicamente para evitar dependencias circulares
      const { hybridRankingService } = await import('./hybridRankingService')
      
      // Actualizar el ranking híbrido
      await hybridRankingService.updateSeasonPointsForCategory(category)
      
      console.log('✅ Ranking actualizado automáticamente')
      return { success: true, message: 'Ranking actualizado' }
    } catch (error) {
      console.error('❌ Error actualizando ranking automáticamente:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Recalcular ranking completo
   */
  static async recalculateAllRankings() {
    console.log('🔄 Recalculando todos los rankings...')
    
    try {
      const categories = ['beach_mixed', 'beach_open', 'beach_women', 'grass_mixed', 'grass_open', 'grass_women']
      
      for (const category of categories) {
        await this.onPositionsUpdated('', category)
      }
      
      console.log('✅ Todos los rankings recalculados')
      return { success: true, message: 'Rankings recalculados' }
    } catch (error) {
      console.error('❌ Error recalculando rankings:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Validar integridad del sistema
   */
  static async validateSystemIntegrity() {
    console.log('🔍 Validando integridad del sistema...')
    
    try {
      // Importar servicios necesarios
      const { supabase } = await import('./supabaseService')
      
      // Verificar datos básicos
      const { data: teams } = await supabase.from('teams').select('id').limit(1)
      const { data: positions } = await supabase.from('positions').select('teamId').limit(1)
      const { data: rankings } = await supabase.from('current_rankings').select('team_id').limit(1)
      
      const isValid = teams && positions && rankings
      
      return {
        success: isValid,
        message: isValid ? 'Sistema válido' : 'Problemas de integridad detectados',
        teams: teams?.length || 0,
        positions: positions?.length || 0,
        rankings: rankings?.length || 0
      }
    } catch (error) {
      console.error('❌ Error validando integridad:', error)
      return { success: false, error: error.message }
    }
  }
}
