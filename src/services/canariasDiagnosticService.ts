/**
 * Servicio de diagnóstico específico para el torneo regional de Canarias
 */

import { supabase } from './supabaseService'

const canariasDiagnosticService = {
  /**
   * Diagnosticar por qué falta el torneo regional de Canarias en beach_mixed
   */
  diagnoseCanariasTournament: async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log('🔍 Diagnosticando torneo regional de Canarias...')

      // 1. Buscar todos los torneos de Canarias
      const { data: canariasTournaments, error: canariasError } = await supabase
        .from('tournaments')
        .select('*')
        .ilike('name', '%canarias%')

      console.log('🏝️ Torneos de Canarias encontrados:', canariasTournaments)
      console.log('❌ Error al buscar Canarias:', canariasError)

      // 2. Buscar específicamente torneos de playa mixto
      const { data: beachMixedTournaments, error: beachMixedError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('surface', 'BEACH')
        .eq('modality', 'MIXED')

      console.log('🏖️ Todos los torneos de playa mixto:', beachMixedTournaments)
      console.log('❌ Error al buscar playa mixto:', beachMixedError)

      // 3. Buscar posiciones de torneos de Canarias
      const { data: canariasPositions, error: positionsError } = await supabase
        .from('positions')
        .select(`
          *,
          tournaments:tournamentId(
            id,
            name,
            type,
            year,
            surface,
            modality
          ),
          teams:teamId(
            id,
            name,
            regionId
          )
        `)
        .ilike('tournaments.name', '%canarias%')

      console.log('📊 Posiciones de Canarias:', canariasPositions)
      console.log('❌ Error al buscar posiciones de Canarias:', positionsError)

      // 4. Verificar si hay torneos de playa mixto de Canarias
      const canariasBeachMixed = beachMixedTournaments?.filter(t => 
        t.name.toLowerCase().includes('canarias')
      ) || []

      console.log('🏖️ Torneos de playa mixto de Canarias:', canariasBeachMixed)

      // 5. Verificar si hay posiciones para esos torneos
      const canariasBeachMixedPositions = canariasPositions?.filter(pos => 
        pos.tournaments?.surface === 'BEACH' && 
        pos.tournaments?.modality === 'MIXED'
      ) || []

      console.log('📊 Posiciones de playa mixto de Canarias:', canariasBeachMixedPositions)

      // 6. Verificar nombres exactos
      const allTournamentNames = beachMixedTournaments?.map(t => t.name) || []
      console.log('📝 Nombres exactos de todos los torneos de playa mixto:')
      allTournamentNames.forEach((name, index) => {
        console.log(`  ${index + 1}. "${name}"`)
      })

      // 7. Buscar variaciones del nombre "Canarias"
      const canariasVariations = ['canarias', 'canaria', 'canary', 'islas']
      const possibleCanariasTournaments = beachMixedTournaments?.filter(t => 
        canariasVariations.some(variation => 
          t.name.toLowerCase().includes(variation)
        )
      ) || []

      console.log('🔍 Posibles torneos de Canarias (variaciones):', possibleCanariasTournaments)

      return {
        success: true,
        canariasTournaments: canariasTournaments || [],
        beachMixedTournaments: beachMixedTournaments || [],
        canariasPositions: canariasPositions || [],
        canariasBeachMixed: canariasBeachMixed,
        canariasBeachMixedPositions: canariasBeachMixedPositions,
        allTournamentNames: allTournamentNames,
        possibleCanariasTournaments: possibleCanariasTournaments,
        errors: {
          canarias: canariasError,
          beachMixed: beachMixedError,
          positions: positionsError
        }
      }

    } catch (error) {
      console.error('Error en diagnóstico de Canarias:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Verificar si existe un torneo regional de playa mixto de Canarias
   */
  checkCanariasBeachMixedExists: async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      // Buscar torneos que contengan "canarias" y sean de playa mixto
      const { data: tournaments, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('surface', 'BEACH')
        .eq('modality', 'MIXED')
        .or('name.ilike.%canarias%,name.ilike.%canaria%,name.ilike.%canary%')

      if (error) {
        console.error('Error al buscar torneos de Canarias:', error)
        return { success: false, error: error.message }
      }

      console.log('🏝️ Torneos de playa mixto de Canarias encontrados:', tournaments)

      // Verificar si hay posiciones para estos torneos
      if (tournaments && tournaments.length > 0) {
        const tournamentIds = tournaments.map(t => t.id)
        
        const { data: positions, error: positionsError } = await supabase
          .from('positions')
          .select('*')
          .in('tournamentId', tournamentIds)

        console.log('📊 Posiciones para torneos de Canarias:', positions)
        console.log('❌ Error al buscar posiciones:', positionsError)

        return {
          success: true,
          tournaments: tournaments,
          positions: positions || [],
          hasPositions: (positions?.length || 0) > 0
        }
      }

      return {
        success: true,
        tournaments: [],
        positions: [],
        hasPositions: false
      }

    } catch (error) {
      console.error('Error al verificar Canarias:', error)
      return { success: false, error: error.message }
    }
  }
}

export default canariasDiagnosticService
