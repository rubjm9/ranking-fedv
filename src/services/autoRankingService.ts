import { supabase } from './supabaseService'
import rankingService from './rankingService'
import toast from 'react-hot-toast'

/**
 * Servicio para recálculo automático de rankings
 * Se activa cuando se modifican posiciones de torneos
 */
export class AutoRankingService {
  /**
   * Recalcula automáticamente los rankings cuando se modifican posiciones
   * @param tournamentId ID del torneo modificado
   * @param surface Superficie del torneo (beach/grass)
   * @param modality Modalidad del torneo (open/women/mixed)
   */
  static async recalculateRankingForTournament(
    tournamentId: string, 
    surface: string, 
    modality: string
  ): Promise<void> {
    try {
      console.log(`🔄 Recálculo automático iniciado para torneo ${tournamentId} (${surface}_${modality})`)
      
      // Obtener información del torneo
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('id, surface, modality, year')
        .eq('id', tournamentId)
        .single()

      if (tournamentError || !tournament) {
        console.error('❌ Error al obtener información del torneo:', tournamentError)
        return
      }

      // Verificar si el torneo tiene posiciones
      const { data: positions, error: positionsError } = await supabase
        .from('positions')
        .select('id')
        .eq('tournamentId', tournamentId)
        .limit(1)

      if (positionsError) {
        console.error('❌ Error al verificar posiciones:', positionsError)
        return
      }

      if (!positions || positions.length === 0) {
        console.log('ℹ️ Torneo sin posiciones, no se recalcula ranking')
        return
      }

      // Determinar la categoría afectada
      const category = `${tournament.surface.toLowerCase()}_${tournament.modality.toLowerCase()}`
      
      console.log(`📊 Recalculando ranking para categoría: ${category}`)

      // Recalcular solo la categoría específica
      await this.recalculateSpecificCategory(category)

      console.log(`✅ Recálculo automático completado para ${category}`)
      
      // Mostrar notificación de éxito
      toast.success(`Ranking de ${category.replace('_', ' ')} actualizado automáticamente`, {
        duration: 3000,
        position: 'top-right'
      })

    } catch (error) {
      console.error('❌ Error en recálculo automático:', error)
      
      // Mostrar notificación de error
      toast.error('Error al actualizar ranking automáticamente', {
        duration: 4000,
        position: 'top-right'
      })
      
      // No lanzar el error para no interrumpir el flujo principal
    }
  }

  /**
   * Recalcula una categoría específica de ranking
   * @param category Categoría a recalcular (ej: beach_open, grass_mixed)
   */
  private static async recalculateSpecificCategory(category: string): Promise<void> {
    try {
      // Obtener todas las posiciones de la categoría
      const { data: positions, error } = await supabase
        .from('positions')
        .select(`
          position,
          points,
          teamId,
          tournaments:tournamentId (
            id,
            year,
            surface,
            modality
          )
        `)
        .eq('tournaments.surface', category.split('_')[0].toUpperCase())
        .eq('tournaments.modality', category.split('_')[1].toUpperCase())

      if (error) {
        console.error('❌ Error al obtener posiciones:', error)
        return
      }

      if (!positions || positions.length === 0) {
        console.log(`ℹ️ No hay posiciones para la categoría ${category}`)
        return
      }

      // Usar el método de recálculo existente pero solo para esta categoría
      await rankingService.recalculateRankingAlternative()

    } catch (error) {
      console.error(`❌ Error al recalcular categoría ${category}:`, error)
    }
  }

  /**
   * Recalcula rankings cuando se crea un nuevo torneo con posiciones
   * @param tournamentId ID del nuevo torneo
   */
  static async onTournamentCreated(tournamentId: string): Promise<void> {
    try {
      const { data: tournament, error } = await supabase
        .from('tournaments')
        .select('id, surface, modality')
        .eq('id', tournamentId)
        .single()

      if (error || !tournament) {
        console.error('❌ Error al obtener torneo creado:', error)
        return
      }

      // Verificar si ya tiene posiciones
      const { data: positions } = await supabase
        .from('positions')
        .select('id')
        .eq('tournamentId', tournamentId)
        .limit(1)

      if (positions && positions.length > 0) {
        await this.recalculateRankingForTournament(
          tournamentId,
          tournament.surface,
          tournament.modality
        )
      }

    } catch (error) {
      console.error('❌ Error en recálculo por torneo creado:', error)
    }
  }

  /**
   * Recalcula rankings cuando se modifican posiciones de un torneo
   * @param tournamentId ID del torneo modificado
   */
  static async onPositionsUpdated(tournamentId: string): Promise<void> {
    try {
      const { data: tournament, error } = await supabase
        .from('tournaments')
        .select('id, surface, modality')
        .eq('id', tournamentId)
        .single()

      if (error || !tournament) {
        console.error('❌ Error al obtener torneo modificado:', error)
        return
      }

      await this.recalculateRankingForTournament(
        tournamentId,
        tournament.surface,
        tournament.modality
      )

    } catch (error) {
      console.error('❌ Error en recálculo por posiciones actualizadas:', error)
    }
  }

  /**
   * Recalcula rankings cuando se eliminan posiciones de un torneo
   * @param tournamentId ID del torneo afectado
   */
  static async onPositionsDeleted(tournamentId: string): Promise<void> {
    try {
      const { data: tournament, error } = await supabase
        .from('tournaments')
        .select('id, surface, modality')
        .eq('id', tournamentId)
        .single()

      if (error || !tournament) {
        console.error('❌ Error al obtener torneo afectado:', error)
        return
      }

      await this.recalculateRankingForTournament(
        tournamentId,
        tournament.surface,
        tournament.modality
      )

    } catch (error) {
      console.error('❌ Error en recálculo por posiciones eliminadas:', error)
    }
  }
}

export const autoRankingService = AutoRankingService
