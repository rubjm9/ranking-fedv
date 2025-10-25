/**
 * Servicio simplificado para cálculo dinámico de rankings globales
 * Actualizado para usar el nuevo sistema team_season_rankings
 */

import { supabase } from './supabaseService'
import teamSeasonRankingsService from './teamSeasonRankingsService'

export interface DynamicRankingEntry {
  team_id: string
  team_name: string
  region_name: string
  total_points: number
  rank: number
  breakdown: {
    beach_mixed_points: number
    beach_open_points: number
    beach_women_points: number
    grass_mixed_points: number
    grass_open_points: number
    grass_women_points: number
  }
}

const dynamicRankingService = {
  /**
   * Obtener historial de ranking global para gráficas
   * Usa el nuevo sistema team_season_rankings
   */
  getGlobalRankingHistory: async (teamId?: string): Promise<any[]> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log('🔄 Obteniendo historial de ranking global desde team_season_rankings...')

      // Obtener todas las temporadas únicas
      const { data: seasonData, error: seasonError } = await supabase
        .from('team_season_rankings')
        .select('season')
        .order('season', { ascending: false })

      if (seasonError) {
        console.error('Error obteniendo temporadas:', seasonError)
        return []
      }

      const uniqueSeasons = [...new Set((seasonData || []).map((s: any) => s.season))]
      console.log(`📅 Temporadas encontradas: ${uniqueSeasons.length}`)

      if (uniqueSeasons.length === 0) {
        console.log('⚠️ No hay datos en team_season_rankings. Ejecuta la migración primero.')
        return []
      }

      const historyData: any[] = []

      // Para cada temporada, obtener el ranking global
      for (const season of uniqueSeasons) {
        try {
          // Obtener datos de la temporada
          let query = supabase
            .from('team_season_rankings')
            .select(`
              team_id,
              season,
              beach_mixed_points,
              beach_open_points,
              beach_women_points,
              grass_mixed_points,
              grass_open_points,
              grass_women_points,
              teams(name, region:regions(name))
            `)
            .eq('season', season)

          if (teamId) {
            query = query.eq('team_id', teamId)
          }

          const { data: seasonRankings, error } = await query

          if (error) {
            console.error(`Error obteniendo datos de ${season}:`, error)
            continue
          }

          if (!seasonRankings || seasonRankings.length === 0) {
            continue
          }

          // Calcular puntos globales para cada equipo
          const teamGlobalPoints = seasonRankings.map((row: any) => {
            const totalPoints = (row.beach_mixed_points || 0) + 
                              (row.beach_open_points || 0) + 
                              (row.beach_women_points || 0) + 
                              (row.grass_mixed_points || 0) + 
                              (row.grass_open_points || 0) + 
                              (row.grass_women_points || 0)

            return {
              team_id: row.team_id,
              team_name: row.teams?.name || 'Equipo desconocido',
              total_points: totalPoints
            }
          })

          // Ordenar por puntos y asignar rankings
          teamGlobalPoints.sort((a, b) => b.total_points - a.total_points)

          if (teamId) {
            // Buscar el equipo específico
            const teamIndex = teamGlobalPoints.findIndex(t => t.team_id === teamId)
            if (teamIndex >= 0) {
              const team = teamGlobalPoints[teamIndex]
              historyData.push({
                date: `${parseInt(season.split('-')[0])}-12-31`,
                season: season,
                category: 'global',
                rank: teamIndex + 1,
                points: team.total_points
              })
            }
          } else {
            // Agregar todos los equipos
            teamGlobalPoints.forEach((team, index) => {
              if (team.total_points > 0) {
                historyData.push({
                  date: `${parseInt(season.split('-')[0])}-12-31`,
                  season: season,
                  team_id: team.team_id,
                  team_name: team.team_name,
                  rank: index + 1,
                  points: team.total_points
                })
              }
            })
          }
        } catch (error) {
          console.warn(`⚠️ Error procesando temporada ${season}:`, error)
        }
      }

      console.log(`✅ Historial obtenido: ${historyData.length} puntos de datos`)
      return historyData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    } catch (error) {
      console.error('❌ Error obteniendo historial de ranking global:', error)
      return []
    }
  },

  /**
   * Calcular ranking global actual
   * Usa el nuevo sistema team_season_rankings
   */
  calculateCurrentGlobalRanking: async (): Promise<DynamicRankingEntry[]> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log('🔄 Calculando ranking global actual desde team_season_rankings...')

      // Determinar temporada actual
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear()
      const currentMonth = currentDate.getMonth() + 1
      
      let currentSeason: string
      if (currentMonth >= 7) {
        currentSeason = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
      } else {
        currentSeason = `${currentYear - 1}-${currentYear.toString().slice(-2)}`
      }

      console.log(`📅 Temporada actual: ${currentSeason}`)

      // Obtener datos de la temporada actual
      const { data: seasonData, error } = await supabase
        .from('team_season_rankings')
        .select(`
          team_id,
          season,
          beach_mixed_points,
          beach_open_points,
          beach_women_points,
          grass_mixed_points,
          grass_open_points,
          grass_women_points,
          teams(name, region:regions(name))
        `)
        .eq('season', currentSeason)

      if (error) {
        console.error('❌ Error obteniendo datos de temporada actual:', error)
        throw error
      }

      if (!seasonData || seasonData.length === 0) {
        console.log('⚠️ No hay datos para la temporada actual en team_season_rankings')
        return []
      }

      // Calcular puntos totales para cada equipo
      const teamRankings = seasonData.map((team: any) => {
        const totalPoints = (team.beach_mixed_points || 0) + 
                          (team.beach_open_points || 0) + 
                          (team.beach_women_points || 0) + 
                          (team.grass_mixed_points || 0) + 
                          (team.grass_open_points || 0) + 
                          (team.grass_women_points || 0)

        return {
          team_id: team.team_id,
          team_name: team.teams?.name || 'Equipo desconocido',
          region_name: team.teams?.region?.name || 'Sin región',
          total_points: totalPoints,
          rank: 0, // Se asignará después
          breakdown: {
            beach_mixed_points: team.beach_mixed_points || 0,
            beach_open_points: team.beach_open_points || 0,
            beach_women_points: team.beach_women_points || 0,
            grass_mixed_points: team.grass_mixed_points || 0,
            grass_open_points: team.grass_open_points || 0,
            grass_women_points: team.grass_women_points || 0
          }
        }
      })

      // Ordenar por puntos totales y asignar rankings
      teamRankings.sort((a, b) => b.total_points - a.total_points)
      teamRankings.forEach((team, index) => {
        team.rank = index + 1
      })

      console.log(`✅ Ranking global calculado: ${teamRankings.length} equipos`)
      return teamRankings.filter(team => team.total_points > 0)

    } catch (error) {
      console.error('❌ Error calculando ranking global actual:', error)
      return []
    }
  }
}

export default dynamicRankingService
