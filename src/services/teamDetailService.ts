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
  category: string
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
      
      // 7. Calcular posición global actual
      const globalPosition = await this.calculateGlobalPosition(teamId)
      statistics.globalPosition = globalPosition
      
      // 8. Calcular posiciones históricas globales
      const historicalPositions = await this.calculateHistoricalGlobalPositions(teamId)
      statistics.bestPosition = historicalPositions.bestPosition
      statistics.worstPosition = historicalPositions.worstPosition
      
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
    try {
      // Validar que el ID no esté vacío
      if (!teamId || teamId.trim() === '') {
        const notFoundError = new Error(`ID de equipo inválido: "${teamId}"`)
        ;(notFoundError as any).code = 'NOT_FOUND'
        throw notFoundError
      }

      console.log(`[TeamDetailService] Buscando equipo con ID: "${teamId}"`)

      // Primero intentar obtener el equipo sin la relación de región
      // para evitar problemas si la región no existe
      let { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single()

      // Si hay error, lanzarlo
      if (error) {
        throw error
      }

      // Si no hay datos, el equipo no existe
      if (!data) {
        throw new Error(`Equipo con ID "${teamId}" no encontrado`)
      }

      // Si el equipo tiene regionId, obtener la región por separado
      if (data.regionId) {
        try {
          const { data: regionData, error: regionError } = await supabase
            .from('regions')
            .select('name, coefficient')
            .eq('id', data.regionId)
            .single()

          if (!regionError && regionData) {
            data.region = regionData
          } else {
            console.warn(`[TeamDetailService] No se pudo obtener la región ${data.regionId} para el equipo ${teamId}`)
          }
        } catch (regionError) {
          console.warn(`[TeamDetailService] Error al obtener región para equipo ${teamId}:`, regionError)
          // No fallar si no se puede obtener la región
        }
      }

      if (error) {
        console.error(`[TeamDetailService] Error de Supabase al obtener equipo ${teamId}:`, {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })

        // Si el equipo no existe, lanzar un error más descriptivo
        if (error.code === 'PGRST116' || 
            error.message?.includes('No rows returned') ||
            error.message?.includes('not found') ||
            error.code === 'NOT_FOUND' ||
            error.message?.includes('JSON object requested, multiple (or no) rows returned')) {
          const notFoundError = new Error(`Equipo con ID "${teamId}" no encontrado`)
          ;(notFoundError as any).code = 'NOT_FOUND'
          throw notFoundError
        }
        throw error
      }

      if (!data) {
        console.warn(`[TeamDetailService] No se encontraron datos para el equipo ${teamId}`)
        const notFoundError = new Error(`Equipo con ID "${teamId}" no encontrado`)
        ;(notFoundError as any).code = 'NOT_FOUND'
        throw notFoundError
      }

      console.log(`[TeamDetailService] Equipo encontrado: ${data.name} (ID: ${data.id})`)

      // Si es filial, obtener el equipo padre por separado
      if (data.isFilial && data.parentTeamId) {
        try {
          const { data: parentTeam, error: parentError } = await supabase
            .from('teams')
            .select('name')
            .eq('id', data.parentTeamId)
            .single()

          if (!parentError && parentTeam) {
            data.parentTeam = parentTeam
          }
        } catch (parentError) {
          // Si no se puede obtener el equipo padre, no es crítico
          console.warn('No se pudo obtener el equipo padre:', parentError)
        }
      }

      return data
    } catch (error: any) {
      // Re-lanzar el error para que se maneje en el nivel superior
      throw error
    }
  }

  /**
   * Obtener rankings actuales por categoría (OPTIMIZADO)
   * Usa una sola query a team_season_rankings en lugar de 6 queries secuenciales
   */
  private async getCurrentRankings(teamId: string) {
    const categories = ['beach_mixed', 'beach_open', 'beach_women', 'grass_mixed', 'grass_open', 'grass_women'] as const
    const rankings: { [category: string]: { position: number; points: number; change: number } } = {}

    try {
      // Determinar la temporada más reciente
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth() + 1
      const referenceSeason = currentMonth >= 7 
        ? `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
        : `${currentYear - 1}-${currentYear.toString().slice(-2)}`

      // Una sola query para obtener todos los rankings del equipo
      const { data, error } = await supabase
        .from('team_season_rankings')
        .select('*')
        .eq('team_id', teamId)
        .eq('season', referenceSeason)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.warn('Error obteniendo rankings desde team_season_rankings:', error)
      }

      if (data) {
        // Extraer rankings de todas las categorías desde la respuesta
        for (const category of categories) {
          const rank = data[`${category}_rank`]
          const points = data[`${category}_points`]
          const positionChange = data[`${category}_position_change`] || 0

          if (rank && rank > 0) {
            rankings[category] = {
              position: rank,
              points: points || 0,
              change: positionChange
            }
          }
        }
        return rankings
      }

      // Fallback: Si no hay datos pre-calculados, usar método anterior
      console.log('Fallback a método tradicional para getCurrentRankings')
      for (const category of categories) {
        try {
          const ranking = await hybridRankingService.getRankingFromSeasonPoints(category, referenceSeason)
          const teamRanking = ranking.find(entry => entry.team_id === teamId)
          
          if (teamRanking) {
            rankings[category] = {
              position: teamRanking.ranking_position,
              points: teamRanking.total_points,
              change: 0
            }
          }
        } catch (error) {
          console.warn(`Error obteniendo ranking para ${category}:`, error)
        }
      }
    } catch (error) {
      console.error('Error en getCurrentRankings:', error)
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
          category,
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
      category: position.tournaments.category,
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
   * Generar historial de ranking con datos de subtemporadas
   */
  private async generateRankingHistory(teamId: string): Promise<RankingHistory[]> {
    try {
      // Obtener datos históricos del equipo desde team_season_points con rankings de subtemporada
      const { data: seasonData, error } = await supabase
        .from('team_season_points')
        .select(`
          *,
          subseason_1_beach_mixed_rank,
          subseason_2_beach_open_women_rank,
          subseason_3_grass_mixed_rank,
          subseason_4_grass_open_women_rank,
          final_season_global_rank
        `)
        .eq('team_id', teamId)
        .order('season', { ascending: false })

      if (error) throw error

      const history: RankingHistory[] = []

      // Para cada temporada, crear puntos de datos para cada subtemporada
      for (const season of seasonData || []) {
        const seasonYear = parseInt(season.season.split('-')[0])
        
        // Subtemporada 1: Playa Mixto (Enero-Marzo)
        if (season.subseason_1_beach_mixed_rank) {
          history.push({
            date: `${seasonYear}-03-31`,
            season: season.season,
            category: 'subseason_1_beach_mixed',
            rank: season.subseason_1_beach_mixed_rank,
            points: season.beach_mixed_points || 0
          })
        }

        // Subtemporada 2: Playa Open/Women (Abril-Junio)
        if (season.subseason_2_beach_open_women_rank) {
          const avgRank = season.subseason_2_beach_open_women_rank // Promedio de open y women
          const totalPoints = (season.beach_open_points || 0) + (season.beach_women_points || 0)
          
          history.push({
            date: `${seasonYear}-06-30`,
            season: season.season,
            category: 'subseason_2_beach_open_women',
            rank: avgRank,
            points: totalPoints
          })
        }

        // Subtemporada 3: Césped Mixto (Julio-Septiembre)
        if (season.subseason_3_grass_mixed_rank) {
          history.push({
            date: `${seasonYear}-09-30`,
            season: season.season,
            category: 'subseason_3_grass_mixed',
            rank: season.subseason_3_grass_mixed_rank,
            points: season.grass_mixed_points || 0
          })
        }

        // Subtemporada 4: Césped Open/Women (Octubre-Diciembre)
        if (season.subseason_4_grass_open_women_rank) {
          const avgRank = season.subseason_4_grass_open_women_rank // Promedio de open y women
          const totalPoints = (season.grass_open_points || 0) + (season.grass_women_points || 0)
          
          history.push({
            date: `${seasonYear}-12-31`,
            season: season.season,
            category: 'subseason_4_grass_open_women',
            rank: avgRank,
            points: totalPoints
          })
        }

        // Ranking global final (si está disponible)
        if (season.final_season_global_rank) {
          const totalPoints = (season.beach_mixed_points || 0) + (season.beach_open_points || 0) + 
                             (season.beach_women_points || 0) + (season.grass_mixed_points || 0) + 
                             (season.grass_open_points || 0) + (season.grass_women_points || 0)
          
          history.push({
            date: `${seasonYear}-12-31`,
            season: season.season,
            category: 'final_global',
            rank: season.final_season_global_rank,
            points: totalPoints
          })
        }
      }

      // Ordenar por fecha
      history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      return history
    } catch (error) {
      console.error('Error generando historial de ranking:', error)
      return []
    }
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
    const seasonsActive = seasonBreakdown.length
    const categoriesPlayed = [...new Set(tournamentResults.map(r => `${r.surface}_${r.category}`))]

    return {
      totalTournaments,
      tournamentsWon,
      podiums,
      totalPoints,
      averagePoints,
      bestPosition: 0, // Se calculará después
      worstPosition: 0, // Se calculará después
      currentSeason: '2024-25',
      seasonsActive,
      categoriesPlayed
    }
  }

  /**
   * Calcular posiciones históricas en ranking global
   */
  private async calculateHistoricalGlobalPositions(teamId: string): Promise<{ bestPosition: number; worstPosition: number }> {
    try {
      // Obtener datos históricos del equipo
      const { data: teamData, error } = await supabase
        .from('team_season_points')
        .select('*')
        .eq('team_id', teamId)
        .order('season', { ascending: false })

      if (error || !teamData || teamData.length === 0) {
        return { bestPosition: 0, worstPosition: 0 }
      }

      const positions: number[] = []

      // Para cada temporada, calcular la posición global
      for (const season of teamData) {
        // Obtener todos los equipos de esa temporada
        const { data: allTeamsData, error: allError } = await supabase
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
          .eq('season', season.season)

        if (allError || !allTeamsData) continue

        // Calcular puntos totales del equipo actual
        const teamTotalPoints = (season.beach_mixed_points || 0) + (season.beach_open_points || 0) + 
                               (season.beach_women_points || 0) + (season.grass_mixed_points || 0) + 
                               (season.grass_open_points || 0) + (season.grass_women_points || 0)

        // Calcular puntos totales de todos los equipos
        const allTeamsTotals = allTeamsData.map(row => ({
          team_id: row.team_id,
          totalPoints: (row.beach_mixed_points || 0) + (row.beach_open_points || 0) + 
                      (row.beach_women_points || 0) + (row.grass_mixed_points || 0) + 
                      (row.grass_open_points || 0) + (row.grass_women_points || 0)
        }))

        // Ordenar por puntos totales y encontrar posición
        allTeamsTotals.sort((a, b) => b.totalPoints - a.totalPoints)
        const position = allTeamsTotals.findIndex(team => team.team_id === teamId) + 1

        if (position > 0) {
          positions.push(position)
        }
      }

      if (positions.length === 0) {
        return { bestPosition: 0, worstPosition: 0 }
      }

      return {
        bestPosition: Math.min(...positions),
        worstPosition: Math.max(...positions)
      }
    } catch (error) {
      console.error('Error calculando posiciones históricas globales:', error)
      return { bestPosition: 0, worstPosition: 0 }
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
    try {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('parentTeamId, isFilial')
        .eq('id', teamId)
        .single()

      if (teamError) {
        // Si el equipo no existe, retornar array vacío en lugar de lanzar error
        if (teamError.code === 'PGRST116' || teamError.message?.includes('No rows returned')) {
          return []
        }
        throw teamError
      }

      if (!team) {
        return []
      }

      let query = supabase.from('teams').select('*')

      if (team.isFilial && team.parentTeamId) {
        // Si es filial, obtener otras filiales del mismo club padre
        query = query.eq('parentTeamId', team.parentTeamId).neq('id', teamId)
      } else {
        // Si es principal, obtener sus filiales
        query = query.eq('parentTeamId', teamId)
      }

      const { data, error } = await query

      if (error) {
        console.warn('Error obteniendo equipos relacionados:', error)
        return []
      }
      return data || []
    } catch (error) {
      console.warn('Error en getRelatedTeams:', error)
      return []
    }
  }
}

export const teamDetailService = new TeamDetailService()
