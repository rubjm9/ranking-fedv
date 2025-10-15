/**
 * Servicio para obtener datos detallados de equipos para la página individual
 */

import { supabase } from './supabaseService'
import { hybridRankingService } from './hybridRankingService'

export interface TeamDetailData {
  team: {
    id: string
    name: string
    regionId: string
    location?: string
    email?: string
    logo?: string
    isFilial: boolean
    parentTeamId?: string
    hasDifferentNames: boolean
    nameOpen?: string
    nameWomen?: string
    nameMixed?: string
    createdAt: string
    updatedAt: string
    region?: {
      name: string
      coefficient: number
    }
    parentTeam?: {
      name: string
    }
  }
  currentRankings: {
    [category: string]: {
      position: number
      points: number
      change: number
    }
  }
  tournamentResults: TournamentResult[]
  rankingHistory: RankingHistory[]
  seasonBreakdown: SeasonBreakdown[]
  statistics: TeamStatistics
}

export interface TournamentResult {
  id: string
  tournamentId: string
  name: string
  year: number
  season: string
  type: string
  surface: string
  modality: string
  position: number
  points: number
  date: string
  region?: string
}

export interface RankingHistory {
  date: string
  season: string
  category: string
  rank: number
  points: number
}

export interface SeasonBreakdown {
  season: string
  categories: {
    [category: string]: {
      points: number
      tournaments: number
      bestPosition: number
    }
  }
  totalPoints: number
}

export interface TeamStatistics {
  totalTournaments: number
  tournamentsWon: number
  podiums: number
  totalPoints: number
  averagePoints: number
  bestPosition: number
  worstPosition: number
  currentSeason: string
  seasonsActive: number
  categoriesPlayed: string[]
}

class TeamDetailService {
  /**
   * Obtener datos completos de un equipo
   */
  async getTeamDetailData(teamId: string): Promise<TeamDetailData> {
    try {
      // 1. Obtener información básica del equipo
      const teamData = await this.getTeamBasicInfo(teamId)
      
      // 2. Obtener rankings actuales por categoría
      const currentRankings = await this.getCurrentRankings(teamId)
      
      // 3. Obtener resultados de torneos
      const tournamentResults = await this.getTournamentResults(teamId)
      
      // 4. Generar historial de ranking
      const rankingHistory = await this.generateRankingHistory(teamId)
      
      // 5. Obtener desglose por temporadas
      const seasonBreakdown = await this.getSeasonBreakdown(teamId)
      
      // 6. Calcular estadísticas
      const statistics = this.calculateStatistics(tournamentResults, seasonBreakdown)
      
      return {
        team: teamData,
        currentRankings,
        tournamentResults,
        rankingHistory,
        seasonBreakdown,
        statistics
      }
    } catch (error) {
      console.error('Error obteniendo datos detallados del equipo:', error)
      throw error
    }
  }

  /**
   * Obtener información básica del equipo
   */
  private async getTeamBasicInfo(teamId: string) {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        region:regions(name, coefficient),
        parentTeam:teams!parentTeamId(name)
      `)
      .eq('id', teamId)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Obtener rankings actuales por categoría
   */
  private async getCurrentRankings(teamId: string) {
    const categories = ['beach_mixed', 'beach_open', 'beach_women', 'grass_mixed', 'grass_open', 'grass_women']
    const rankings: { [category: string]: { position: number; points: number; change: number } } = {}

    for (const category of categories) {
      try {
        const ranking = await hybridRankingService.getRanking(category, '2024-25')
        const teamRanking = ranking.find(entry => entry.team_id === teamId)
        
        if (teamRanking) {
          rankings[category] = {
            position: teamRanking.ranking_position,
            points: teamRanking.total_points,
            change: 0 // TODO: Calcular cambio respecto a temporada anterior
          }
        }
      } catch (error) {
        console.warn(`Error obteniendo ranking para ${category}:`, error)
      }
    }

    return rankings
  }

  /**
   * Obtener resultados de torneos del equipo
   */
  private async getTournamentResults(teamId: string): Promise<TournamentResult[]> {
    const { data, error } = await supabase
      .from('positions')
      .select(`
        *,
        tournaments(
          id,
          name,
          year,
          season,
          type,
          surface,
          modality,
          startDate,
          endDate,
          region:regions(name)
        )
      `)
      .eq('teamId', teamId)
      .order('tournaments.year', { ascending: false })
      .order('tournaments.startDate', { ascending: false })

    if (error) throw error

    return (data || []).map(position => ({
      id: position.id,
      tournamentId: position.tournamentId,
      name: position.tournaments.name,
      year: position.tournaments.year,
      season: position.tournaments.season || `${position.tournaments.year}-${(position.tournaments.year + 1).toString().slice(-2)}`,
      type: position.tournaments.type,
      surface: position.tournaments.surface,
      modality: position.tournaments.modality,
      position: position.position,
      points: position.points,
      date: position.tournaments.startDate || position.tournaments.endDate || '',
      region: position.tournaments.region?.name
    }))
  }

  /**
   * Generar historial de ranking
   */
  private async generateRankingHistory(teamId: string): Promise<RankingHistory[]> {
    // Obtener datos de team_season_points para generar historial
    const { data, error } = await supabase
      .from('team_season_points')
      .select('*')
      .eq('team_id', teamId)
      .order('season', { ascending: false })

    if (error) throw error

    const history: RankingHistory[] = []
    const seasons = data || []

    for (const seasonData of seasons) {
      const categories = ['beach_mixed', 'beach_open', 'beach_women', 'grass_mixed', 'grass_open', 'grass_women']
      
      for (const category of categories) {
        const points = seasonData[`${category}_points`] || 0
        if (points > 0) {
          // Obtener ranking para esta categoría y temporada
          try {
            const ranking = await hybridRankingService.getHistoricalRanking(seasonData.season, category)
            const teamRanking = ranking.find(entry => entry.team_id === teamId)
            
            if (teamRanking) {
              history.push({
                date: `${seasonData.season}-01-01`, // Fecha aproximada
                season: seasonData.season,
                category,
                rank: teamRanking.ranking_position,
                points: teamRanking.total_points
              })
            }
          } catch (error) {
            console.warn(`Error obteniendo ranking histórico para ${seasonData.season} ${category}:`, error)
          }
        }
      }
    }

    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  /**
   * Obtener desglose por temporadas
   */
  private async getSeasonBreakdown(teamId: string): Promise<SeasonBreakdown[]> {
    const { data, error } = await supabase
      .from('team_season_points')
      .select('*')
      .eq('team_id', teamId)
      .order('season', { ascending: false })

    if (error) throw error

    return (data || []).map(seasonData => {
      const categories = ['beach_mixed', 'beach_open', 'beach_women', 'grass_mixed', 'grass_open', 'grass_women']
      const categoryData: { [category: string]: { points: number; tournaments: number; bestPosition: number } } = {}
      let totalPoints = 0

      for (const category of categories) {
        const points = seasonData[`${category}_points`] || 0
        if (points > 0) {
          categoryData[category] = {
            points,
            tournaments: Math.floor(points / 50), // Estimación basada en puntos promedio
            bestPosition: seasonData.best_position || 1
          }
          totalPoints += points
        }
      }

      return {
        season: seasonData.season,
        categories: categoryData,
        totalPoints
      }
    })
  }

  /**
   * Calcular estadísticas del equipo
   */
  private calculateStatistics(tournamentResults: TournamentResult[], seasonBreakdown: SeasonBreakdown[]): TeamStatistics {
    const totalTournaments = tournamentResults.length
    const tournamentsWon = tournamentResults.filter(r => r.position === 1).length
    const podiums = tournamentResults.filter(r => r.position <= 3).length
    const totalPoints = tournamentResults.reduce((sum, r) => sum + r.points, 0)
    const averagePoints = totalTournaments > 0 ? totalPoints / totalTournaments : 0
    const bestPosition = tournamentResults.length > 0 ? Math.min(...tournamentResults.map(r => r.position)) : 0
    const worstPosition = tournamentResults.length > 0 ? Math.max(...tournamentResults.map(r => r.position)) : 0
    const seasonsActive = seasonBreakdown.length
    const categoriesPlayed = [...new Set(tournamentResults.map(r => `${r.surface}_${r.modality}`))]

    return {
      totalTournaments,
      tournamentsWon,
      podiums,
      totalPoints,
      averagePoints,
      bestPosition,
      worstPosition,
      currentSeason: '2024-25',
      seasonsActive,
      categoriesPlayed
    }
  }

  /**
   * Obtener equipos relacionados (mismo club padre)
   */
  async getRelatedTeams(teamId: string) {
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('parentTeamId, isFilial')
      .eq('id', teamId)
      .single()

    if (teamError) throw teamError

    let query = supabase.from('teams').select('*')

    if (team.isFilial && team.parentTeamId) {
      // Si es filial, obtener otras filiales del mismo club padre
      query = query.eq('parentTeamId', team.parentTeamId).neq('id', teamId)
    } else {
      // Si es principal, obtener sus filiales
      query = query.eq('parentTeamId', teamId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }
}

export const teamDetailService = new TeamDetailService()
