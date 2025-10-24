/**
 * Servicio para gestionar la tabla team_season_rankings
 * Rankings históricos por modalidad con coeficientes de antigüedad aplicados
 */

import { supabase } from './supabaseService'

export interface TeamSeasonRanking {
  id: string
  team_id: string
  season: string
  beach_mixed_rank?: number
  beach_mixed_points: number
  beach_open_rank?: number
  beach_open_points: number
  beach_women_rank?: number
  beach_women_points: number
  grass_mixed_rank?: number
  grass_mixed_points: number
  grass_open_rank?: number
  grass_open_points: number
  grass_women_rank?: number
  grass_women_points: number
  calculated_at: string
  created_at: string
  updated_at: string
}

export interface RankingEntry {
  team_id: string
  team_name: string
  region_name: string
  rank: number
  points: number
  breakdown?: {
    current_season: number
    previous_season: number
    two_seasons_ago: number
    three_seasons_ago: number
  }
}

export type Modality = 'beach_mixed' | 'beach_open' | 'beach_women' | 'grass_mixed' | 'grass_open' | 'grass_women'

const SEASON_COEFFICIENTS = [1.0, 0.8, 0.5, 0.2]

const teamSeasonRankingsService = {
  /**
   * Calcula el ranking para una modalidad específica en una temporada
   */
  calculateModalityRanking: async (
    season: string,
    modality: Modality
  ): Promise<{ success: boolean; message: string; teamRankings: Array<{ team_id: string; rank: number; points: number }> }> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log(`🔄 Calculando ranking de ${modality} para temporada ${season}...`)

      // Calcular las 4 temporadas a considerar
      const seasonYear = parseInt(season.split('-')[0])
      const seasons = [
        season,
        `${seasonYear - 1}-${(seasonYear).toString().slice(-2)}`,
        `${seasonYear - 2}-${(seasonYear - 1).toString().slice(-2)}`,
        `${seasonYear - 3}-${(seasonYear - 2).toString().slice(-2)}`
      ]

      console.log(`📅 Temporadas a considerar: ${seasons.join(', ')}`)

      // Obtener puntos base de team_season_points
      const { data: seasonPoints, error } = await supabase
        .from('team_season_points')
        .select(`
          team_id,
          season,
          ${modality}_points
        `)
        .in('season', seasons)

      if (error) {
        console.error('❌ Error obteniendo datos de team_season_points:', error)
        throw error
      }

      if (!seasonPoints || seasonPoints.length === 0) {
        console.log('⚠️ No hay datos de puntos para estas temporadas')
        return { success: true, message: 'No hay datos para procesar', teamRankings: [] }
      }

      // Calcular puntos totales con coeficientes por equipo
      const teamPointsMap: { [teamId: string]: number } = {}

      seasonPoints.forEach((row: any) => {
        const teamId = row.team_id
        const rowSeason = row.season
        const basePoints = row[`${modality}_points`] || 0

        if (basePoints <= 0) return

        // Aplicar coeficiente según antigüedad de la temporada
        const seasonIndex = seasons.indexOf(rowSeason)
        const coefficient = SEASON_COEFFICIENTS[seasonIndex] || 0
        const weightedPoints = basePoints * coefficient

        if (!teamPointsMap[teamId]) {
          teamPointsMap[teamId] = 0
        }
        teamPointsMap[teamId] += weightedPoints
      })

      // Ordenar por puntos y asignar rankings
      const teamRankings = Object.entries(teamPointsMap)
        .map(([teamId, totalPoints]) => ({
          team_id: teamId,
          points: parseFloat(totalPoints.toFixed(2)),
          rank: 0
        }))
        .filter(team => team.points > 0)
        .sort((a, b) => b.points - a.points)

      // Asignar rankings
      teamRankings.forEach((team, index) => {
        team.rank = index + 1
      })

      console.log(`✅ Ranking calculado: ${teamRankings.length} equipos`)

      return {
        success: true,
        message: `Ranking de ${modality} calculado para ${season}`,
        teamRankings
      }

    } catch (error: any) {
      console.error(`❌ Error calculando ranking de ${modality}:`, error)
      return {
        success: false,
        message: error.message || 'Error desconocido',
        teamRankings: []
      }
    }
  },

  /**
   * Calcula rankings para todas las modalidades en una temporada
   */
  calculateSeasonRankings: async (
    season: string
  ): Promise<{ success: boolean; message: string; updated: number }> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log(`🚀 Calculando rankings para temporada ${season}...`)

      const modalities: Modality[] = [
        'beach_mixed',
        'beach_open',
        'beach_women',
        'grass_mixed',
        'grass_open',
        'grass_women'
      ]

      // Calcular rankings para cada modalidad
      const rankingsByModality: { [key: string]: Array<{ team_id: string; rank: number; points: number }> } = {}

      for (const modality of modalities) {
        const result = await teamSeasonRankingsService.calculateModalityRanking(season, modality)
        if (result.success) {
          rankingsByModality[modality] = result.teamRankings
        }
      }

      // Obtener todos los equipos únicos
      const allTeamIds = new Set<string>()
      Object.values(rankingsByModality).forEach(rankings => {
        rankings.forEach(r => allTeamIds.add(r.team_id))
      })

      // Preparar datos para upsert
      const upsertData = Array.from(allTeamIds).map(teamId => {
        const rankingData: any = {
          team_id: teamId,
          season: season,
          calculated_at: new Date().toISOString()
        }

        // Agregar datos de cada modalidad
        modalities.forEach(modality => {
          const rankings = rankingsByModality[modality] || []
          const teamRanking = rankings.find(r => r.team_id === teamId)
          
          if (teamRanking) {
            rankingData[`${modality}_rank`] = teamRanking.rank
            rankingData[`${modality}_points`] = teamRanking.points
          } else {
            rankingData[`${modality}_rank`] = null
            rankingData[`${modality}_points`] = 0
          }
        })

        return rankingData
      })

      // Hacer upsert en la base de datos
      const { data, error } = await supabase
        .from('team_season_rankings')
        .upsert(upsertData, {
          onConflict: 'team_id,season',
          ignoreDuplicates: false
        })
        .select()

      if (error) {
        console.error('❌ Error guardando rankings:', error)
        throw error
      }

      console.log(`✅ Rankings guardados: ${data?.length || 0} equipos`)

      return {
        success: true,
        message: `Rankings calculados para temporada ${season}`,
        updated: data?.length || 0
      }

    } catch (error: any) {
      console.error('❌ Error calculando rankings de temporada:', error)
      return {
        success: false,
        message: error.message || 'Error desconocido',
        updated: 0
      }
    }
  },

  /**
   * Obtiene el ranking completo de una modalidad para una temporada
   */
  getSeasonRankingByModality: async (
    season: string,
    modality: Modality
  ): Promise<RankingEntry[]> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('team_season_rankings')
        .select(`
          team_id,
          ${modality}_rank,
          ${modality}_points,
          teams(name, region:regions(name))
        `)
        .eq('season', season)
        .not(`${modality}_rank`, 'is', null)
        .order(`${modality}_rank`, { ascending: true })

      if (error) {
        console.error('Error obteniendo ranking:', error)
        throw error
      }

      return (data || []).map((row: any) => ({
        team_id: row.team_id,
        team_name: row.teams?.name || 'Equipo desconocido',
        region_name: row.teams?.region?.name || 'Sin región',
        rank: row[`${modality}_rank`],
        points: row[`${modality}_points`]
      }))

    } catch (error) {
      console.error('Error obteniendo ranking por modalidad:', error)
      return []
    }
  },

  /**
   * Obtiene el historial de rankings de un equipo en una modalidad
   */
  getTeamRankingHistory: async (
    teamId: string,
    modality: Modality
  ): Promise<Array<{ season: string; rank: number; points: number }>> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('team_season_rankings')
        .select(`
          season,
          ${modality}_rank,
          ${modality}_points
        `)
        .eq('team_id', teamId)
        .not(`${modality}_rank`, 'is', null)
        .order('season', { ascending: false })

      if (error) {
        console.error('Error obteniendo historial:', error)
        throw error
      }

      return (data || []).map((row: any) => ({
        season: row.season,
        rank: row[`${modality}_rank`],
        points: row[`${modality}_points`]
      }))

    } catch (error) {
      console.error('Error obteniendo historial de equipo:', error)
      return []
    }
  },

  /**
   * Recalcula rankings para todas las temporadas disponibles
   */
  recalculateAllSeasons: async (): Promise<{ success: boolean; message: string; totalUpdated: number }> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log('🔄 Recalculando rankings para todas las temporadas...')

      // Obtener todas las temporadas únicas de team_season_points
      const { data: seasonData, error: seasonError } = await supabase
        .from('team_season_points')
        .select('season')
        .order('season', { ascending: false })

      if (seasonError) {
        throw seasonError
      }

      const uniqueSeasons = [...new Set((seasonData || []).map((s: any) => s.season))]
      console.log(`📅 Temporadas encontradas: ${uniqueSeasons.length}`)

      let totalUpdated = 0

      for (const season of uniqueSeasons) {
        console.log(`\n⏳ Procesando temporada ${season}...`)
        const result = await teamSeasonRankingsService.calculateSeasonRankings(season)
        
        if (result.success) {
          totalUpdated += result.updated
          console.log(`✅ ${result.updated} equipos actualizados`)
        } else {
          console.error(`❌ Error en ${season}: ${result.message}`)
        }
      }

      console.log(`\n🎉 Recálculo completado. Total: ${totalUpdated} registros actualizados`)

      return {
        success: true,
        message: `Rankings recalculados para ${uniqueSeasons.length} temporadas`,
        totalUpdated
      }

    } catch (error: any) {
      console.error('❌ Error recalculando todas las temporadas:', error)
      return {
        success: false,
        message: error.message || 'Error desconocido',
        totalUpdated: 0
      }
    }
  },

  /**
   * Obtiene todos los rankings de un equipo para una temporada
   */
  getTeamSeasonRankings: async (teamId: string, season: string): Promise<TeamSeasonRanking | null> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('team_season_rankings')
        .select('*')
        .eq('team_id', teamId)
        .eq('season', season)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No se encontró registro
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      console.error('Error obteniendo rankings de equipo:', error)
      return null
    }
  }
}

export default teamSeasonRankingsService

