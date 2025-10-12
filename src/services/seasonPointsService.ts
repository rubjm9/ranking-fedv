/**
 * Servicio para gestionar la tabla team_season_points
 * Cache materializada de puntos por equipo y temporada
 */

import { supabase } from './supabaseService'

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
  best_position?: {
    beach_mixed?: number
    beach_open?: number
    beach_women?: number
    grass_mixed?: number
    grass_open?: number
    grass_women?: number
  }
}

export interface CategoryPointsMap {
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
            modality
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

      // Agrupar puntos por equipo y modalidad
      const teamPointsMap: { [teamId: string]: Partial<CategoryPointsMap> & { tournaments_played: Partial<CategoryPointsMap>, best_position: Partial<CategoryPointsMap> } } = {}

      positions.forEach(position => {
        const tournament = position.tournaments
        const team = position.teams

        if (!tournament || !team || !tournament.surface || !tournament.modality) {
          return
        }

        const category = `${tournament.surface.toLowerCase()}_${tournament.modality.toLowerCase()}` as keyof CategoryPointsMap
        const tid = team.id

        if (!teamPointsMap[tid]) {
          teamPointsMap[tid] = {
            tournaments_played: {},
            best_position: {}
          }
        }

        // Sumar puntos
        if (!teamPointsMap[tid][category]) {
          teamPointsMap[tid][category] = 0
        }
        teamPointsMap[tid][category]! += position.points || 0

        // Contar torneos
        if (!teamPointsMap[tid].tournaments_played[category]) {
          teamPointsMap[tid].tournaments_played[category] = 0
        }
        teamPointsMap[tid].tournaments_played[category]! += 1

        // Mejor posición
        const currentBest = teamPointsMap[tid].best_position[category]
        if (!currentBest || position.position < currentBest) {
          teamPointsMap[tid].best_position[category] = position.position
        }
      })

      // Preparar datos para upsert
      const upsertData = Object.keys(teamPointsMap).map(tid => ({
        team_id: tid,
        season: season,
        beach_mixed_points: teamPointsMap[tid].beach_mixed || 0,
        beach_open_points: teamPointsMap[tid].beach_open || 0,
        beach_women_points: teamPointsMap[tid].beach_women || 0,
        grass_mixed_points: teamPointsMap[tid].grass_mixed || 0,
        grass_open_points: teamPointsMap[tid].grass_open || 0,
        grass_women_points: teamPointsMap[tid].grass_women || 0,
        tournaments_played: teamPointsMap[tid].tournaments_played,
        best_position: teamPointsMap[tid].best_position,
        last_updated: new Date().toISOString()
      }))

      console.log(`💾 Guardando ${upsertData.length} registros...`)

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
   * Marcar una temporada/modalidad como completa
   */
  closeSeason: async (
    season: string,
    category?: keyof CategoryPointsMap
  ): Promise<{ success: boolean; message: string }> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log(`🔒 Cerrando temporada ${season}${category ? ` para ${category}` : ''}...`)

      // Si se especifica categoría, solo marcar como completa esa modalidad
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
    category?: keyof CategoryPointsMap
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
    category: keyof CategoryPointsMap
  ): Promise<{ team_id: string; points: number; season: string }[]> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      const pointsColumn = `${category}_points`

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
        categories: {} as { [key: string]: { teams: number; total_points: number; avg_points: number } }
      }

      const categories: (keyof CategoryPointsMap)[] = [
        'beach_mixed',
        'beach_open',
        'beach_women',
        'grass_mixed',
        'grass_open',
        'grass_women'
      ]

      categories.forEach(category => {
        const pointsColumn = `${category}_points`
        const teamsWithPoints = data?.filter(row => row[pointsColumn] > 0) || []
        const totalPoints = teamsWithPoints.reduce((sum, row) => sum + (row[pointsColumn] || 0), 0)

        stats.categories[category] = {
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

