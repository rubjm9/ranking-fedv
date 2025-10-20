/**
 * Servicio para obtener datos específicos de la homepage
 */

import { supabase } from './supabaseService'
import hybridRankingService from './hybridRankingService'

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
  modality: string
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
   * Obtener equipos para el ranking principal de la homepage
   */
  async getTopTeams(limit: number = 10): Promise<HomePageTeam[]> {
    try {
      // Obtener ranking general combinado (todos los puntos)
      const generalRanking = await hybridRankingService.getCombinedRanking(
        ['beach_mixed', 'beach_open', 'beach_women', 'grass_mixed', 'grass_open', 'grass_women'],
        '2024-25'
      )

      // Obtener información de equipos y regiones
      const teamIds = generalRanking.slice(0, limit).map(team => team.team_id)
      
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          logo,
          region:regions(name, code)
        `)
        .in('id', teamIds)

      if (teamsError) throw teamsError

      // Crear mapa de equipos para acceso rápido
      const teamsMap = new Map(teamsData?.map(team => [team.id, team]) || [])

      // Obtener estadísticas de torneos por equipo
      const { data: tournamentStats, error: statsError } = await supabase
        .from('positions')
        .select('teamId')
        .in('teamId', teamIds)

      if (statsError) throw statsError

      // Contar torneos por equipo
      const tournamentCounts = new Map<string, number>()
      tournamentStats?.forEach(position => {
        const count = tournamentCounts.get(position.teamId) || 0
        tournamentCounts.set(position.teamId, count + 1)
      })

      // Construir respuesta
      return generalRanking.slice(0, limit).map((ranking, index) => {
        const team = teamsMap.get(ranking.team_id)
        const tournaments = tournamentCounts.get(ranking.team_id) || 0
        
        return {
          id: ranking.team_id,
          name: team?.name || 'Equipo desconocido',
          region: team?.region?.name || 'Sin región',
          regionCode: team?.region?.code || 'N/A',
          logo: team?.logo,
          currentRank: index + 1,
          previousRank: index + 1, // TODO: Calcular ranking anterior
          points: ranking.total_points,
          tournaments,
          change: 0, // TODO: Calcular cambio real
          lastUpdate: new Date().toISOString().split('T')[0]
        }
      })
    } catch (error) {
      console.error('Error obteniendo equipos top:', error)
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
          code,
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
          code: region.code || region.name.substring(0, 3).toUpperCase(),
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
          modality,
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
          modality: tournament.modality
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
