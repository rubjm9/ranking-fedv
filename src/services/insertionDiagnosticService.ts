/**
 * Servicio de diagnóstico específico para el problema de inserción de rankings
 */

import { supabase } from './supabaseService'

const insertionDiagnosticService = {
  /**
   * Probar la inserción de rankings paso a paso
   */
  testRankingInsertion: async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log('🧪 Probando inserción de rankings...')

      // 1. Verificar estado actual de current_rankings
      const { data: currentRankings, error: currentError } = await supabase
        .from('current_rankings')
        .select('*')
        .limit(5)

      console.log('📊 Rankings actuales en BD:', currentRankings)
      console.log('❌ Error al obtener rankings:', currentError)

      // 2. Limpiar tabla
      console.log('🗑️ Limpiando tabla current_rankings...')
      const { error: deleteError } = await supabase
        .from('current_rankings')
        .delete()
        .not('id', 'is', null)

      if (deleteError) {
        console.error('❌ Error al limpiar:', deleteError)
        return { success: false, error: deleteError.message }
      }

      console.log('✅ Tabla limpiada exitosamente')

      // 3. Crear datos de prueba para inserción
      const testRankingData = [
        {
          team_id: 'test-team-1',
          team_name: 'Equipo Prueba 1',
          ranking_category: 'beach_open',
          current_season_points: 1000,
          previous_season_points: 0,
          two_seasons_ago_points: 0,
          three_seasons_ago_points: 0,
          total_points: 1000,
          ranking_position: 1,
          last_calculated: new Date().toISOString(),
          regional_coefficient: 1.0
        },
        {
          team_id: 'test-team-2',
          team_name: 'Equipo Prueba 2',
          ranking_category: 'beach_open',
          current_season_points: 800,
          previous_season_points: 0,
          two_seasons_ago_points: 0,
          three_seasons_ago_points: 0,
          total_points: 800,
          ranking_position: 2,
          last_calculated: new Date().toISOString(),
          regional_coefficient: 1.0
        }
      ]

      // 4. Intentar insertar datos de prueba
      console.log('💾 Insertando datos de prueba...')
      const { data: insertedData, error: insertError } = await supabase
        .from('current_rankings')
        .insert(testRankingData)
        .select()

      if (insertError) {
        console.error('❌ Error al insertar:', insertError)
        return { success: false, error: insertError.message }
      }

      console.log('✅ Datos insertados exitosamente:', insertedData)

      // 5. Verificar que se insertaron
      const { data: verifyData, error: verifyError } = await supabase
        .from('current_rankings')
        .select('*')
        .eq('team_id', 'test-team-1')

      console.log('🔍 Verificación de inserción:', verifyData)
      console.log('❌ Error en verificación:', verifyError)

      // 6. Limpiar datos de prueba
      await supabase
        .from('current_rankings')
        .delete()
        .eq('team_id', 'test-team-1')

      return {
        success: true,
        message: 'Inserción de prueba exitosa',
        insertedCount: insertedData?.length || 0,
        verificationCount: verifyData?.length || 0
      }

    } catch (error) {
      console.error('Error en prueba de inserción:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Verificar estructura de la tabla current_rankings
   */
  checkTableStructure: async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log('🔍 Verificando estructura de tabla current_rankings...')

      // Intentar obtener información de la tabla
      const { data, error } = await supabase
        .from('current_rankings')
        .select('*')
        .limit(1)

      if (error) {
        console.error('❌ Error al acceder a la tabla:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Tabla accesible, estructura:', data)

      return { success: true, structure: data }

    } catch (error) {
      console.error('Error al verificar estructura:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Probar inserción con datos reales del cálculo manual
   */
  testRealDataInsertion: async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log('🧪 Probando inserción con datos reales...')

      // Obtener datos reales de posiciones
      const { data: positions, error: positionsError } = await supabase
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
        // Sin limit para obtener todas las posiciones

      if (positionsError) {
        console.error('Error al obtener posiciones:', positionsError)
        return { success: false, error: positionsError.message }
      }

      if (!positions || positions.length === 0) {
        return { success: false, error: 'No hay posiciones para procesar' }
      }

      // Procesar datos como en el cálculo manual
      const teamPoints: { [key: string]: { [key: string]: { [key: number]: number } } } = {}

      positions.forEach(position => {
        const tournament = position.tournaments
        const team = position.teams
        
        if (!tournament || !team || !tournament.surface || !tournament.modality || !tournament.year) {
          return
        }

        const category = `${tournament.surface.toLowerCase()}_${tournament.modality.toLowerCase()}`
        const teamKey = team.id
        const yearKey = tournament.year

        if (!teamPoints[teamKey]) {
          teamPoints[teamKey] = {}
        }
        if (!teamPoints[teamKey][category]) {
          teamPoints[teamKey][category] = {}
        }
        if (!teamPoints[teamKey][category][yearKey]) {
          teamPoints[teamKey][category][yearKey] = 0
        }

        teamPoints[teamKey][category][yearKey] += position.points || 0
      })

      // Crear datos de ranking para inserción
      const rankingEntries = []
      const categories = new Set()
      
      Object.values(teamPoints).forEach(teamData => {
        Object.keys(teamData).forEach(category => {
          categories.add(category)
        })
      })

      Array.from(categories).forEach(category => {
        const categoryTeams = []
        
        Object.keys(teamPoints).forEach(teamId => {
          const teamCategoryPoints = teamPoints[teamId][category]
          
          if (!teamCategoryPoints || Object.keys(teamCategoryPoints).length === 0) {
            return
          }

          let totalPoints = 0
          Object.values(teamCategoryPoints).forEach(yearPoints => {
            totalPoints += yearPoints as number
          })

          if (totalPoints > 0) {
            categoryTeams.push({
              teamId,
              category,
              totalPoints
            })
          }
        })

        // Ordenar y asignar posiciones
        categoryTeams.sort((a, b) => b.totalPoints - a.totalPoints)
        
        categoryTeams.forEach((team, index) => {
          rankingEntries.push({
            team_id: team.teamId,
            ranking_category: category,
            current_season_points: team.totalPoints,
            previous_season_points: 0,
            two_seasons_ago_points: 0,
            three_seasons_ago_points: 0,
            total_points: team.totalPoints,
            ranking_position: index + 1,
            last_calculated: new Date().toISOString()
            // Sin team_name ni regional_coefficient
          })
        })
      })

      console.log(`📊 Datos preparados para inserción: ${rankingEntries.length} entradas`)

      // Limpiar tabla
      await supabase
        .from('current_rankings')
        .delete()
        .not('id', 'is', null)

      // Insertar datos reales
      const { data: insertedData, error: insertError } = await supabase
        .from('current_rankings')
        .insert(rankingEntries)
        .select()

      if (insertError) {
        console.error('❌ Error al insertar datos reales:', insertError)
        return { success: false, error: insertError.message }
      }

      console.log('✅ Datos reales insertados exitosamente')

      // Verificar inserción
      const { data: verifyData, error: verifyError } = await supabase
        .from('current_rankings')
        .select('*')
        .limit(5)

      console.log('🔍 Verificación de datos reales:', verifyData)

      return {
        success: true,
        message: 'Inserción de datos reales exitosa',
        insertedCount: insertedData?.length || 0,
        verificationCount: verifyData?.length || 0,
        categories: Array.from(categories)
      }

    } catch (error) {
      console.error('Error en inserción de datos reales:', error)
      return { success: false, error: error.message }
    }
  }
}

export default insertionDiagnosticService
