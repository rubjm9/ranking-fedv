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
   * Usa rankings pre-calculados de team_season_rankings (MUCHO MÁS RÁPIDO)
   */
  getGlobalRankingHistory: async (teamId?: string): Promise<any[]> => {
    try {
      if (!supabase || !teamId) {
        throw new Error('Supabase o teamId no configurado')
      }

      console.log(`🔄 Obteniendo ranking global histórico para equipo ${teamId}...`)

      // OPTIMIZADO: Obtener solo los datos del equipo específico, ordenados por temporada
      const { data: teamRankings, error } = await supabase
        .from('team_season_rankings')
        .select('season, beach_mixed_points, beach_open_points, beach_women_points, grass_mixed_points, grass_open_points, grass_women_points')
        .eq('team_id', teamId)
        .order('season', { ascending: true })

      if (error) {
        console.error('Error obteniendo rankings del equipo:', error)
        return []
      }

      if (!teamRankings || teamRankings.length === 0) {
        console.log('⚠️ No hay datos en team_season_rankings para este equipo.')
        return []
      }

      console.log(`📊 Registros encontrados: ${teamRankings.length} temporadas`)

      // Para cada temporada, calcular posición global sumando todas las modalidades
      const historyData: any[] = []

      for (const row of teamRankings) {
        // Obtener datos de las 4 subtemporadas para esta temporada
        historyData.push({
          date: `${parseInt(row.season.split('-')[0])}-12-31`,
          season: row.season,
          category: 'global',
          subupdate1: {
            rank: row.subupdate_1_global_rank,
            points: row.subupdate_1_global_points
          },
          subupdate2: {
            rank: row.subupdate_2_global_rank,
            points: row.subupdate_2_global_points
          },
          subupdate3: {
            rank: row.subupdate_3_global_rank,
            points: row.subupdate_3_global_points
          },
          subupdate4: {
            rank: row.subupdate_4_global_rank,
            points: row.subupdate_4_global_points
          }
        })
      }

      console.log(`✅ Historial obtenido: ${historyData.length} puntos de datos`)
      return historyData

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
