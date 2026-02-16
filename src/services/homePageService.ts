/**
 * Servicio para obtener datos específicos de la homepage
 */

import { supabase } from './supabaseService'
import hybridRankingService from './hybridRankingService'
import type { SurfacePointsMap } from './seasonPointsService'

// Función auxiliar para obtener ranking de una categoría de la temporada anterior desde team_season_rankings
const getPreviousSeasonCategoryRanking = async (category: string, referenceSeason: string) => {
  try {
    if (!supabase) return null

    const referenceYear = parseInt(referenceSeason.split('-')[0])
    const previousYear = referenceYear - 1
    const previousSeason = `${previousYear}-${(previousYear + 1).toString().slice(-2)}`

    // Mapear categoría a columna de la tabla
    const rankColumn = `${category}_rank`
    const pointsColumn = `${category}_points`

    // Obtener ranking de la categoría para la temporada anterior
    const { data: rankingsData, error } = await supabase
      .from('team_season_rankings')
      .select(`
        team_id,
        ${rankColumn},
        ${pointsColumn}
      `)
      .eq('season', previousSeason)
      .not(rankColumn, 'is', null)
      .order(rankColumn, { ascending: true })

    if (error) {
      console.error('Error obteniendo ranking de categoría de temporada anterior:', error)
      return null
    }

    if (!rankingsData || rankingsData.length === 0) {
      return []
    }

    // Convertir a formato compatible
    return rankingsData.map((row: any) => ({
      team_id: row.team_id,
      total_points: parseFloat(row[pointsColumn] || 0),
      ranking_position: row[rankColumn]
    }))
  } catch (error) {
    console.error('Error obteniendo ranking de categoría de temporada anterior:', error)
    return null
  }
}

// Función para calcular el cambio de posición usando team_season_rankings
const calculatePositionChange = async (data: any[], category: string, referenceSeason: string) => {
  if (!data || data.length === 0) return []
  if (!referenceSeason) return data // Si no hay temporada de referencia, no calculamos cambios
  
  // Calcular ranking actual (con las últimas 4 temporadas)
  const currentRanking = [...data].sort((a, b) => b.total_points - a.total_points)
  
  // Obtener ranking de la temporada anterior desde team_season_rankings
  const previousRanking = await getPreviousSeasonCategoryRanking(category, referenceSeason) || []
  
  // Si no hay datos de la temporada anterior, retornar datos sin cambios
  if (!previousRanking || previousRanking.length === 0) {
    return currentRanking.map(team => ({
      ...team,
      position_change: 0
    }))
  }
  
  // Crear un mapa de posiciones anteriores
  const previousPositionsMap = new Map(
    previousRanking.map((team) => [team.team_id, team.ranking_position || 0])
  )
  
  // Agregar cambio de posición a cada equipo
  return currentRanking.map((team, index) => {
    const currentPosition = index + 1
    const previousPosition = previousPositionsMap.get(team.team_id)
    
    // Si el equipo no estaba en la temporada anterior, no hay cambio
    const positionChange = previousPosition !== undefined 
      ? previousPosition - currentPosition // Positivo si subió, negativo si bajó
      : 0
    
    return {
      ...team,
      position_change: positionChange
    }
  })
}

// Función auxiliar para obtener ranking global de la temporada anterior desde team_season_rankings
const getPreviousSeasonGlobalRanking = async (referenceSeason: string) => {
  try {
    if (!supabase) return null

    const referenceYear = parseInt(referenceSeason.split('-')[0])
    const previousYear = referenceYear - 1
    const previousSeason = `${previousYear}-${(previousYear + 1).toString().slice(-2)}`

    // Obtener rankings de la temporada anterior desde team_season_rankings
    // Usamos subupdate_4_global_rank que es el ranking final de la temporada
    const { data: rankingsData, error } = await supabase
      .from('team_season_rankings')
      .select(`
        team_id,
        subupdate_4_global_rank,
        subupdate_4_global_points
      `)
      .eq('season', previousSeason)
      .not('subupdate_4_global_rank', 'is', null)
      .order('subupdate_4_global_rank', { ascending: true })

    if (error) {
      console.error('Error obteniendo ranking global de temporada anterior:', error)
      return null
    }

    if (!rankingsData || rankingsData.length === 0) {
      return null
    }

    // Convertir a formato compatible
    return rankingsData.map((row: any) => ({
      team_id: row.team_id,
      total_points: parseFloat(row.subupdate_4_global_points || 0),
      ranking_position: row.subupdate_4_global_rank
    }))
  } catch (error) {
    console.error('Error obteniendo ranking de temporada anterior:', error)
    return null
  }
}

// Función para calcular el cambio de posición del ranking general usando team_season_rankings
const calculateGeneralPositionChange = async (data: any[], referenceSeason: string) => {
  if (!data || data.length === 0) return []
  if (!referenceSeason) return data // Si no hay temporada de referencia, no calculamos cambios
  
  // Calcular ranking actual (con las últimas 4 temporadas)
  const currentRanking = [...data].sort((a, b) => b.total_points - a.total_points)
  
  // Obtener ranking global de la temporada anterior desde team_season_rankings
  const previousRanking = await getPreviousSeasonGlobalRanking(referenceSeason) || []
  
  // Si no hay datos de la temporada anterior, retornar datos sin cambios
  if (!previousRanking || previousRanking.length === 0) {
    return currentRanking.map(team => ({
      ...team,
      position_change: 0
    }))
  }
  
  // Crear un mapa de posiciones anteriores
  const previousPositionsMap = new Map(
    previousRanking.map((team) => [team.team_id, team.ranking_position || 0])
  )
  
  // Agregar cambio de posición a cada equipo
  return currentRanking.map((team, index) => {
    const currentPosition = index + 1
    const previousPosition = previousPositionsMap.get(team.team_id)
    
    // Si el equipo no estaba en la temporada anterior, no hay cambio
    const positionChange = previousPosition !== undefined 
      ? previousPosition - currentPosition // Positivo si subió, negativo si bajó
      : 0
    
    return {
      ...team,
      position_change: positionChange
    }
  })
}

export interface HomePageTeam {
  id: string
  name: string
  region: string
  regionCode: string
  logo?: string
  currentRank: number
  previousRank: number
  points: number
  tournaments: number
  change: number
  lastUpdate: string
  category?: string
}

export interface HomePageRegion {
  id: string
  name: string
  code: string
  teams: number
  averagePoints: number
}

export interface HomePageTournament {
  id: string
  name: string
  year: number
  season: string
  type: string
  status: string
  teams: number
  startDate: string
  surface: string
  category: string
}

export interface HomePageStats {
  totalTeams: number
  totalTournaments: number
  totalRegions: number
  averagePoints: number
}

export interface RankingHistory {
  date: string
  totalTeams: number
  averagePoints: number
}

class HomePageService {
  /**
   * Obtener equipos top por categoría (OPTIMIZADO)
   * Usa datos pre-calculados de team_season_rankings con position_change incluido.
   * Usa la misma lógica que la página Rankings: temporada más reciente por categoría
   * (getMostRecentSeasonForCategory), no una temporada global.
   */
  async getTopTeamsByCategory(category: string, limit: number = 5, season?: string): Promise<HomePageTeam[]> {
    try {
      // Misma lógica que la página Rankings: temporada más reciente con datos para esta categoría
      const referenceSeason = season || await hybridRankingService.getMostRecentSeasonForCategory(category as keyof SurfacePointsMap)
      
      const rankCol = `${category}_rank`
      const pointsCol = `${category}_points`
      const posChangeCol = `${category}_position_change`

      // Query única que obtiene ranking, info de equipos y cambios de posición
      const { data: rankingsData, error: rankingsError } = await supabase
        .from('team_season_rankings')
        .select(`
          team_id,
          ${rankCol},
          ${pointsCol},
          ${posChangeCol},
          teams(id, name, logo, region:regions(name))
        `)
        .eq('season', referenceSeason)
        .not(rankCol, 'is', null)
        .order(rankCol, { ascending: true })
        .limit(limit)

      if (rankingsError) {
        console.error('Error obteniendo ranking por categoría:', rankingsError)
        // Fallback al método anterior
        return this.getTopTeamsByCategoryLegacy(category, limit, referenceSeason)
      }

      if (!rankingsData || rankingsData.length === 0) {
        return this.getTopTeamsByCategoryLegacy(category, limit, referenceSeason)
      }

      // Obtener conteo de torneos en una sola query
      const teamIds = rankingsData.map((r: any) => r.team_id)
      const { data: tournamentStats } = await supabase
        .from('positions')
        .select('teamId')
        .in('teamId', teamIds)

      const tournamentCounts = new Map<string, number>()
      tournamentStats?.forEach(stat => {
        const count = tournamentCounts.get(stat.teamId) || 0
        tournamentCounts.set(stat.teamId, count + 1)
      })

      // Construir respuesta
      return rankingsData.map((ranking: any) => {
        const team = ranking.teams
        const change = ranking[posChangeCol] || 0
        const currentRank = ranking[rankCol]
        const regionName = team?.region?.name || 'Sin región'
        
        return {
          id: ranking.team_id,
          name: team?.name || 'Equipo desconocido',
          region: regionName,
          regionCode: regionName.toLowerCase().replace(/\s+/g, '_'),
          logo: team?.logo,
          currentRank: currentRank,
          previousRank: currentRank - change,
          points: ranking[pointsCol] || 0,
          tournaments: tournamentCounts.get(ranking.team_id) || 0,
          change: change,
          lastUpdate: new Date().toISOString(),
          category: category
        }
      })
    } catch (error) {
      console.error('Error obteniendo equipos top por categoría:', error)
      return []
    }
  }

  /**
   * Método legacy para fallback cuando no hay datos pre-calculados
   */
  private async getTopTeamsByCategoryLegacy(category: string, limit: number, referenceSeason: string): Promise<HomePageTeam[]> {
    try {
      const categoryRanking = await hybridRankingService.getRankingFromSeasonPoints(category as keyof SurfacePointsMap, referenceSeason)
      const teamIds = categoryRanking.slice(0, limit).map(team => team.team_id)
      
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name, logo, region:regions(name)')
        .in('id', teamIds)

      const teamsMap = new Map(teamsData?.map(team => [team.id, team]) || [])

      const { data: tournamentStats } = await supabase
        .from('positions')
        .select('teamId')
        .in('teamId', teamIds)

      const tournamentCounts = new Map<string, number>()
      tournamentStats?.forEach(stat => {
        const count = tournamentCounts.get(stat.teamId) || 0
        tournamentCounts.set(stat.teamId, count + 1)
      })

      const rankingWithChanges = await calculatePositionChange(categoryRanking, category, referenceSeason)
      
      return rankingWithChanges.slice(0, limit).map((ranking, index) => {
        const teamData = teamsMap.get(ranking.team_id)
        const regionName = teamData?.region?.name || 'Sin región'
        const change = ranking.position_change || 0
        
        return {
          id: ranking.team_id,
          name: teamData?.name || 'Equipo desconocido',
          region: regionName,
          regionCode: regionName.toLowerCase().replace(/\s+/g, '_'),
          logo: teamData?.logo,
          currentRank: index + 1,
          previousRank: index + 1 - change,
          points: ranking.total_points || 0,
          tournaments: tournamentCounts.get(ranking.team_id) || 0,
          change: change,
          lastUpdate: new Date().toISOString(),
          category: category
        }
      })
    } catch (error) {
      console.error('Error en getTopTeamsByCategoryLegacy:', error)
      return []
    }
  }

  /**
   * Obtener equipos top para ranking general (OPTIMIZADO)
   * Usa datos pre-calculados de team_season_rankings con position_change incluido
   */
  async getTopTeams(limit: number = 10, season?: string): Promise<HomePageTeam[]> {
    try {
      // Obtener temporada más reciente si no se proporciona
      const referenceSeason = season || await hybridRankingService.getMostRecentSeason()
      
      // Determinar subupdate más reciente disponible
      let subupdateToUse = 4
      for (let i = 4; i >= 1; i--) {
        const { data: checkData } = await supabase
          .from('team_season_rankings')
          .select('team_id')
          .eq('season', referenceSeason)
          .not(`subupdate_${i}_global_rank`, 'is', null)
          .limit(1)

        if (checkData && checkData.length > 0) {
          subupdateToUse = i
          break
        }
      }

      const rankCol = `subupdate_${subupdateToUse}_global_rank`
      const pointsCol = `subupdate_${subupdateToUse}_global_points`
      const posChangeCol = `subupdate_${subupdateToUse}_global_position_change`

      // Query única que obtiene ranking, info de equipos y cambios de posición
      const { data: rankingsData, error: rankingsError } = await supabase
        .from('team_season_rankings')
        .select(`
          team_id,
          ${rankCol},
          ${pointsCol},
          ${posChangeCol},
          teams(id, name, logo, region:regions(name))
        `)
        .eq('season', referenceSeason)
        .not(rankCol, 'is', null)
        .order(rankCol, { ascending: true })
        .limit(limit)

      if (rankingsError) {
        console.error('Error obteniendo ranking global:', rankingsError)
        // Fallback al método anterior
        return this.getTopTeamsLegacy(limit, referenceSeason)
      }

      if (!rankingsData || rankingsData.length === 0) {
        return this.getTopTeamsLegacy(limit, referenceSeason)
      }

      // Obtener conteo de torneos en una sola query
      const teamIds = rankingsData.map((r: any) => r.team_id)
      const { data: tournamentStats } = await supabase
        .from('positions')
        .select('teamId')
        .in('teamId', teamIds)

      const tournamentCounts = new Map<string, number>()
      tournamentStats?.forEach(stat => {
        const count = tournamentCounts.get(stat.teamId) || 0
        tournamentCounts.set(stat.teamId, count + 1)
      })

      // Construir respuesta
      return rankingsData.map((ranking: any) => {
        const team = ranking.teams
        const change = ranking[posChangeCol] || 0
        const currentRank = ranking[rankCol]
        
        return {
          id: ranking.team_id,
          name: team?.name || 'Equipo desconocido',
          region: team?.region?.name || 'Sin región',
          regionCode: team?.region?.name ? team.region.name.substring(0, 3).toUpperCase() : 'N/A',
          logo: team?.logo,
          currentRank: currentRank,
          previousRank: currentRank - change,
          points: ranking[pointsCol] || 0,
          tournaments: tournamentCounts.get(ranking.team_id) || 0,
          change: change,
          lastUpdate: new Date().toISOString().split('T')[0]
        }
      })
    } catch (error) {
      console.error('Error obteniendo equipos top:', error)
      return []
    }
  }

  /**
   * Método legacy para fallback cuando no hay datos pre-calculados
   */
  private async getTopTeamsLegacy(limit: number, referenceSeason: string): Promise<HomePageTeam[]> {
    try {
      const generalRanking = await hybridRankingService.getCombinedRanking(
        ['beach_mixed', 'beach_open', 'beach_women', 'grass_mixed', 'grass_open', 'grass_women'],
        referenceSeason
      )

      const teamIds = generalRanking.slice(0, limit).map(team => team.team_id)
      
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name, logo, region:regions(name)')
        .in('id', teamIds)

      const teamsMap = new Map(teamsData?.map(team => [team.id, team]) || [])

      const { data: tournamentStats } = await supabase
        .from('positions')
        .select('teamId')
        .in('teamId', teamIds)

      const tournamentCounts = new Map<string, number>()
      tournamentStats?.forEach(position => {
        const count = tournamentCounts.get(position.teamId) || 0
        tournamentCounts.set(position.teamId, count + 1)
      })

      const rankingWithChanges = await calculateGeneralPositionChange(generalRanking, referenceSeason)

      return rankingWithChanges.slice(0, limit).map((ranking, index) => {
        const team = teamsMap.get(ranking.team_id)
        const change = ranking.position_change || 0
        
        return {
          id: ranking.team_id,
          name: team?.name || 'Equipo desconocido',
          region: team?.region?.name || 'Sin región',
          regionCode: team?.region?.name ? team.region.name.substring(0, 3).toUpperCase() : 'N/A',
          logo: team?.logo,
          currentRank: index + 1,
          previousRank: index + 1 - change,
          points: ranking.total_points,
          tournaments: tournamentCounts.get(ranking.team_id) || 0,
          change: change,
          lastUpdate: new Date().toISOString().split('T')[0]
        }
      })
    } catch (error) {
      console.error('Error en getTopTeamsLegacy:', error)
      return []
    }
  }

  /**
   * Obtener regiones para filtros
   */
  async getRegions(): Promise<HomePageRegion[]> {
    try {
      const { data, error } = await supabase
        .from('regions')
        .select(`
          id,
          name,
          teams:teams(id)
        `)

      if (error) throw error

      // Obtener estadísticas de puntos por región
      const { data: regionStats, error: statsError } = await supabase
        .from('current_rankings')
        .select(`
          team_id,
          total_points,
          teams!inner(regionId)
        `)

      if (statsError) throw statsError

      // Calcular estadísticas por región
      const regionStatsMap = new Map<string, { teams: number, totalPoints: number }>()
      
      regionStats?.forEach(stat => {
        const regionId = stat.teams?.regionId
        if (regionId) {
          const current = regionStatsMap.get(regionId) || { teams: 0, totalPoints: 0 }
          regionStatsMap.set(regionId, {
            teams: current.teams + 1,
            totalPoints: current.totalPoints + stat.total_points
          })
        }
      })

      return (data || []).map(region => {
        const stats = regionStatsMap.get(region.id) || { teams: 0, totalPoints: 0 }
        return {
          id: region.id,
          name: region.name,
          code: region.name.substring(0, 3).toUpperCase(), // Generar código desde el nombre (sin columna code)
          teams: stats.teams,
          averagePoints: stats.teams > 0 ? stats.totalPoints / stats.teams : 0
        }
      })
    } catch (error) {
      console.error('Error obteniendo regiones:', error)
      return []
    }
  }

  /**
   * Obtener torneos finalizados
   */
  async getCompletedTournaments(limit: number = 4): Promise<HomePageTournament[]> {
    try {
      // Primero intentar con is_finished, si no existe usar fecha
      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          id,
          name,
          year,
          season,
          type,
          surface,
          category,
          startDate,
          endDate,
          is_finished
        `)
        .or('is_finished.eq.true,and(endDate.not.is.null,endDate.lt.' + new Date().toISOString().split('T')[0] + ')')
        .order('endDate', { ascending: false })
        .limit(limit)

      if (error) {
        console.warn('Error con is_finished, intentando con fecha:', error)
        // Fallback: usar solo fecha de fin
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('tournaments')
          .select(`
            id,
            name,
            year,
            season,
            type,
            surface,
            category,
            startDate,
            endDate
          `)
          .not('endDate', 'is', null)
          .lt('endDate', new Date().toISOString().split('T')[0])
          .order('endDate', { ascending: false })
          .limit(limit)

        if (fallbackError) throw fallbackError
        return this.processTournamentData(fallbackData || [])
      }

      return this.processTournamentData(data || [])
    } catch (error) {
      console.error('Error obteniendo torneos finalizados:', error)
      return []
    }
  }

  /**
   * Obtener próximos torneos
   */
  async getUpcomingTournaments(limit: number = 4): Promise<HomePageTournament[]> {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          id,
          name,
          year,
          season,
          type,
          surface,
          category,
          startDate,
          endDate,
          is_finished
        `)
        .or('is_finished.eq.false,and(startDate.gte.' + new Date().toISOString().split('T')[0] + ')')
        .order('startDate', { ascending: true })
        .limit(limit)

      if (error) {
        console.warn('Error con is_finished, intentando con fecha:', error)
        // Fallback: usar solo fecha de inicio
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('tournaments')
          .select(`
            id,
            name,
            year,
            season,
            type,
            surface,
            category,
            startDate,
            endDate
          `)
          .gte('startDate', new Date().toISOString().split('T')[0])
          .order('startDate', { ascending: true })
          .limit(limit)

        if (fallbackError) throw fallbackError
        return this.processTournamentData(fallbackData || [], 'upcoming')
      }

      return this.processTournamentData(data || [], 'upcoming')
    } catch (error) {
      console.error('Error obteniendo próximos torneos:', error)
      return []
    }
  }

  /**
   * Procesar datos de torneos
   */
  private async processTournamentData(tournaments: any[], defaultStatus: string = 'completed'): Promise<HomePageTournament[]> {
    if (!tournaments.length) return []

    // Obtener conteo de equipos por torneo
    const tournamentIds = tournaments.map(t => t.id)
    const { data: positionCounts, error: countError } = await supabase
      .from('positions')
      .select('tournamentId')
      .in('tournamentId', tournamentIds)

    if (countError) {
      console.warn('Error obteniendo conteo de equipos:', countError)
    }

    // Contar equipos por torneo
    const teamCounts = new Map<string, number>()
    positionCounts?.forEach(position => {
      const count = teamCounts.get(position.tournamentId) || 0
      teamCounts.set(position.tournamentId, count + 1)
    })

    return tournaments.map(tournament => {
      const teamCount = teamCounts.get(tournament.id) || 0
      const status = tournament.is_finished !== undefined ? 
        (tournament.is_finished ? 'completed' : 'upcoming') : 
        defaultStatus

      return {
        id: tournament.id,
        name: tournament.name,
        year: tournament.year,
        season: tournament.season || `${tournament.year}-${(tournament.year + 1).toString().slice(-2)}`,
        type: tournament.type,
        status,
        teams: teamCount,
        startDate: tournament.startDate,
        surface: tournament.surface,
        category: tournament.category
      }
    })
  }

  /**
   * Obtener torneos recientes
   */
  async getRecentTournaments(limit: number = 4): Promise<HomePageTournament[]> {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          id,
          name,
          year,
          season,
          type,
          surface,
          category,
          startDate,
          endDate,
          is_finished
        `)
        .order('startDate', { ascending: false })
        .limit(limit)

      if (error) throw error

      // Obtener conteo de equipos por torneo
      const tournamentIds = data?.map(t => t.id) || []
      const { data: positionCounts, error: countError } = await supabase
        .from('positions')
        .select('tournamentId')
        .in('tournamentId', tournamentIds)

      if (countError) throw countError

      // Contar equipos por torneo
      const teamCounts = new Map<string, number>()
      positionCounts?.forEach(position => {
        const count = teamCounts.get(position.tournamentId) || 0
        teamCounts.set(position.tournamentId, count + 1)
      })

      return (data || []).map(tournament => {
        const teamCount = teamCounts.get(tournament.id) || 0
        const now = new Date()
        const startDate = new Date(tournament.startDate)
        const endDate = tournament.endDate ? new Date(tournament.endDate) : null

        let status = 'upcoming'
        if (tournament.is_finished) {
          status = 'completed'
        } else if (startDate <= now && (!endDate || endDate >= now)) {
          status = 'ongoing'
        }

        return {
          id: tournament.id,
          name: tournament.name,
          year: tournament.year,
          season: tournament.season || `${tournament.year}-${(tournament.year + 1).toString().slice(-2)}`,
          type: tournament.type,
          status,
          teams: teamCount,
          startDate: tournament.startDate,
          surface: tournament.surface,
          category: tournament.category
        }
      })
    } catch (error) {
      console.error('Error obteniendo torneos recientes:', error)
      return []
    }
  }

  /**
   * Obtener estadísticas principales
   */
  async getMainStats(): Promise<HomePageStats> {
    try {
      // Contar equipos
      const { count: teamCount, error: teamError } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })

      if (teamError) throw teamError

      // Contar torneos
      const { count: tournamentCount, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*', { count: 'exact', head: true })

      if (tournamentError) throw tournamentError

      // Contar regiones
      const { count: regionCount, error: regionError } = await supabase
        .from('regions')
        .select('*', { count: 'exact', head: true })

      if (regionError) throw regionError

      // Calcular promedio de puntos
      const { data: pointsData, error: pointsError } = await supabase
        .from('current_rankings')
        .select('total_points')

      if (pointsError) throw pointsError

      const totalPoints = pointsData?.reduce((sum, item) => sum + item.total_points, 0) || 0
      const averagePoints = pointsData?.length ? totalPoints / pointsData.length : 0

      return {
        totalTeams: teamCount || 0,
        totalTournaments: tournamentCount || 0,
        totalRegions: regionCount || 0,
        averagePoints: Math.round(averagePoints)
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas principales:', error)
      return {
        totalTeams: 0,
        totalTournaments: 0,
        totalRegions: 0,
        averagePoints: 0
      }
    }
  }

  /**
   * Generar historial de ranking (simplificado)
   */
  async getRankingHistory(): Promise<RankingHistory[]> {
    try {
      // Por ahora, generar datos básicos basados en temporadas disponibles
      const { data: seasons, error } = await supabase
        .from('team_season_points')
        .select('season')
        .order('season', { ascending: false })
        .limit(6)

      if (error) throw error

      const uniqueSeasons = [...new Set(seasons?.map(s => s.season) || [])]
      
      return uniqueSeasons.map(season => {
        // Generar datos aproximados basados en la temporada
        const year = parseInt(season.split('-')[0])
        const month = Math.floor(Math.random() * 12) + 1
        const date = `${year}-${month.toString().padStart(2, '0')}`
        
        return {
          date,
          totalTeams: Math.floor(Math.random() * 20) + 40, // 40-60 equipos
          averagePoints: Math.floor(Math.random() * 200) + 1000 // 1000-1200 puntos
        }
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    } catch (error) {
      console.error('Error generando historial de ranking:', error)
      return []
    }
  }
}

export const homePageService = new HomePageService()
