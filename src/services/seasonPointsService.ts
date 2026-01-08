/**
 * Servicio para gestionar la tabla team_season_points
 * Cache materializada de puntos por equipo y temporada
 */

import { supabase } from './supabaseService'
import teamSeasonRankingsService from './teamSeasonRankingsService'

export interface SeasonPoints {
  id: string
  team_id: string
  season: string
  beach_mixed_points: number
  beach_open_points: number
  beach_women_points: number
  grass_mixed_points: number
  grass_open_points: number
  grass_women_points: number
  last_updated: string
  is_complete: boolean
  completion_date?: string
  tournaments_played?: {
    beach_mixed?: number
    beach_open?: number
    beach_women?: number
    grass_mixed?: number
    grass_open?: number
    grass_women?: number
  }
  // Rankings por subtemporada
  subseason_1_beach_mixed_rank?: number        // Ranking en subtemporada 1: playa mixto
  subseason_2_beach_open_women_rank?: number  // Ranking en subtemporada 2: playa open/women
  subseason_3_grass_mixed_rank?: number       // Ranking en subtemporada 3: césped mixto
  subseason_4_grass_open_women_rank?: number  // Ranking en subtemporada 4: césped open/women
  final_season_global_rank?: number           // Ranking global final de la temporada
  subseason_ranks_calculated_at?: string       // Timestamp de cuando se calcularon los rankings
}

export interface SurfacePointsMap {
  beach_mixed: number
  beach_open: number
  beach_women: number
  grass_mixed: number
  grass_open: number
  grass_women: number
}

const seasonPointsService = {
  /**
   * Calcular y guardar puntos de una temporada específica para un equipo
   */
  calculateAndSaveSeasonPoints: async (
    season: string,
    teamId?: string
  ): Promise<{ success: boolean; message: string; updated: number }> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log(`📊 Calculando puntos para temporada ${season}${teamId ? ` y equipo ${teamId}` : ''}...`)

      // Obtener el año de la temporada (ej: "2024-25" -> 2024)
      const seasonYear = parseInt(season.split('-')[0])

      // Construir query de posiciones
      let query = supabase
        .from('positions')
        .select(`
          id,
          position,
          points,
          teamId,
          tournamentId,
          tournaments:tournamentId(
            id,
            name,
            year,
            surface,
            category
          ),
          teams:teamId(
            id,
            name
          )
        `)
        .eq('tournaments.year', seasonYear)

      if (teamId) {
        query = query.eq('teamId', teamId)
      }

      const { data: positions, error: positionsError } = await query

      if (positionsError) {
        console.error('❌ Error obteniendo posiciones:', positionsError)
        throw positionsError
      }

      if (!positions || positions.length === 0) {
        console.log('⚠️ No hay posiciones para esta temporada')
        return { success: true, message: 'No hay posiciones para procesar', updated: 0 }
      }

      // Agrupar puntos por equipo y superficie
      const teamPointsMap: { [teamId: string]: Partial<SurfacePointsMap> & { tournaments_played: Partial<SurfacePointsMap>, best_position: Partial<SurfacePointsMap> } } = {}

      positions.forEach(position => {
        const tournament = position.tournaments
        const team = position.teams

        if (!tournament || !team || !tournament.surface || !tournament.category) {
          return
        }

        const surface = `${tournament.surface.toLowerCase()}_${tournament.category.toLowerCase()}` as keyof SurfacePointsMap
        const tid = team.id

        if (!teamPointsMap[tid]) {
          teamPointsMap[tid] = {
            tournaments_played: {},
            best_position: {}
          }
        }

        // Sumar puntos
        if (!teamPointsMap[tid][surface]) {
          teamPointsMap[tid][surface] = 0
        }
        teamPointsMap[tid][surface]! += position.points || 0

        // Contar torneos
        if (!teamPointsMap[tid].tournaments_played[surface]) {
          teamPointsMap[tid].tournaments_played[surface] = 0
        }
        teamPointsMap[tid].tournaments_played[surface]! += 1

        // Mejor posición
        const currentBest = teamPointsMap[tid].best_position[surface]
        if (!currentBest || position.position < currentBest) {
          teamPointsMap[tid].best_position[surface] = position.position
        }
      })

      // Preparar datos para upsert
      const upsertData = Object.keys(teamPointsMap).map(tid => {
        return {
          team_id: tid,
          season: season,
          beach_mixed_points: teamPointsMap[tid].beach_mixed || 0,
          beach_open_points: teamPointsMap[tid].beach_open || 0,
          beach_women_points: teamPointsMap[tid].beach_women || 0,
          grass_mixed_points: teamPointsMap[tid].grass_mixed || 0,
          grass_open_points: teamPointsMap[tid].grass_open || 0,
          grass_women_points: teamPointsMap[tid].grass_women || 0,
          tournaments_played: Object.values(teamPointsMap[tid].tournaments_played).reduce((sum, count) => sum + (count || 0), 0),
          best_position: Math.min(...Object.values(teamPointsMap[tid].best_position).filter(pos => pos !== null && pos !== undefined)),
          last_updated: new Date().toISOString()
        }
      })

      console.log(`💾 Guardando ${upsertData.length} registros válidos (de ${Object.keys(teamPointsMap).length} equipos totales)...`)

      // Upsert en la base de datos
      const { data: upsertedData, error: upsertError } = await supabase
        .from('team_season_points')
        .upsert(upsertData, {
          onConflict: 'team_id,season',
          ignoreDuplicates: false
        })
        .select()

      if (upsertError) {
        console.error('❌ Error en upsert:', upsertError)
        throw upsertError
      }

      console.log(`✅ ${upsertedData?.length || 0} registros actualizados`)

      return {
        success: true,
        message: `Temporada ${season} calculada exitosamente`,
        updated: upsertedData?.length || 0
      }

    } catch (error: any) {
      console.error('❌ Error calculando puntos de temporada:', error)
      return {
        success: false,
        message: error.message || 'Error desconocido',
        updated: 0
      }
    }
  },

  /**
   * Marcar una temporada/superficie como completa
   */
  closeSeason: async (
    season: string,
    surface?: keyof SurfacePointsMap
  ): Promise<{ success: boolean; message: string }> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log(`🔒 Cerrando temporada ${season}${surface ? ` para ${surface}` : ''}...`)

      // Si se especifica superficie, solo marcar como completa esa superficie
      // Esto se implementará cuando tengamos un sistema más granular
      // Por ahora, marcar toda la temporada como completa

      const { data, error } = await supabase
        .from('team_season_points')
        .update({
          is_complete: true,
          completion_date: new Date().toISOString()
        })
        .eq('season', season)
        .select()

      if (error) {
        console.error('❌ Error cerrando temporada:', error)
        throw error
      }

      console.log(`✅ Temporada ${season} marcada como completa (${data?.length || 0} registros)`)

      return {
        success: true,
        message: `Temporada ${season} cerrada exitosamente`
      }

    } catch (error: any) {
      console.error('❌ Error cerrando temporada:', error)
      return {
        success: false,
        message: error.message || 'Error desconocido'
      }
    }
  },

  /**
   * Obtener puntos de un equipo en una temporada específica
   */
  getTeamSeasonPoints: async (
    teamId: string,
    season: string
  ): Promise<SeasonPoints | null> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('team_season_points')
        .select('*')
        .eq('team_id', teamId)
        .eq('season', season)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No encontrado
          return null
        }
        throw error
      }

      return data
    } catch (error: any) {
      console.error('❌ Error obteniendo puntos de temporada:', error)
      return null
    }
  },

  /**
   * Obtener histórico de puntos de un equipo (todas las temporadas)
   */
  getTeamHistory: async (
    teamId: string,
    surface?: keyof SurfacePointsMap
  ): Promise<SeasonPoints[]> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('team_season_points')
        .select('*')
        .eq('team_id', teamId)
        .order('season', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    } catch (error: any) {
      console.error('❌ Error obteniendo histórico:', error)
      return []
    }
  },

  /**
   * Obtener ranking de una temporada específica
   */
  getSeasonRanking: async (
    season: string,
    surface: keyof SurfacePointsMap
  ): Promise<{ team_id: string; points: number; season: string }[]> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      const pointsColumn = `${surface}_points`

      const { data, error } = await supabase
        .from('team_season_points')
        .select(`team_id, ${pointsColumn}, season`)
        .eq('season', season)
        .gt(pointsColumn, 0)
        .order(pointsColumn, { ascending: false })

      if (error) {
        throw error
      }

      return (data || []).map(row => ({
        team_id: row.team_id,
        points: row[pointsColumn] || 0,
        season: row.season
      }))

    } catch (error: any) {
      console.error('❌ Error obteniendo ranking de temporada:', error)
      return []
    }
  },

  /**
   * Regenerar todas las temporadas desde datos brutos
   */
  regenerateAllSeasons: async (): Promise<{ success: boolean; message: string; seasons: string[] }> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log('🔄 Regenerando todas las temporadas desde datos brutos...')

      // Obtener todas las temporadas únicas de los torneos
      const { data: tournaments, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('year')
        .not('year', 'is', null)
        .order('year', { ascending: false })

      if (tournamentsError) {
        throw tournamentsError
      }

      const uniqueYears = [...new Set(tournaments?.map(t => t.year) || [])]
      const seasons = uniqueYears.map(year => {
        const nextYear = (year + 1).toString().slice(-2)
        return `${year}-${nextYear}`
      })

      console.log(`📅 Temporadas encontradas: ${seasons.join(', ')}`)

      // Calcular cada temporada
      for (const season of seasons) {
        console.log(`\n⏳ Procesando temporada ${season}...`)
        await seasonPointsService.calculateAndSaveSeasonPoints(season)
      }

      console.log('\n✅ Regeneración completa exitosa')

      return {
        success: true,
        message: `${seasons.length} temporadas regeneradas exitosamente`,
        seasons
      }

    } catch (error: any) {
      console.error('❌ Error regenerando temporadas:', error)
      return {
        success: false,
        message: error.message || 'Error desconocido',
        seasons: []
      }
    }
  },

  /**
   * Recalcular rankings después de actualizar puntos de una temporada
   * Esta función actúa como trigger para mantener team_season_rankings actualizado
   */
  recalculateRankingsForSeason: async (season: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log(`🔄 Recalculando rankings para temporada ${season}...`)
      
      const result = await teamSeasonRankingsService.calculateSeasonRankings(season)
      
      if (result.success) {
        console.log(`✅ Rankings actualizados: ${result.updated} equipos`)
      } else {
        console.error(`❌ Error actualizando rankings: ${result.message}`)
      }
      
      return {
        success: result.success,
        message: result.message
      }
    } catch (error: any) {
      console.error('❌ Error recalculando rankings:', error)
      return {
        success: false,
        message: error.message || 'Error desconocido'
      }
    }
  },

  /**
   * @deprecated Esta función ya no se usa. Los rankings ahora se calculan en teamSeasonRankingsService
   * Calcular rankings por subtemporada para una temporada específica
   * Se ejecuta cuando se completa un torneo de 1ª división
   */
  calculateSubseasonRankings: async (
    season: string,
    subseason: 1 | 2 | 3 | 4
  ): Promise<{ success: boolean; message: string; updated: number }> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log(`📊 Calculando rankings para subtemporada ${subseason} de ${season}...`)

      // Mapear subtemporada a superficies
      const subseasonSurfaces = {
        1: ['beach_mixed'],                    // Subtemporada 1: playa mixto
        2: ['beach_open', 'beach_women'],      // Subtemporada 2: playa open/women
        3: ['grass_mixed'],                    // Subtemporada 3: césped mixto
        4: ['grass_open', 'grass_women']       // Subtemporada 4: césped open/women
      }

      const surfaces = subseasonSurfaces[subseason] as (keyof SurfacePointsMap)[]
      console.log(`🎯 Superficies a procesar: ${surfaces.join(', ')}`)

      // Obtener datos de la temporada actual y las 3 anteriores
      const seasonYear = parseInt(season.split('-')[0])
      const seasons = [
        season,
        `${seasonYear - 1}-${seasonYear.toString().slice(-2)}`,
        `${seasonYear - 2}-${(seasonYear - 1).toString().slice(-2)}`,
        `${seasonYear - 3}-${(seasonYear - 2).toString().slice(-2)}`
      ]

      console.log(`📅 Temporadas a considerar: ${seasons.join(', ')}`)

      // Obtener datos de team_season_points para estas temporadas
      const { data: seasonData, error } = await supabase
        .from('team_season_points')
        .select(`
          team_id,
          season,
          ${surfaces.map(surf => `${surf}_points`).join(', ')}
        `)
        .in('season', seasons)

      if (error) {
        console.error('❌ Error obteniendo datos de temporada:', error)
        throw error
      }

      console.log(`📦 Registros obtenidos: ${seasonData?.length || 0}`)

      // Calcular rankings para cada superficie
      const rankingsBySurface: { [surface: string]: { team_id: string; total_points: number; rank: number }[] } = {}

      for (const surface of surfaces) {
        console.log(`\n🔄 Procesando superficie: ${surface}`)

        // Agrupar por equipo y calcular puntos totales con coeficientes
        const teamPointsMap: { [teamId: string]: number } = {}

        seasonData?.forEach((row: any) => {
          const teamId = row.team_id
          const season = row.season
          const basePoints = row[`${surface}_points`] || 0

          if (basePoints <= 0) return

          // Calcular coeficiente según la temporada
          const seasonIndex = seasons.indexOf(season)
          const coefficient = [1.0, 0.8, 0.5, 0.2][seasonIndex] || 0
          const weightedPoints = basePoints * coefficient

          if (!teamPointsMap[teamId]) {
            teamPointsMap[teamId] = 0
          }
          teamPointsMap[teamId] += weightedPoints
        })

        // Ordenar por puntos y asignar rankings
        const sortedTeams = Object.entries(teamPointsMap)
          .map(([teamId, totalPoints]) => ({ team_id: teamId, total_points: totalPoints, rank: 0 }))
          .sort((a, b) => b.total_points - a.total_points)

        // Asignar rankings
        sortedTeams.forEach((team, index) => {
          team.rank = index + 1
        })

        rankingsBySurface[surface] = sortedTeams
        console.log(`✅ ${sortedTeams.length} equipos rankeados en ${surface}`)
      }

      // Actualizar team_season_points con los nuevos rankings
      const updates: any[] = []

      for (const surface of surfaces) {
        const rankings = rankingsBySurface[surface]
        
        for (const ranking of rankings) {
          const updateData: any = {
            team_id: ranking.team_id,
            season: season,
            [`subseason_${subseason}_${surface}_rank`]: ranking.rank,
            subseason_ranks_calculated_at: new Date().toISOString()
          }

          updates.push(updateData)
        }
      }

      console.log(`💾 Actualizando ${updates.length} registros...`)

      // Hacer upsert de los rankings
      const { data: updatedData, error: updateError } = await supabase
        .from('team_season_points')
        .upsert(updates, {
          onConflict: 'team_id,season',
          ignoreDuplicates: false
        })
        .select()

      if (updateError) {
        console.error('❌ Error actualizando rankings:', updateError)
        throw updateError
      }

      console.log(`✅ Rankings de subtemporada ${subseason} calculados exitosamente`)

      return {
        success: true,
        message: `Subtemporada ${subseason} de ${season} calculada exitosamente`,
        updated: updatedData?.length || 0
      }

    } catch (error: any) {
      console.error('❌ Error calculando rankings de subtemporada:', error)
      return {
        success: false,
        message: error.message || 'Error desconocido',
        updated: 0
      }
    }
  },

  /**
   * @deprecated Esta función ya no se usa. Los rankings globales ahora se calculan dinámicamente en el frontend
   * Calcular ranking global final de una temporada
   * Se ejecuta al final de la temporada cuando todas las subtemporadas están completas
   */
  calculateFinalGlobalRanking: async (
    season: string
  ): Promise<{ success: boolean; message: string; updated: number }> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log(`🌍 Calculando ranking global final para ${season}...`)

      // Obtener datos de la temporada actual y las 3 anteriores
      const seasonYear = parseInt(season.split('-')[0])
      const seasons = [
        season,
        `${seasonYear - 1}-${seasonYear.toString().slice(-2)}`,
        `${seasonYear - 2}-${(seasonYear - 1).toString().slice(-2)}`,
        `${seasonYear - 3}-${(seasonYear - 2).toString().slice(-2)}`
      ]

      // Obtener datos de team_season_points
      const { data: seasonData, error } = await supabase
        .from('team_season_points')
        .select(`
          team_id,
          season,
          beach_mixed_points,
          beach_open_points,
          beach_women_points,
          grass_mixed_points,
          grass_open_points,
          grass_women_points
        `)
        .in('season', seasons)

      if (error) {
        console.error('❌ Error obteniendo datos de temporada:', error)
        throw error
      }

      // Calcular puntos globales por equipo con coeficientes
      const teamGlobalPoints: { [teamId: string]: number } = {}

      seasonData?.forEach((row: any) => {
        const teamId = row.team_id
        const season = row.season
        
        // Calcular coeficiente según la temporada
        const seasonIndex = seasons.indexOf(season)
        const coefficient = [1.0, 0.8, 0.5, 0.2][seasonIndex] || 0

        // Sumar todos los puntos de todas las categorías
        const totalPoints = (row.beach_mixed_points || 0) + 
                          (row.beach_open_points || 0) + 
                          (row.beach_women_points || 0) + 
                          (row.grass_mixed_points || 0) + 
                          (row.grass_open_points || 0) + 
                          (row.grass_women_points || 0)

        if (totalPoints <= 0) return

        const weightedPoints = totalPoints * coefficient

        if (!teamGlobalPoints[teamId]) {
          teamGlobalPoints[teamId] = 0
        }
        teamGlobalPoints[teamId] += weightedPoints
      })

      // Ordenar por puntos globales y asignar rankings
      const sortedTeams = Object.entries(teamGlobalPoints)
        .map(([teamId, totalPoints]) => ({ team_id: teamId, total_points: totalPoints, rank: 0 }))
        .sort((a, b) => b.total_points - a.total_points)

      // Asignar rankings
      sortedTeams.forEach((team, index) => {
        team.rank = index + 1
      })

      console.log(`🏆 ${sortedTeams.length} equipos rankeados globalmente`)

      // Actualizar team_season_points con el ranking global final
      const updates = sortedTeams.map(team => ({
        team_id: team.team_id,
        season: season,
        final_season_global_rank: team.rank,
        subseason_ranks_calculated_at: new Date().toISOString()
      }))

      const { data: updatedData, error: updateError } = await supabase
        .from('team_season_points')
        .upsert(updates, {
          onConflict: 'team_id,season',
          ignoreDuplicates: false
        })
        .select()

      if (updateError) {
        console.error('❌ Error actualizando ranking global:', updateError)
        throw updateError
      }

      console.log(`✅ Ranking global final calculado exitosamente`)

      return {
        success: true,
        message: `Ranking global final de ${season} calculado exitosamente`,
        updated: updatedData?.length || 0
      }

    } catch (error: any) {
      console.error('❌ Error calculando ranking global final:', error)
      return {
        success: false,
        message: error.message || 'Error desconocido',
        updated: 0
      }
    }
  },

  /**
   * Obtener estadísticas de una temporada
   */
  getSeasonStats: async (season: string): Promise<{
    total_teams: number
    categories: { [key: string]: { teams: number; total_points: number; avg_points: number } }
  }> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('team_season_points')
        .select('*')
        .eq('season', season)

      if (error) {
        throw error
      }

      const stats = {
        total_teams: data?.length || 0,
        surfaces: {} as { [key: string]: { teams: number; total_points: number; avg_points: number } }
      }

      const surfaces: (keyof SurfacePointsMap)[] = [
        'beach_mixed',
        'beach_open',
        'beach_women',
        'grass_mixed',
        'grass_open',
        'grass_women'
      ]

      surfaces.forEach(surface => {
        const pointsColumn = `${surface}_points`
        const teamsWithPoints = data?.filter(row => row[pointsColumn] > 0) || []
        const totalPoints = teamsWithPoints.reduce((sum, row) => sum + (row[pointsColumn] || 0), 0)

        stats.surfaces[surface] = {
          teams: teamsWithPoints.length,
          total_points: totalPoints,
          avg_points: teamsWithPoints.length > 0 ? totalPoints / teamsWithPoints.length : 0
        }
      })

      return stats

    } catch (error: any) {
      console.error('❌ Error obteniendo estadísticas de temporada:', error)
      return {
        total_teams: 0,
        categories: {}
      }
    }
  }
}

export default seasonPointsService

