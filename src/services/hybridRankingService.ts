/**
 * Servicio híbrido de ranking
 * Combina datos brutos (positions) con cache materializada (team_season_points)
 * para optimizar rendimiento y permitir análisis históricos
 */

import { supabase } from './supabaseService'
import seasonPointsService, { CategoryPointsMap } from './seasonPointsService'
import { RankingEntry } from './rankingService'

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
   * Calcular ranking actual usando la tabla team_season_points
   * Mucho más rápido que calcular desde positions
   */
  getRankingFromSeasonPoints: async (
    category: keyof CategoryPointsMap,
    referenceSeason: string
  ): Promise<RankingEntry[]> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log(`📊 Calculando ranking de ${category} desde team_season_points...`)

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
          ${category}_points
        `)
        .in('season', seasons)
        .gt(`${category}_points`, 0)

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

      seasonData?.forEach(row => {
        const teamId = row.team_id
        const season = row.season
        const basePoints = row[`${category}_points`] || 0

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
          name,
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
      const rankingEntries: RankingEntry[] = (teams || []).map(team => ({
        team_id: team.id,
        team_name: team.name,
        region_name: team.regions?.name || 'N/A',
        ranking_category: category,
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
          name: team.name,
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
    category: keyof CategoryPointsMap
  ): Promise<RankingEntry[]> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log(`📜 Obteniendo ranking histórico de ${season} - ${category}...`)

      // Obtener las 4 temporadas considerando la temporada solicitada como referencia
      const referenceYear = parseInt(season.split('-')[0])
      const seasons = [
        season,
        formatSeason(referenceYear - 1),
        formatSeason(referenceYear - 2),
        formatSeason(referenceYear - 3)
      ]

      // Usar el mismo método que getRankingFromSeasonPoints
      return await hybridRankingService.getRankingFromSeasonPoints(category, season)

    } catch (error: any) {
      console.error('❌ Error obteniendo ranking histórico:', error)
      throw error
    }
  },

  /**
   * Actualizar team_season_points cuando cambian las posiciones
   * Llamar desde autoRankingService
   */
  updateSeasonPointsForCategory: async (
    category: keyof CategoryPointsMap,
    tournamentYear: number
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const season = formatSeason(tournamentYear)
      console.log(`🔄 Actualizando team_season_points para ${season} - ${category}...`)

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
   * Sincronizar team_season_points con current_rankings
   * Asegura que ambas tablas estén alineadas
   */
  syncWithCurrentRankings: async (
    category: keyof CategoryPointsMap,
    referenceSeason: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log(`🔄 Sincronizando ${category} con current_rankings...`)

      // Obtener ranking desde team_season_points
      const rankingEntries = await hybridRankingService.getRankingFromSeasonPoints(
        category,
        referenceSeason
      )

      if (rankingEntries.length === 0) {
        return {
          success: true,
          message: 'No hay datos para sincronizar'
        }
      }

      // Eliminar rankings antiguos de esta categoría
      const { error: deleteError } = await supabase
        .from('current_rankings')
        .delete()
        .eq('ranking_category', category)

      if (deleteError) {
        console.error('❌ Error eliminando rankings antiguos:', deleteError)
        throw deleteError
      }

      // Insertar nuevos rankings
      const rankingsToInsert = rankingEntries.map(entry => ({
        team_id: entry.team_id,
        ranking_category: category,
        current_season_points: entry.current_season_points,
        previous_season_points: entry.previous_season_points,
        two_seasons_ago_points: entry.two_seasons_ago_points,
        three_seasons_ago_points: entry.three_seasons_ago_points,
        total_points: entry.total_points,
        ranking_position: entry.ranking_position,
        last_calculated: new Date().toISOString()
      }))

      const { error: insertError } = await supabase
        .from('current_rankings')
        .insert(rankingsToInsert)

      if (insertError) {
        console.error('❌ Error insertando nuevos rankings:', insertError)
        throw insertError
      }

      console.log(`✅ ${rankingEntries.length} rankings sincronizados`)

      return {
        success: true,
        message: `${rankingEntries.length} rankings sincronizados exitosamente`
      }

    } catch (error: any) {
      console.error('❌ Error sincronizando rankings:', error)
      return {
        success: false,
        message: error.message || 'Error desconocido'
      }
    }
  },

  /**
   * Comparar dos temporadas
   */
  compareSeasons: async (
    season1: string,
    season2: string,
    category: keyof CategoryPointsMap
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
      console.log(`📊 Comparando temporadas ${season1} y ${season2} - ${category}...`)

      // Obtener rankings de ambas temporadas
      const [ranking1, ranking2] = await Promise.all([
        hybridRankingService.getHistoricalRanking(season1, category),
        hybridRankingService.getHistoricalRanking(season2, category)
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

