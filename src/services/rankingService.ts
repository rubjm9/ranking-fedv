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

export interface RankingHistoryEntry {
  id: string
  team_id: string
  team_name: string
  ranking_category: string
  position: number
  total_points: number
  change_from_previous: number
  calculated_at: string
  season: string
}

export interface RankingEvolution {
  team_id: string
  team_name: string
  category: string
  data: {
    season: string
    position: number
    points: number
    change: number
  }[]
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
  },

  // Obtener historial de cambios de ranking
  getRankingHistory: async (category?: string, teamId?: string, limit: number = 50): Promise<RankingHistoryEntry[]> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      let query = supabase
        .from('team_season_rankings')
        .select(`
          *,
          teams:team_id(
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (category) {
        // Filtrar por categoría específica basada en los puntos
        query = query.not(`${category}_points`, 'is', null)
      }

      if (teamId) {
        query = query.eq('team_id', teamId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error al obtener historial de ranking:', error)
        throw error
      }

      // Transformar datos para incluir información del equipo y cambios
      const historyData: RankingHistoryEntry[] = (data || []).map((entry, index) => {
        // Calcular posición basada en puntos de la categoría
        const points = category ? entry[`${category}_points`] || 0 : 
          (entry.beach_mixed_points || 0) + (entry.beach_open_points || 0) + 
          (entry.beach_women_points || 0) + (entry.grass_mixed_points || 0) + 
          (entry.grass_open_points || 0) + (entry.grass_women_points || 0)

        return {
          id: entry.id,
          team_id: entry.team_id,
          team_name: entry.teams?.name || 'Equipo desconocido',
          ranking_category: category || 'general',
          position: index + 1, // Simplificado por ahora
          total_points: points,
          change_from_previous: 0, // Se calcularía comparando con el anterior
          calculated_at: entry.created_at,
          season: entry.season
        }
      })

      return historyData
    } catch (error) {
      console.error('Error al obtener historial de ranking:', error)
      return []
    }
  },

  // Obtener evolución de un equipo específico
  getTeamEvolution: async (teamId: string, category: string = 'beach_mixed'): Promise<RankingEvolution> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      // Obtener datos del equipo
      const { data: teamData } = await supabase
        .from('teams')
        .select('id, name')
        .eq('id', teamId)
        .single()

      // Obtener historial de temporadas del equipo
      const { data: seasonData, error } = await supabase
        .from('team_season_rankings')
        .select('*')
        .eq('team_id', teamId)
        .order('season', { ascending: true })

      if (error) {
        console.error('Error al obtener evolución del equipo:', error)
        throw error
      }

      // Transformar datos para el gráfico
      const evolutionData = (seasonData || []).map((entry, index) => ({
        season: entry.season,
        position: index + 1, // Simplificado
        points: entry[`${category}_points`] || 0,
        change: index > 0 ? 
          (entry[`${category}_points`] || 0) - (seasonData[index - 1][`${category}_points`] || 0) : 0
      }))

      return {
        team_id: teamId,
        team_name: teamData?.name || 'Equipo desconocido',
        category,
        data: evolutionData
      }
    } catch (error) {
      console.error('Error al obtener evolución del equipo:', error)
      return {
        team_id: teamId,
        team_name: 'Equipo desconocido',
        category,
        data: []
      }
    }
  },

  // Obtener comparación entre temporadas
  getSeasonComparison: async (category: string = 'beach_mixed'): Promise<any> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      // Obtener datos de las últimas 4 temporadas
      const { data: seasonData, error } = await supabase
        .from('team_season_rankings')
        .select(`
          *,
          teams:team_id(
            id,
            name
          )
        `)
        .not(`${category}_points`, 'is', null)
        .order('season', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error al obtener comparación de temporadas:', error)
        throw error
      }

      // Agrupar por temporada y equipo
      const comparisonData = (seasonData || []).reduce((acc, entry) => {
        const season = entry.season
        const teamId = entry.team_id
        
        if (!acc[season]) {
          acc[season] = {}
        }
        
        acc[season][teamId] = {
          team_name: entry.teams?.name || 'Equipo desconocido',
          points: entry[`${category}_points`] || 0,
          position: 0 // Se calcularía ordenando por puntos
        }
        
        return acc
      }, {} as any)

      return comparisonData
    } catch (error) {
      console.error('Error al obtener comparación de temporadas:', error)
      return {}
    }
  }
}

export default rankingService
