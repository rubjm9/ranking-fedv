/**
 * Servicio híbrido de ranking
 * Combina datos brutos (positions) con cache materializada (team_season_points)
 * para optimizar rendimiento y permitir análisis históricos
 */

import { supabase } from './supabaseService'
import seasonPointsService, { SurfacePointsMap } from './seasonPointsService'
import { RankingEntry } from './rankingService'
import teamSeasonRankingsService, { type Surface } from './teamSeasonRankingsService'
import {
  getTeamDisplayNameForCategory,
  TEAM_RANKING_NAME_SELECT,
} from '@/utils/teamNames'

// Formatear temporada (YYYY-YY)
const formatSeason = (year: number): string => {
  const nextYear = (year + 1).toString().slice(-2)
  return `${year}-${nextYear}`
}

// Obtener coeficiente de antigüedad por temporada
const getSeasonCoefficient = (season: string, referenceSeason: string): number => {
  const referenceYear = parseInt(referenceSeason.split('-')[0])
  const seasonYear = parseInt(season.split('-')[0])
  const yearsDiff = referenceYear - seasonYear
  
  // Coeficientes de antigüedad basados en la temporada de referencia
  switch (yearsDiff) {
    case 0: return 1.0  // Temporada de referencia (completa)
    case 1: return 0.8   // 1 año atrás
    case 2: return 0.5    // 2 años atrás
    case 3: return 0.2    // 3 años atrás
    default: return 0.0  // Más de 3 años
  }
}

const hybridRankingService = {
  /**
   * Obtener la temporada más reciente
   * Busca la temporada más reciente con datos en team_season_points
   */
  getMostRecentSeason: async (): Promise<string> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      // Obtener la temporada más reciente de team_season_points
      const { data, error } = await supabase
        .from('team_season_points')
        .select('season')
        .order('season', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        // Si no hay datos, calcular basándose en el año actual
        const currentYear = new Date().getFullYear()
        const currentMonth = new Date().getMonth() + 1
        
        // Si estamos después de julio, la temporada actual es año-año+1
        // Si estamos antes de julio, la temporada actual es año-1-año
        if (currentMonth >= 7) {
          return formatSeason(currentYear)
        } else {
          return formatSeason(currentYear - 1)
        }
      }

      return data.season
    } catch (error: any) {
      console.warn('⚠️ Error obteniendo temporada más reciente, usando temporada por defecto:', error.message)
      // Fallback: calcular basándose en el año actual
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth() + 1
      
      if (currentMonth >= 7) {
        return formatSeason(currentYear)
      } else {
        return formatSeason(currentYear - 1)
      }
    }
  },

  /**
   * Obtener la temporada más reciente disponible para una categoría específica
   * Busca la temporada más reciente que tenga datos (puntos > 0) para esa categoría
   */
  getMostRecentSeasonForCategory: async (category: keyof SurfacePointsMap): Promise<string> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      const pointsColumn = `${category}_points`

      // Obtener la temporada más reciente que tenga datos para esta categoría
      const { data, error } = await supabase
        .from('team_season_points')
        .select('season')
        .gt(pointsColumn, 0)
        .order('season', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        // Si no hay datos para esta categoría, usar la temporada más reciente global
        console.warn(`⚠️ No hay datos para ${category}, usando temporada global más reciente`)
        return await hybridRankingService.getMostRecentSeason()
      }

      return data.season
    } catch (error: any) {
      console.warn(`⚠️ Error obteniendo temporada más reciente para ${category}, usando temporada global:`, error.message)
      // Fallback: usar temporada global más reciente
      return await hybridRankingService.getMostRecentSeason()
    }
  },

  /**
   * Obtener ranking desde team_season_rankings (nuevo sistema optimizado)
   * Usa rankings pre-calculados con coeficientes aplicados
   */
  getRankingFromTeamSeasonRankings: async (
    surface: keyof SurfacePointsMap,
    season: string
  ): Promise<RankingEntry[]> => {
    try {
      console.log(`📊 Obteniendo ranking de ${surface} desde team_season_rankings para ${season}...`)
      
      const surfaceType = surface as Surface
      const rankings = await teamSeasonRankingsService.getSeasonRankingBySurface(season, surfaceType)
      
      // Convertir al formato esperado
      const rankingEntries: RankingEntry[] = rankings.map(entry => ({
        team_id: entry.team_id,
        team_name: entry.team_name,
        region_name: entry.region_name || '',
        ranking_category: surface,
        current_season_points: entry.points, // Puntos totales con coeficientes
        previous_season_points: 0,
        two_seasons_ago_points: 0,
        three_seasons_ago_points: 0,
        total_points: entry.points,
        ranking_position: entry.rank,
        last_calculated: new Date().toISOString(),
        season_breakdown: {}
      }))
      
      console.log(`✅ ${rankingEntries.length} equipos obtenidos`)
      return rankingEntries
      
    } catch (error) {
      console.error(`❌ Error obteniendo ranking de ${surface}:`, error)
      return []
    }
  },

  /**
   * Calcular ranking general (suma de todas las superficies)
   * Usa team_season_rankings para obtener datos históricos
   */
  getGeneralRanking: async (referenceSeason: string): Promise<RankingEntry[]> => {
    try {
      console.log(`📊 Calculando ranking general para temporada ${referenceSeason}...`)
      
      // Usar el nuevo sistema para obtener rankings por superficie
      const surfaces: (keyof SurfacePointsMap)[] = [
        'beach_mixed', 
        'beach_open', 
        'beach_women', 
        'grass_mixed', 
        'grass_open', 
        'grass_women'
      ]
      
      // Obtener rankings de todas las superficies
      const allRankings = await Promise.all(
        surfaces.map(surface => 
          teamSeasonRankingsService.getSeasonRankingBySurface(referenceSeason, surface as Surface)
        )
      )
      
      // Calcular puntos totales por equipo (suma de todas las superficies)
      const teamTotals: { [teamId: string]: {
        team_name: string
        region_name: string
        total_points: number
        surface_points: { [surface: string]: number }
      }} = {}
      
      allRankings.forEach((rankings, index) => {
        const surface = surfaces[index]
        rankings.forEach(team => {
          if (!teamTotals[team.team_id]) {
            teamTotals[team.team_id] = {
              team_name: team.team_name,
              region_name: team.region_name || '',
              total_points: 0,
              surface_points: {}
            }
          }
          teamTotals[team.team_id].total_points += team.points
          teamTotals[team.team_id].surface_points[surface] = team.points
        })
      })
      
      // Ordenar y crear ranking final
      const sortedTeams = Object.entries(teamTotals)
        .map(([team_id, data]) => ({
          team_id,
          total_points: data.total_points,
          team_name: data.team_name,
          region_name: data.region_name,
          surface_points: data.surface_points
        }))
        .sort((a, b) => b.total_points - a.total_points)
      
      const rankingEntries: RankingEntry[] = sortedTeams.map((team, index) => ({
        team_id: team.team_id,
        team_name: team.team_name,
        region_name: team.region_name,
        ranking_category: 'general_all' as any,
        current_season_points: team.total_points,
        previous_season_points: 0,
        two_seasons_ago_points: 0,
        three_seasons_ago_points: 0,
        total_points: team.total_points,
        ranking_position: index + 1,
        last_calculated: new Date().toISOString(),
        season_breakdown: team.surface_points
      }))
      
      console.log(`✅ Ranking general calculado: ${rankingEntries.length} equipos`)
      return rankingEntries
      
    } catch (error) {
      console.error('❌ Error calculando ranking general:', error)
      return []
    }
  },

  /**
   * Calcular ranking actual usando la tabla team_season_points
   * Mucho más rápido que calcular desde positions
   */
  getRankingFromSeasonPoints: async (
    surface: keyof SurfacePointsMap,
    referenceSeason: string
  ): Promise<RankingEntry[]> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log(`📊 Calculando ranking de ${surface} desde team_season_points...`)

      // Obtener las últimas 4 temporadas
      const referenceYear = parseInt(referenceSeason.split('-')[0])
      const seasons = [
        referenceSeason,
        formatSeason(referenceYear - 1),
        formatSeason(referenceYear - 2),
        formatSeason(referenceYear - 3)
      ]

      console.log(`📅 Temporadas a considerar: ${seasons.join(', ')}`)

      // Obtener datos de team_season_points para estas temporadas
      const { data: seasonData, error } = await supabase
        .from('team_season_points')
        .select(`
          team_id,
          season,
          ${surface}_points
        `)
        .in('season', seasons)
        .gt(`${surface}_points`, 0)

      if (error) {
        console.error('❌ Error obteniendo datos de temporada:', error)
        throw error
      }

      console.log(`📦 Registros obtenidos: ${seasonData?.length || 0}`)

      // Agrupar por equipo y calcular puntos totales
      const teamPointsMap: { [teamId: string]: {
        current_season_points: number
        previous_season_points: number
        two_seasons_ago_points: number
        three_seasons_ago_points: number
        total_points: number
        season_breakdown: {
          [season: string]: {
            base_points: number
            weighted_points: number
            coefficient: number
          }
        }
      }} = {}

      seasonData?.forEach((row: any) => {
        const teamId = row.team_id
        const season = row.season
        const basePoints = row[`${surface}_points`] || 0

        if (!teamPointsMap[teamId]) {
          teamPointsMap[teamId] = {
            current_season_points: 0,
            previous_season_points: 0,
            two_seasons_ago_points: 0,
            three_seasons_ago_points: 0,
            total_points: 0,
            season_breakdown: {}
          }
        }

        // Calcular coeficiente y puntos ponderados
        const coefficient = getSeasonCoefficient(season, referenceSeason)
        const weightedPoints = basePoints * coefficient

        // Asignar a la temporada correspondiente
        if (season === seasons[0]) {
          teamPointsMap[teamId].current_season_points = basePoints
        } else if (season === seasons[1]) {
          teamPointsMap[teamId].previous_season_points = basePoints
        } else if (season === seasons[2]) {
          teamPointsMap[teamId].two_seasons_ago_points = basePoints
        } else if (season === seasons[3]) {
          teamPointsMap[teamId].three_seasons_ago_points = basePoints
        }

        // Agregar al desglose
        teamPointsMap[teamId].season_breakdown[season] = {
          base_points: basePoints,
          weighted_points: weightedPoints,
          coefficient
        }

        // Sumar al total
        teamPointsMap[teamId].total_points += weightedPoints
      })

      // Obtener información de equipos
      const teamIds = Object.keys(teamPointsMap)
      console.log(`👥 Equipos únicos: ${teamIds.length}`)

      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          logo,
          ${TEAM_RANKING_NAME_SELECT},
          regionId,
          regions:regionId(
            id,
            name
          )
        `)
        .in('id', teamIds)

      if (teamsError) {
        console.error('❌ Error obteniendo equipos:', teamsError)
        throw teamsError
      }

      // Crear entradas de ranking
      const rankingEntries: RankingEntry[] = (teams || []).map((team: any) => ({
        team_id: team.id,
        team_name: getTeamDisplayNameForCategory(team, surface),
        logo: team.logo ?? null,
        region_name: team.regions?.name || 'N/A',
        ranking_category: surface,
        current_season_points: teamPointsMap[team.id].current_season_points,
        previous_season_points: teamPointsMap[team.id].previous_season_points,
        two_seasons_ago_points: teamPointsMap[team.id].two_seasons_ago_points,
        three_seasons_ago_points: teamPointsMap[team.id].three_seasons_ago_points,
        total_points: teamPointsMap[team.id].total_points,
        ranking_position: 0, // Se asignará después de ordenar
        last_calculated: new Date().toISOString(),
        season_breakdown: teamPointsMap[team.id].season_breakdown,
        team: {
          id: team.id,
          name: getTeamDisplayNameForCategory(team, surface),
          regionId: team.regionId,
          region: team.regions ? {
            id: team.regions.id,
            name: team.regions.name
          } : undefined
        }
      }))

      // Ordenar por puntos totales y asignar posiciones
      rankingEntries.sort((a, b) => b.total_points - a.total_points)
      rankingEntries.forEach((entry, index) => {
        entry.ranking_position = index + 1
      })

      console.log(`✅ Ranking calculado: ${rankingEntries.length} equipos`)

      return rankingEntries

    } catch (error: any) {
      console.error('❌ Error calculando ranking desde team_season_points:', error)
      throw error
    }
  },

  /**
   * Obtener ranking histórico de una temporada específica
   */
  getHistoricalRanking: async (
    season: string,
    surface: keyof SurfacePointsMap
  ): Promise<RankingEntry[]> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log(`📜 Obteniendo ranking histórico de ${season} - ${surface}...`)

      // Usar el mismo método que getRankingFromSeasonPoints
      return await hybridRankingService.getRankingFromSeasonPoints(surface, season)

    } catch (error: any) {
      console.error('❌ Error obteniendo ranking histórico:', error)
      throw error
    }
  },

  /**
   * Actualizar team_season_points cuando cambian las posiciones
   * Llamar desde autoRankingService
   */
  updateSeasonPointsForSurface: async (
    surface: keyof SurfacePointsMap,
    tournamentYear: number
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const season = formatSeason(tournamentYear)
      console.log(`🔄 Actualizando team_season_points para ${season} - ${surface}...`)

      // Recalcular y guardar puntos de la temporada
      const result = await seasonPointsService.calculateAndSaveSeasonPoints(season)

      return result

    } catch (error: any) {
      console.error('❌ Error actualizando season points:', error)
      return {
        success: false,
        message: error.message || 'Error desconocido'
      }
    }
  },

  /**
   * Calcular ranking combinado (suma de múltiples superficies)
   */
  getCombinedRanking: async (
    surfaces: (keyof SurfacePointsMap)[],
    referenceSeason: string
  ): Promise<RankingEntry[]> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log(`📊 Calculando ranking combinado de [${surfaces.join(', ')}] desde team_season_points...`)

      // Obtener las últimas 4 temporadas
      const referenceYear = parseInt(referenceSeason.split('-')[0])
      const seasons = [
        referenceSeason,
        formatSeason(referenceYear - 1),
        formatSeason(referenceYear - 2),
        formatSeason(referenceYear - 3)
      ]

      console.log(`📅 Temporadas a considerar: ${seasons.join(', ')}`)

      // Construir la selección dinámica de columnas para todas las superficies
      const pointsColumns = surfaces.map(surf => `${surf}_points`).join(', ')

      // Obtener datos de team_season_points para estas temporadas
      const { data: seasonData, error } = await supabase
        .from('team_season_points')
        .select(`
          team_id,
          season,
          ${pointsColumns}
        `)
        .in('season', seasons)

      if (error) {
        console.error('❌ Error obteniendo datos de temporada:', error)
        throw error
      }

      console.log(`📦 Registros obtenidos: ${seasonData?.length || 0}`)

      // Agrupar por equipo y calcular puntos totales
      const teamPointsMap: { [teamId: string]: {
        current_season_points: number
        previous_season_points: number
        two_seasons_ago_points: number
        three_seasons_ago_points: number
        total_points: number
        season_breakdown: {
          [season: string]: {
            base_points: number
            weighted_points: number
            coefficient: number
          }
        }
      }} = {}

      seasonData?.forEach((row: any) => {
        const teamId = row.team_id
        const season = row.season

        // Sumar puntos de todas las superficies para esta temporada
        let basePoints = 0
        surfaces.forEach(surf => {
          basePoints += row[`${surf}_points`] || 0
        })

        if (basePoints === 0) return // Saltar si no hay puntos

        if (!teamPointsMap[teamId]) {
          teamPointsMap[teamId] = {
            current_season_points: 0,
            previous_season_points: 0,
            two_seasons_ago_points: 0,
            three_seasons_ago_points: 0,
            total_points: 0,
            season_breakdown: {}
          }
        }

        // Calcular coeficiente y puntos ponderados
        const coefficient = getSeasonCoefficient(season, referenceSeason)
        const weightedPoints = basePoints * coefficient

        // Asignar a la temporada correspondiente
        if (season === seasons[0]) {
          teamPointsMap[teamId].current_season_points += basePoints
        } else if (season === seasons[1]) {
          teamPointsMap[teamId].previous_season_points += basePoints
        } else if (season === seasons[2]) {
          teamPointsMap[teamId].two_seasons_ago_points += basePoints
        } else if (season === seasons[3]) {
          teamPointsMap[teamId].three_seasons_ago_points += basePoints
        }

        // Agregar o actualizar el desglose
        if (!teamPointsMap[teamId].season_breakdown[season]) {
          teamPointsMap[teamId].season_breakdown[season] = {
            base_points: 0,
            weighted_points: 0,
            coefficient
          }
        }
        teamPointsMap[teamId].season_breakdown[season].base_points += basePoints
        teamPointsMap[teamId].season_breakdown[season].weighted_points += weightedPoints

        // Sumar al total
        teamPointsMap[teamId].total_points += weightedPoints
      })

      // Obtener información de equipos
      const teamIds = Object.keys(teamPointsMap)
      console.log(`👥 Equipos únicos: ${teamIds.length}`)

      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          ${TEAM_RANKING_NAME_SELECT},
          regionId,
          regions:regionId(
            id,
            name
          )
        `)
        .in('id', teamIds)

      if (teamsError) {
        console.error('❌ Error obteniendo equipos:', teamsError)
        throw teamsError
      }

      // Crear entradas de ranking
      const rankingEntries: RankingEntry[] = (teams || []).map((team: any) => ({
        team_id: team.id,
        team_name: getTeamDisplayNameForCategory(team, null, surfaces),
        region_name: team.regions?.name || 'N/A',
        ranking_category: surfaces.join('_'), // Superficie combinada
        current_season_points: teamPointsMap[team.id].current_season_points,
        previous_season_points: teamPointsMap[team.id].previous_season_points,
        two_seasons_ago_points: teamPointsMap[team.id].two_seasons_ago_points,
        three_seasons_ago_points: teamPointsMap[team.id].three_seasons_ago_points,
        total_points: teamPointsMap[team.id].total_points,
        ranking_position: 0, // Se asignará después de ordenar
        last_calculated: new Date().toISOString(),
        season_breakdown: teamPointsMap[team.id].season_breakdown,
        team: {
          id: team.id,
          name: getTeamDisplayNameForCategory(team, null, surfaces),
          regionId: team.regionId,
          region: team.regions ? {
            id: team.regions.id,
            name: team.regions.name
          } : undefined
        }
      }))

      // Ordenar por puntos totales y asignar posiciones
      rankingEntries.sort((a, b) => b.total_points - a.total_points)
      rankingEntries.forEach((entry, index) => {
        entry.ranking_position = index + 1
      })

      console.log(`✅ Ranking combinado calculado: ${rankingEntries.length} equipos`)

      return rankingEntries

    } catch (error: any) {
      console.error('❌ Error calculando ranking combinado:', error)
      throw error
    }
  },

  /**
   * Comparar dos temporadas
   */
  compareSeasons: async (
    season1: string,
    season2: string,
    surface: keyof SurfacePointsMap
  ): Promise<{
    season1_ranking: RankingEntry[]
    season2_ranking: RankingEntry[]
    changes: {
      team_id: string
      team_name: string
      position_change: number
      points_change: number
    }[]
  }> => {
    try {
      console.log(`📊 Comparando temporadas ${season1} y ${season2} - ${surface}...`)

      // Obtener rankings de ambas temporadas
      const [ranking1, ranking2] = await Promise.all([
        hybridRankingService.getHistoricalRanking(season1, surface),
        hybridRankingService.getHistoricalRanking(season2, surface)
      ])

      // Calcular cambios
      const changes = ranking1.map(entry1 => {
        const entry2 = ranking2.find(e => e.team_id === entry1.team_id)
        
        return {
          team_id: entry1.team_id,
          team_name: entry1.team_name,
          position_change: entry2 
            ? entry2.ranking_position - entry1.ranking_position 
            : 0,
          points_change: entry2
            ? entry1.total_points - entry2.total_points
            : entry1.total_points
        }
      })

      // Ordenar por cambio de posición (más subida primero)
      changes.sort((a, b) => b.position_change - a.position_change)

      return {
        season1_ranking: ranking1,
        season2_ranking: ranking2,
        changes
      }

    } catch (error: any) {
      console.error('❌ Error comparando temporadas:', error)
      throw error
    }
  }
}

export default hybridRankingService

