/**
 * Servicio simplificado para cálculo dinámico de rankings globales
 * Usa datos existentes de team_season_points para evitar consultas complejas
 */

import { supabase } from './supabaseService'

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
   * Obtener historial de ranking global simplificado para gráficas
   */
  getGlobalRankingHistory: async (teamId?: string): Promise<any[]> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log('🔄 Obteniendo historial de ranking global...')

      // Obtener datos históricos directamente desde team_season_points
      const { data: seasonData, error } = await supabase
        .from('team_season_points')
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
        .order('season', { ascending: false })

      if (error) {
        console.error('❌ Error obteniendo datos históricos:', error)
        return []
      }

      if (!seasonData || seasonData.length === 0) {
        console.log('⚠️ No hay datos de temporadas disponibles')
        return []
      }

      // Agrupar por temporada
      const seasonsMap: { [season: string]: any[] } = {}
      seasonData.forEach((row: any) => {
        if (!seasonsMap[row.season]) {
          seasonsMap[row.season] = []
        }
        seasonsMap[row.season].push(row)
      })

      const historyData: any[] = []

      // Para cada temporada, calcular ranking global
      Object.entries(seasonsMap).forEach(([season, teams]) => {
        // Calcular puntos totales para cada equipo
        const teamRankings = teams.map((team: any) => {
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

        // Agregar datos al historial
        if (teamId) {
          // Buscar el equipo específico
          const teamEntry = teamRankings.find(entry => entry.team_id === teamId)
          if (teamEntry && teamEntry.total_points > 0) {
            historyData.push({
              date: `${parseInt(season.split('-')[0])}-12-31`,
              season: season,
              category: 'global',
              rank: teamEntry.rank,
              points: teamEntry.total_points
            })
          }
        } else {
          // Agregar todos los equipos con puntos
          teamRankings.forEach(entry => {
            if (entry.total_points > 0) {
              historyData.push({
                date: `${parseInt(season.split('-')[0])}-12-31`,
                season: season,
                team_id: entry.team_id,
                team_name: entry.team_name,
                rank: entry.rank,
                points: entry.total_points
              })
            }
          })
        }
      })

      console.log(`✅ Historial obtenido: ${historyData.length} puntos de datos`)
      return historyData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    } catch (error) {
      console.error('❌ Error obteniendo historial de ranking global:', error)
      return []
    }
  },

  /**
   * Calcular ranking global actual simplificado
   */
  calculateCurrentGlobalRanking: async (): Promise<DynamicRankingEntry[]> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log('🔄 Calculando ranking global actual...')

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

      // Obtener datos de la temporada actual
      const { data: seasonData, error } = await supabase
        .from('team_season_points')
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
        return []
      }

      if (!seasonData || seasonData.length === 0) {
        console.log('⚠️ No hay datos para la temporada actual')
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