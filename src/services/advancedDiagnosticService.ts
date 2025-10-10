/**
 * Servicio de diagnóstico avanzado para identificar problemas específicos
 */

import { supabase } from './supabaseService'

const advancedDiagnosticService = {
  /**
   * Diagnóstico detallado del proceso de cálculo de rankings
   */
  getDetailedCalculationDiagnostic: async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log('🔍 Iniciando diagnóstico detallado del cálculo...')

      // 1. Verificar estructura de datos de posiciones
      const { data: positions, error: positionsError } = await supabase
        .from('positions')
        .select(`
          id,
          position,
          points,
          teamId,
          tournamentId,
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
        .limit(5)

      console.log('📊 Muestra de posiciones:', positions)
      console.log('❌ Error posiciones:', positionsError)

      // 2. Verificar estructura de torneos
      const { data: tournaments, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('id, name, type, year, surface, modality')
        .limit(5)

      console.log('🏆 Muestra de torneos:', tournaments)
      console.log('❌ Error torneos:', tournamentsError)

      // 3. Verificar estructura de equipos
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, regionId')
        .limit(5)

      console.log('👥 Muestra de equipos:', teams)
      console.log('❌ Error equipos:', teamsError)

      // 4. Verificar si hay datos de rankings actuales
      const { data: currentRankings, error: rankingsError } = await supabase
        .from('current_rankings')
        .select('*')
        .limit(5)

      console.log('📈 Rankings actuales:', currentRankings)
      console.log('❌ Error rankings:', rankingsError)

      // 5. Verificar estructura de regiones
      const { data: regions, error: regionsError } = await supabase
        .from('regions')
        .select('id, name, coefficient')
        .limit(5)

      console.log('🗺️ Muestra de regiones:', regions)
      console.log('❌ Error regiones:', regionsError)

      // 6. Probar agrupación manual
      if (positions && positions.length > 0) {
        console.log('🧮 Probando agrupación manual...')
        
        const groupedData: { [key: string]: any } = {}
        
        positions.forEach(pos => {
          const tournament = pos.tournaments
          const team = pos.teams
          
          if (!tournament || !team) {
            console.warn('⚠️ Posición sin torneo o equipo:', pos)
            return
          }

          const category = `${tournament.surface?.toLowerCase()}_${tournament.modality?.toLowerCase()}`
          const teamKey = team.id
          const yearKey = tournament.year

          if (!groupedData[teamKey]) {
            groupedData[teamKey] = {}
          }
          if (!groupedData[teamKey][category]) {
            groupedData[teamKey][category] = {}
          }
          if (!groupedData[teamKey][category][yearKey]) {
            groupedData[teamKey][category][yearKey] = 0
          }

          groupedData[teamKey][category][yearKey] += pos.points || 0
        })

        console.log('📊 Datos agrupados manualmente:', groupedData)

        // 7. Verificar categorías generadas
        const categories = new Set()
        Object.values(groupedData).forEach((teamData: any) => {
          Object.keys(teamData).forEach(category => {
            categories.add(category)
          })
        })

        console.log('🏷️ Categorías detectadas:', Array.from(categories))

        // 8. Verificar si hay datos suficientes para cada categoría
        const categoryStats: { [key: string]: number } = {}
        Object.values(groupedData).forEach((teamData: any) => {
          Object.keys(teamData).forEach(category => {
            categoryStats[category] = (categoryStats[category] || 0) + 1
          })
        })

        console.log('📊 Equipos por categoría:', categoryStats)
      }

      return {
        positions: positions?.slice(0, 3) || [],
        tournaments: tournaments?.slice(0, 3) || [],
        teams: teams?.slice(0, 3) || [],
        regions: regions?.slice(0, 3) || [],
        currentRankings: currentRankings?.slice(0, 3) || [],
        errors: {
          positions: positionsError,
          tournaments: tournamentsError,
          teams: teamsError,
          regions: regionsError,
          rankings: rankingsError
        }
      }

    } catch (error) {
      console.error('Error en diagnóstico detallado:', error)
      throw error
    }
  },

  /**
   * Probar el cálculo de rankings paso a paso
   */
  testRankingCalculation: async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log('🧪 Probando cálculo de rankings paso a paso...')

      // Obtener todas las posiciones
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

      if (positionsError) {
        console.error('Error al obtener posiciones:', positionsError)
        return { success: false, error: positionsError.message }
      }

      if (!positions || positions.length === 0) {
        console.log('⚠️ No hay posiciones para procesar')
        return { success: false, error: 'No hay posiciones' }
      }

      console.log(`📊 Procesando ${positions.length} posiciones...`)

      // Agrupar datos manualmente
      const teamPoints: { [key: string]: { [key: string]: { [key: number]: number } } } = {}

      positions.forEach(position => {
        const tournament = position.tournaments
        const team = position.teams
        
        console.log('🏆 Procesando posición:', {
          position: position.position,
          points: position.points,
          tournament: tournament?.name || 'Sin torneo',
          team: team?.name || 'Sin equipo',
          surface: tournament?.surface,
          modality: tournament?.modality,
          year: tournament?.year
        })

        if (!tournament || !team) {
          console.warn('⚠️ Posición sin torneo o equipo:', position)
          return
        }

        // Verificar que tenga los campos necesarios
        if (!tournament.surface || !tournament.modality || !tournament.year) {
          console.warn('⚠️ Torneo sin campos necesarios:', tournament)
          return
        }

        // Determinar categoría
        const category = `${tournament.surface.toLowerCase()}_${tournament.modality.toLowerCase()}`
        const teamKey = team.id
        const tournamentKey = tournament.id // CAMBIO: Usar ID del torneo en lugar del año

        if (!teamPoints[teamKey]) {
          teamPoints[teamKey] = {}
        }
        if (!teamPoints[teamKey][category]) {
          teamPoints[teamKey][category] = {}
        }
        if (!teamPoints[teamKey][category][tournamentKey]) {
          teamPoints[teamKey][category][tournamentKey] = 0
        }

        teamPoints[teamKey][category][tournamentKey] += position.points || 0
      })

      console.log('📈 Datos agrupados:', teamPoints)

      // Verificar categorías generadas
      const categories = new Set()
      Object.values(teamPoints).forEach(teamData => {
        Object.keys(teamData).forEach(category => {
          categories.add(category)
        })
      })

      console.log('🏷️ Categorías detectadas:', Array.from(categories))

      // DIAGNÓSTICO DETALLADO: Contar torneos por categoría
      const tournamentsByCategory: { [key: string]: Set<string> } = {}
      const tournamentDetails: { [key: string]: any } = {}

      positions.forEach(position => {
        const tournament = position.tournaments
        if (!tournament) return

        const category = `${tournament.surface?.toLowerCase()}_${tournament.modality?.toLowerCase()}`
        const tournamentKey = `${tournament.id}-${tournament.name}`

        if (!tournamentsByCategory[category]) {
          tournamentsByCategory[category] = new Set()
        }
        tournamentsByCategory[category].add(tournamentKey)

        tournamentDetails[tournamentKey] = {
          id: tournament.id,
          name: tournament.name,
          year: tournament.year,
          surface: tournament.surface,
          modality: tournament.modality,
          type: tournament.type
        }
      })

      console.log('\n🏆 TORNEOS POR CATEGORÍA:')
      Object.entries(tournamentsByCategory).forEach(([category, tournaments]) => {
        console.log(`\n${category}: ${tournaments.size} torneos`)
        Array.from(tournaments).forEach(tournamentKey => {
          const details = tournamentDetails[tournamentKey]
          console.log(`  - ${details.name} (${details.year}) - ${details.type}`)
        })
      })

      // DIAGNÓSTICO: Verificar si equipos tienen múltiples torneos
      console.log('\n👥 EQUIPOS CON MÚLTIPLES TORNEOS:')
      Object.entries(teamPoints).forEach(([teamId, teamData]) => {
        Object.entries(teamData).forEach(([category, categoryData]) => {
          const tournamentCount = Object.keys(categoryData).length
          if (tournamentCount > 1) {
            console.log(`\nEquipo ${teamId} en ${category}: ${tournamentCount} torneos`)
            Object.entries(categoryData).forEach(([tournamentId, points]) => {
              // Buscar el torneo en tournamentDetails
              const tournament = Object.values(tournamentDetails).find(t => t.id === tournamentId) || { name: tournamentId, type: 'Unknown' }
              console.log(`  ${tournament.name} (${tournament.type}): ${points} puntos`)
            })
            const total = Object.values(categoryData).reduce((sum, points) => sum + points, 0)
            console.log(`  TOTAL: ${total} puntos`)
          }
        })
      })

      // Calcular rankings para cada categoría
      const categoryRankings: { [key: string]: any[] } = {}

      Array.from(categories).forEach(category => {
        console.log(`\n🏆 Calculando ranking para categoría: ${category}`)
        
        const categoryTeams = []
        
        Object.keys(teamPoints).forEach(teamId => {
          const teamCategoryPoints = teamPoints[teamId][category]
          
          if (!teamCategoryPoints || Object.keys(teamCategoryPoints).length === 0) {
            return
          }

          // Calcular puntos totales (simplificado para prueba)
          let totalPoints = 0
          Object.values(teamCategoryPoints).forEach(yearPoints => {
            totalPoints += yearPoints as number
          })

          if (totalPoints > 0) {
            categoryTeams.push({
              teamId,
              category,
              totalPoints,
              yearBreakdown: teamCategoryPoints
            })
          }
        })

        // Ordenar por puntos
        categoryTeams.sort((a, b) => b.totalPoints - a.totalPoints)
        
        // Asignar posiciones
        categoryTeams.forEach((team, index) => {
          team.rankingPosition = index + 1
        })

        categoryRankings[category] = categoryTeams
        
        console.log(`✅ Ranking ${category}: ${categoryTeams.length} equipos`)
        categoryTeams.slice(0, 3).forEach(team => {
          console.log(`  ${team.rankingPosition}º - Equipo ${team.teamId}: ${team.totalPoints} puntos`)
        })
      })

      return {
        success: true,
        categories: Array.from(categories),
        rankings: categoryRankings,
        totalPositions: positions.length,
        totalTeams: Object.keys(teamPoints).length,
        tournamentsByCategory: Object.fromEntries(
          Object.entries(tournamentsByCategory).map(([category, tournaments]) => [
            category,
            Array.from(tournaments).map(key => tournamentDetails[key])
          ])
        ),
        teamsWithMultipleTournaments: Object.entries(teamPoints).filter(([teamId, teamData]) => {
          return Object.values(teamData).some(categoryData => 
            Object.keys(categoryData).length > 1
          )
        }).length
      }

    } catch (error) {
      console.error('Error en prueba de cálculo:', error)
      return { success: false, error: error.message }
    }
  }
}

export default advancedDiagnosticService
