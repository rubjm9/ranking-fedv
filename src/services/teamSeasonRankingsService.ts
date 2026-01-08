/**
 * Servicio para gestionar la tabla team_season_rankings
 * Rankings históricos por superficie con coeficientes de antigüedad aplicados
 */

import { supabase } from './supabaseService'

export interface TeamSeasonRanking {
  id: string
  team_id: string
  season: string
  beach_mixed_rank?: number
  beach_mixed_points: number
  beach_mixed_position_change?: number
  beach_mixed_points_change?: number
  beach_open_rank?: number
  beach_open_points: number
  beach_open_position_change?: number
  beach_open_points_change?: number
  beach_women_rank?: number
  beach_women_points: number
  beach_women_position_change?: number
  beach_women_points_change?: number
  grass_mixed_rank?: number
  grass_mixed_points: number
  grass_mixed_position_change?: number
  grass_mixed_points_change?: number
  grass_open_rank?: number
  grass_open_points: number
  grass_open_position_change?: number
  grass_open_points_change?: number
  grass_women_rank?: number
  grass_women_points: number
  grass_women_position_change?: number
  grass_women_points_change?: number
  subupdate_1_global_rank?: number
  subupdate_1_global_points?: number
  subupdate_1_global_position_change?: number
  subupdate_1_global_points_change?: number
  subupdate_2_global_rank?: number
  subupdate_2_global_points?: number
  subupdate_2_global_position_change?: number
  subupdate_2_global_points_change?: number
  subupdate_3_global_rank?: number
  subupdate_3_global_points?: number
  subupdate_3_global_position_change?: number
  subupdate_3_global_points_change?: number
  subupdate_4_global_rank?: number
  subupdate_4_global_points?: number
  subupdate_4_global_position_change?: number
  subupdate_4_global_points_change?: number
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

export type Surface = 'beach_mixed' | 'beach_open' | 'beach_women' | 'grass_mixed' | 'grass_open' | 'grass_women'

const SEASON_COEFFICIENTS = [1.0, 0.8, 0.5, 0.2]

// Helper: Obtener temporada anterior
const getPreviousSeason = (season: string): string => {
  const year = parseInt(season.split('-')[0])
  return `${year - 1}-${(year).toString().slice(-2)}`
}

const teamSeasonRankingsService = {
  /**
   * Obtiene los rankings de la temporada anterior para calcular cambios de posición
   */
  getPreviousSeasonRankings: async (
    season: string
  ): Promise<Map<string, { [key: string]: { rank: number; points: number } }>> => {
    try {
      if (!supabase) {
        return new Map()
      }

      const previousSeason = getPreviousSeason(season)

      const { data, error } = await supabase
        .from('team_season_rankings')
        .select(`
          team_id,
          beach_mixed_rank, beach_mixed_points,
          beach_open_rank, beach_open_points,
          beach_women_rank, beach_women_points,
          grass_mixed_rank, grass_mixed_points,
          grass_open_rank, grass_open_points,
          grass_women_rank, grass_women_points,
          subupdate_4_global_rank, subupdate_4_global_points
        `)
        .eq('season', previousSeason)

      if (error || !data) {
        console.log(`⚠️ No hay datos de la temporada anterior ${previousSeason}`)
        return new Map()
      }

      const previousRankings = new Map<string, { [key: string]: { rank: number; points: number } }>()

      data.forEach((row: any) => {
        previousRankings.set(row.team_id, {
          beach_mixed: { rank: row.beach_mixed_rank || 0, points: row.beach_mixed_points || 0 },
          beach_open: { rank: row.beach_open_rank || 0, points: row.beach_open_points || 0 },
          beach_women: { rank: row.beach_women_rank || 0, points: row.beach_women_points || 0 },
          grass_mixed: { rank: row.grass_mixed_rank || 0, points: row.grass_mixed_points || 0 },
          grass_open: { rank: row.grass_open_rank || 0, points: row.grass_open_points || 0 },
          grass_women: { rank: row.grass_women_rank || 0, points: row.grass_women_points || 0 },
          global: { rank: row.subupdate_4_global_rank || 0, points: row.subupdate_4_global_points || 0 }
        })
      })

      console.log(`📊 Datos de temporada anterior cargados: ${previousRankings.size} equipos`)
      return previousRankings

    } catch (error) {
      console.error('Error obteniendo rankings de temporada anterior:', error)
      return new Map()
    }
  },
  /**
   * Calcula el ranking para una superficie específica en una temporada
   */
  calculateSurfaceRanking: async (
    season: string,
    surface: Surface
  ): Promise<{ success: boolean; message: string; teamRankings: Array<{ team_id: string; rank: number; points: number }> }> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log(`🔄 Calculando ranking de ${surface} para temporada ${season}...`)

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
          ${surface}_points
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
        const basePoints = row[`${surface}_points`] || 0

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
        message: `Ranking de ${surface} calculado para ${season}`,
        teamRankings
      }

    } catch (error: any) {
      console.error(`❌ Error calculando ranking de ${surface}:`, error)
      return {
        success: false,
        message: error.message || 'Error desconocido',
        teamRankings: []
      }
    }
  },

  /**
   * Calcula rankings para todas las superficies en una temporada
   * Incluye cálculo de cambios de posición respecto a la temporada anterior
   */
  calculateSeasonRankings: async (
    season: string
  ): Promise<{ success: boolean; message: string; updated: number }> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log(`🚀 Calculando rankings para temporada ${season}...`)

      const surfaces: Surface[] = [
        'beach_mixed',
        'beach_open',
        'beach_women',
        'grass_mixed',
        'grass_open',
        'grass_women'
      ]

      // Obtener rankings de la temporada anterior para calcular cambios
      const previousRankings = await teamSeasonRankingsService.getPreviousSeasonRankings(season)

      // Calcular rankings para cada superficie
      const rankingsBySurface: { [key: string]: Array<{ team_id: string; rank: number; points: number }> } = {}

      for (const surface of surfaces) {
        const result = await teamSeasonRankingsService.calculateSurfaceRanking(season, surface)
        if (result.success) {
          rankingsBySurface[surface] = result.teamRankings
        }
      }

      // Obtener todos los equipos únicos
      const allTeamIds = new Set<string>()
      Object.values(rankingsBySurface).forEach(rankings => {
        rankings.forEach(r => allTeamIds.add(r.team_id))
      })

      // Preparar datos para upsert (incluyendo cambios de posición)
      const upsertData = Array.from(allTeamIds).map(teamId => {
        const rankingData: any = {
          team_id: teamId,
          season: season,
          calculated_at: new Date().toISOString()
        }

        // Obtener datos de la temporada anterior para este equipo
        const prevData = previousRankings.get(teamId)

        // Agregar datos de cada superficie (incluyendo cambios)
        surfaces.forEach(surface => {
          const rankings = rankingsBySurface[surface] || []
          const teamRanking = rankings.find(r => r.team_id === teamId)
          
          if (teamRanking) {
            rankingData[`${surface}_rank`] = teamRanking.rank
            rankingData[`${surface}_points`] = teamRanking.points

            // Calcular cambio de posición
            const prevRank = prevData?.[surface]?.rank || 0
            const prevPoints = prevData?.[surface]?.points || 0
            
            if (prevRank > 0) {
              // Positivo = subió (antes estaba en posición mayor/peor)
              rankingData[`${surface}_position_change`] = prevRank - teamRanking.rank
              rankingData[`${surface}_points_change`] = parseFloat((teamRanking.points - prevPoints).toFixed(2))
            } else {
              // Equipo nuevo, no hay cambio
              rankingData[`${surface}_position_change`] = 0
              rankingData[`${surface}_points_change`] = 0
            }
          } else {
            rankingData[`${surface}_rank`] = null
            rankingData[`${surface}_points`] = 0
            rankingData[`${surface}_position_change`] = 0
            rankingData[`${surface}_points_change`] = 0
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

      console.log(`✅ Rankings guardados: ${data?.length || 0} equipos (con cambios de posición)`)

      return {
        success: true,
        message: `Rankings calculados para temporada ${season} con cambios de posición`,
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
   * Obtiene el ranking completo de una superficie para una temporada
   */
  getSeasonRankingBySurface: async (
    season: string,
    surface: Surface
  ): Promise<RankingEntry[]> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('team_season_rankings')
        .select(`
          team_id,
          ${surface}_rank,
          ${surface}_points,
          teams(name, region:regions(name))
        `)
        .eq('season', season)
        .not(`${surface}_rank`, 'is', null)
        .order(`${surface}_rank`, { ascending: true })

      if (error) {
        console.error('Error obteniendo ranking:', error)
        throw error
      }

      return (data || []).map((row: any) => ({
        team_id: row.team_id,
        team_name: row.teams?.name || 'Equipo desconocido',
        region_name: row.teams?.region?.name || 'Sin región',
        rank: row[`${surface}_rank`],
        points: row[`${surface}_points`]
      }))

    } catch (error) {
      console.error('Error obteniendo ranking por superficie:', error)
      return []
    }
  },

  /**
   * Obtiene el historial de rankings de un equipo en una superficie
   */
  getTeamRankingHistory: async (
    teamId: string,
    surface: Surface
  ): Promise<Array<{ season: string; rank: number; points: number }>> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('team_season_rankings')
        .select(`
          season,
          ${surface}_rank,
          ${surface}_points
        `)
        .eq('team_id', teamId)
        .not(`${surface}_rank`, 'is', null)
        .order('season', { ascending: false })

      if (error) {
        console.error('Error obteniendo historial:', error)
        throw error
      }

      return (data || []).map((row: any) => ({
        season: row.season,
        rank: row[`${surface}_rank`],
        points: row[`${surface}_points`]
      }))

    } catch (error) {
      console.error('Error obteniendo historial de equipo:', error)
      return []
    }
  },

  /**
   * Obtiene el historial de ranking global de un equipo (usando subupdate_4)
   */
  getTeamGlobalRankingHistory: async (
    teamId: string
  ): Promise<Array<{ season: string; rank: number; points: number }>> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('team_season_rankings')
        .select(`
          season,
          subupdate_4_global_rank,
          subupdate_4_global_points
        `)
        .eq('team_id', teamId)
        .not('subupdate_4_global_rank', 'is', null)
        .order('season', { ascending: false })

      if (error) {
        console.error('Error obteniendo historial global:', error)
        throw error
      }

      return (data || []).map((row: any) => ({
        season: row.season,
        rank: row.subupdate_4_global_rank,
        points: row.subupdate_4_global_points || 0
      }))

    } catch (error) {
      console.error('Error obteniendo historial global de equipo:', error)
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
  },

  /**
   * Obtiene el ranking de una superficie con cambios de posición pre-calculados
   * Optimizado: No requiere cálculos adicionales en el frontend
   */
  getRankingWithPositionChanges: async (
    season: string,
    surface: Surface
  ): Promise<Array<{
    team_id: string
    team_name: string
    region_name: string
    logo?: string
    rank: number
    points: number
    position_change: number
    points_change: number
  }>> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('team_season_rankings')
        .select(`
          team_id,
          ${surface}_rank,
          ${surface}_points,
          ${surface}_position_change,
          ${surface}_points_change,
          teams(name, logo, region:regions(name))
        `)
        .eq('season', season)
        .not(`${surface}_rank`, 'is', null)
        .order(`${surface}_rank`, { ascending: true })

      if (error) {
        console.error('Error obteniendo ranking con cambios:', error)
        throw error
      }

      return (data || []).map((row: any) => ({
        team_id: row.team_id,
        team_name: row.teams?.name || 'Equipo desconocido',
        region_name: row.teams?.region?.name || 'Sin región',
        logo: row.teams?.logo || null,
        rank: row[`${surface}_rank`],
        points: row[`${surface}_points`],
        position_change: row[`${surface}_position_change`] || 0,
        points_change: row[`${surface}_points_change`] || 0
      }))

    } catch (error) {
      console.error('Error obteniendo ranking con cambios de posición:', error)
      return []
    }
  },

  /**
   * Obtiene el ranking global con cambios de posición pre-calculados
   * Usa la subtemporada más reciente disponible
   */
  getGlobalRankingWithPositionChanges: async (
    season: string,
    subupdate?: 1 | 2 | 3 | 4
  ): Promise<Array<{
    team_id: string
    team_name: string
    region_name: string
    logo?: string
    rank: number
    points: number
    position_change: number
    points_change: number
  }>> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      // Determinar qué subupdate usar
      let subupdateToUse = subupdate || 4

      // Si no se especifica, encontrar la más reciente disponible
      if (!subupdate) {
        for (let i = 4; i >= 1; i--) {
          const { data: checkData } = await supabase
            .from('team_season_rankings')
            .select('team_id')
            .eq('season', season)
            .not(`subupdate_${i}_global_rank`, 'is', null)
            .limit(1)

          if (checkData && checkData.length > 0) {
            subupdateToUse = i as 1 | 2 | 3 | 4
            break
          }
        }
      }

      const rankCol = `subupdate_${subupdateToUse}_global_rank`
      const pointsCol = `subupdate_${subupdateToUse}_global_points`
      const posChangeCol = `subupdate_${subupdateToUse}_global_position_change`
      const ptsChangeCol = `subupdate_${subupdateToUse}_global_points_change`

      const { data, error } = await supabase
        .from('team_season_rankings')
        .select(`
          team_id,
          ${rankCol},
          ${pointsCol},
          ${posChangeCol},
          ${ptsChangeCol},
          teams(name, logo, region:regions(name))
        `)
        .eq('season', season)
        .not(rankCol, 'is', null)
        .order(rankCol, { ascending: true })

      if (error) {
        console.error('Error obteniendo ranking global con cambios:', error)
        throw error
      }

      return (data || []).map((row: any) => ({
        team_id: row.team_id,
        team_name: row.teams?.name || 'Equipo desconocido',
        region_name: row.teams?.region?.name || 'Sin región',
        logo: row.teams?.logo || null,
        rank: row[rankCol],
        points: row[pointsCol],
        position_change: row[posChangeCol] || 0,
        points_change: row[ptsChangeCol] || 0
      }))

    } catch (error) {
      console.error('Error obteniendo ranking global con cambios de posición:', error)
      return []
    }
  }
}

export default teamSeasonRankingsService

