import { supabase } from './supabaseService'

export interface RankingEntry {
  team_id: string
  team_name: string
  ranking_category: string
  current_season_points: number
  previous_season_points: number
  two_seasons_ago_points: number
  three_seasons_ago_points: number
  total_points: number
  ranking_position: number
  last_calculated: string
}

export interface RankingSummary {
  total_teams: number
  teams_with_points: number
  teams_without_points: number
  max_points: string
  min_points: string
  average_points: string
}

export interface RankingResponse {
  data: RankingEntry[]
  summary: RankingSummary
}

const rankingService = {
  // Obtener ranking por categoría
  getRanking: async (category: string = 'beach_mixed'): Promise<RankingResponse> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      // Obtener ranking con información de equipos
      const { data: rankingData, error } = await supabase
        .from('current_rankings')
        .select(`
          *,
          teams:team_id(
            id,
            name,
            regions:regionId(
              id,
              name
            )
          )
        `)
        .eq('ranking_category', category)
        .order('ranking_position', { ascending: true })

      if (error) {
        console.error('Error al obtener ranking:', error)
        throw error
      }

      // Transformar datos para incluir nombres de equipos
      const transformedData: RankingEntry[] = (rankingData || []).map(ranking => ({
        team_id: ranking.team_id,
        team_name: ranking.teams?.name || 'Equipo desconocido',
        ranking_category: ranking.ranking_category,
        current_season_points: ranking.current_season_points || 0,
        previous_season_points: ranking.previous_season_points || 0,
        two_seasons_ago_points: ranking.two_seasons_ago_points || 0,
        three_seasons_ago_points: ranking.three_seasons_ago_points || 0,
        total_points: ranking.total_points || 0,
        ranking_position: ranking.ranking_position || 0,
        last_calculated: ranking.last_calculated || new Date().toISOString()
      }))

      // Calcular estadísticas
      const totalTeams = await supabase.from('teams').select('id', { count: 'exact', head: true })
      const teamsWithPoints = transformedData.filter(r => r.total_points > 0).length
      const maxPoints = transformedData.length > 0 ? Math.max(...transformedData.map(r => r.total_points)) : 0
      const minPoints = transformedData.length > 0 ? Math.min(...transformedData.map(r => r.total_points)) : 0
      const avgPoints = transformedData.length > 0 ? 
        transformedData.reduce((sum, r) => sum + r.total_points, 0) / transformedData.length : 0

      const summary: RankingSummary = {
        total_teams: totalTeams.count || 0,
        teams_with_points: teamsWithPoints,
        teams_without_points: (totalTeams.count || 0) - teamsWithPoints,
        max_points: maxPoints.toFixed(2),
        min_points: minPoints.toFixed(2),
        average_points: avgPoints.toFixed(2)
      }

      return {
        data: transformedData,
        summary
      }
    } catch (error) {
      console.error('Error al obtener ranking:', error)
      return {
        data: [],
        summary: {
          total_teams: 0,
          teams_with_points: 0,
          teams_without_points: 0,
          max_points: "0.00",
          min_points: "0.00",
          average_points: "0.00"
        }
      }
    }
  },

  // Recalcular ranking
  recalculateRanking: async (): Promise<any> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      const { error } = await supabase.rpc('recalculate_current_rankings')
      
      if (error) {
        console.error('Error al recalcular ranking:', error)
        throw error
      }
      
      return { message: 'Ranking recalculado exitosamente' }
    } catch (error) {
      console.error('Error al recalcular ranking:', error)
      throw error
    }
  }
}

export default rankingService
