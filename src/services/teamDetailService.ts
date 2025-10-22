/**
 * Servicio para obtener datos detallados de equipos para la página individual
 */

import { supabase } from './supabaseService'
import hybridRankingService from './hybridRankingService'

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
  globalPosition?: number
}

class TeamDetailService {
  /**
   * Obtener datos completos de un equipo
   */
  async getTeamDetailData(teamId: string): Promise<TeamDetailData> {
    try {
      // 1. Obtener información básica del equipo
      const teamData = await this.getTeamBasicInfo(teamId)
      
      // 2. Obtener resultados de torneos (más simple, sin ordenamiento complejo)
      const tournamentResults = await this.getTournamentResults(teamId)
      
      // 3. Obtener rankings actuales (con manejo de errores)
      const currentRankings = await this.getCurrentRankings(teamId)
      
      // 4. Generar historial de ranking (simplificado)
      const rankingHistory = await this.generateRankingHistory(teamId)
      
      // 5. Obtener desglose por temporadas
      const seasonBreakdown = await this.getSeasonBreakdown(teamId)
      
      // 6. Calcular estadísticas
      const statistics = this.calculateStatistics(tournamentResults, seasonBreakdown)
      
      // 7. Calcular posición global
      const globalPosition = await this.calculateGlobalPosition(teamId)
      statistics.globalPosition = globalPosition
      
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
        region:regions(name, coefficient)
      `)
      .eq('id', teamId)
      .single()

    if (error) throw error

    // Si es filial, obtener el equipo padre por separado
    if (data.isFilial && data.parentTeamId) {
      const { data: parentTeam, error: parentError } = await supabase
        .from('teams')
        .select('name')
        .eq('id', data.parentTeamId)
        .single()

      if (!parentError && parentTeam) {
        data.parentTeam = parentTeam
      }
    }

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
        const ranking = await hybridRankingService.getRankingFromSeasonPoints(category, '2024-25')
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
        // Continuar con las otras categorías aunque una falle
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

    if (error) throw error

    const results = (data || []).map(position => ({
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

    // Ordenar por año y fecha en JavaScript
    return results.sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year // Más reciente primero
      }
      if (a.date && b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
      return 0
    })
  }

  /**
   * Generar historial de ranking
   */
  private async generateRankingHistory(teamId: string): Promise<RankingHistory[]> {
    // Por ahora, devolver un historial vacío para evitar errores
    // TODO: Implementar historial real cuando el sistema esté más estable
    return []
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
   * Calcular posición global del equipo en todas las categorías
   */
  private async calculateGlobalPosition(teamId: string): Promise<number> {
    try {
      // Obtener puntos totales del equipo en todas las categorías
      const { data: teamPoints, error } = await supabase
        .from('team_season_points')
        .select(`
          beach_mixed_points,
          beach_open_points,
          beach_women_points,
          grass_mixed_points,
          grass_open_points,
          grass_women_points
        `)
        .eq('team_id', teamId)
        .eq('season', '2024-25')

      if (error || !teamPoints || teamPoints.length === 0) {
        return 0 // No hay datos
      }

      const teamTotalPoints = teamPoints.reduce((sum, row) => {
        return sum + (row.beach_mixed_points || 0) + (row.beach_open_points || 0) + 
               (row.beach_women_points || 0) + (row.grass_mixed_points || 0) + 
               (row.grass_open_points || 0) + (row.grass_women_points || 0)
      }, 0)

      // Obtener todos los equipos con sus puntos totales
      const { data: allTeamsPoints, error: allError } = await supabase
        .from('team_season_points')
        .select(`
          team_id,
          beach_mixed_points,
          beach_open_points,
          beach_women_points,
          grass_mixed_points,
          grass_open_points,
          grass_women_points
        `)
        .eq('season', '2024-25')

      if (allError || !allTeamsPoints) {
        return 0
      }

      // Calcular puntos totales de todos los equipos
      const allTeamsTotals = allTeamsPoints.map(row => ({
        team_id: row.team_id,
        totalPoints: (row.beach_mixed_points || 0) + (row.beach_open_points || 0) + 
                    (row.beach_women_points || 0) + (row.grass_mixed_points || 0) + 
                    (row.grass_open_points || 0) + (row.grass_women_points || 0)
      }))

      // Ordenar por puntos totales y encontrar posición
      allTeamsTotals.sort((a, b) => b.totalPoints - a.totalPoints)
      const position = allTeamsTotals.findIndex(team => team.team_id === teamId) + 1

      return position > 0 ? position : 0
    } catch (error) {
      console.error('Error calculando posición global:', error)
      return 0
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
