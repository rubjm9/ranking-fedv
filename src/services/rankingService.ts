import { supabase } from './supabaseService'

export interface RankingEntry {
  team_id: string
  team_name: string
  ranking_category: string
  current_season_points: number
  previous_season_points: number
  two_seasons_ago_points: number
  three_seasons_ago_points: number
  total_points: number
  ranking_position: number
  last_calculated: string
  team?: {
    id: string
    name: string
    regionId: string
    region?: {
      id: string
      name: string
    }
  }
}

export interface RankingSummary {
  total_teams: number
  teams_with_points: number
  teams_without_points: number
  max_points: string
  min_points: string
  average_points: string
}

export interface RankingResponse {
  data: RankingEntry[]
  summary: RankingSummary
}

export interface RankingHistoryEntry {
  id: string
  team_id: string
  team_name: string
  ranking_category: string
  position: number
  total_points: number
  change_from_previous: number
  calculated_at: string
  season: string
}

export interface RankingEvolution {
  team_id: string
  team_name: string
  category: string
  data: {
    season: string
    position: number
    points: number
    change: number
  }[]
}

const rankingService = {
  // Obtener ranking por categoría
  getRanking: async (category: string = 'beach_mixed'): Promise<RankingResponse> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      // Obtener ranking con información de equipos
      const { data: rankingData, error } = await supabase
        .from('current_rankings')
        .select(`
          *,
          teams:team_id(
            id,
            name,
            regions:regionId(
              id,
              name
            )
          )
        `)
        .eq('ranking_category', category)
        .order('ranking_position', { ascending: true })

      if (error) {
        console.error('Error al obtener ranking:', error)
        throw error
      }

      // Transformar datos para incluir nombres de equipos
      const transformedData: RankingEntry[] = (rankingData || []).map(ranking => ({
        team_id: ranking.team_id,
        team_name: ranking.teams?.name || 'Equipo desconocido',
        ranking_category: ranking.ranking_category,
        current_season_points: ranking.current_season_points || 0,
        previous_season_points: ranking.previous_season_points || 0,
        two_seasons_ago_points: ranking.two_seasons_ago_points || 0,
        three_seasons_ago_points: ranking.three_seasons_ago_points || 0,
        total_points: ranking.total_points || 0,
        ranking_position: ranking.ranking_position || 0,
        last_calculated: ranking.last_calculated || new Date().toISOString()
      }))

      // Ordenar por puntos como respaldo si las posiciones no están correctas
      transformedData.sort((a, b) => {
        // Primero intentar ordenar por ranking_position
        if (a.ranking_position && b.ranking_position && a.ranking_position !== b.ranking_position) {
          return a.ranking_position - b.ranking_position
        }
        // Si las posiciones son iguales o no existen, ordenar por puntos
        return b.total_points - a.total_points
      })

      // Reasignar posiciones correctas basadas en el ordenamiento
      transformedData.forEach((entry, index) => {
        entry.ranking_position = index + 1
      })

      // Calcular estadísticas
      const totalTeams = await supabase.from('teams').select('id', { count: 'exact', head: true })
      const teamsWithPoints = transformedData.filter(r => r.total_points > 0).length
      const maxPoints = transformedData.length > 0 ? Math.max(...transformedData.map(r => r.total_points)) : 0
      const minPoints = transformedData.length > 0 ? Math.min(...transformedData.map(r => r.total_points)) : 0
      const avgPoints = transformedData.length > 0 ? 
        transformedData.reduce((sum, r) => sum + r.total_points, 0) / transformedData.length : 0

      const summary: RankingSummary = {
        total_teams: totalTeams.count || 0,
        teams_with_points: teamsWithPoints,
        teams_without_points: (totalTeams.count || 0) - teamsWithPoints,
        max_points: maxPoints.toFixed(2),
        min_points: minPoints.toFixed(2),
        average_points: avgPoints.toFixed(2)
      }

      return {
        data: transformedData,
        summary
      }
    } catch (error) {
      console.error('Error al obtener ranking:', error)
      return {
        data: [],
        summary: {
          total_teams: 0,
          teams_with_points: 0,
          teams_without_points: 0,
          max_points: "0.00",
          min_points: "0.00",
          average_points: "0.00"
        }
      }
    }
  },

  // Recalcular ranking
  recalculateRanking: async (): Promise<any> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      // Intentar usar la función RPC si existe
      try {
        const { error } = await supabase.rpc('recalculate_current_rankings')
        
        if (error) {
          console.warn('Función RPC no disponible, usando método alternativo:', error)
          // Si la función RPC no existe, usar método alternativo
          return await rankingService.recalculateRankingAlternative()
        }
        
        return { message: 'Ranking recalculado exitosamente' }
      } catch (rpcError) {
        console.warn('Error con función RPC, usando método alternativo:', rpcError)
        // Si hay error con RPC, usar método alternativo
        return await rankingService.recalculateRankingAlternative()
      }
    } catch (error) {
      console.error('Error al recalcular ranking:', error)
      throw error
    }
  },

  // Método alternativo para recalcular ranking
  recalculateRankingAlternative: async (): Promise<any> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log('🔄 Iniciando recálculo alternativo...')

      // Obtener todas las posiciones de torneos
      const { data: positions, error: positionsError } = await supabase
        .from('positions')
        .select(`
          *,
          tournaments:tournamentId(
            id,
            name,
            type,
            year,
            surface,
            modality,
            regionId
          ),
          teams:teamId(
            id,
            name,
            regionId
          )
        `)

      if (positionsError) {
        console.error('Error al obtener posiciones:', positionsError)
        throw positionsError
      }

      console.log('📊 Posiciones obtenidas:', positions?.length || 0)

      if (!positions || positions.length === 0) {
        console.log('⚠️ No hay posiciones para recalcular')
        return { message: 'No hay posiciones para recalcular' }
      }

      // Agrupar puntos por equipo y categoría
      const teamPoints: { [key: string]: { [key: string]: number } } = {}

      positions.forEach(position => {
        const tournament = position.tournaments
        const team = position.teams
        
        console.log('🏆 Procesando posición:', {
          position: position.position,
          points: position.points,
          tournament: tournament?.name || 'Sin torneo',
          team: team?.name || 'Sin equipo'
        })

        if (!tournament || !team) {
          console.warn('⚠️ Posición sin torneo o equipo:', position)
          return
        }

        // Determinar categoría basada en superficie y modalidad
        const category = `${tournament.surface.toLowerCase()}_${tournament.modality.toLowerCase()}`
        const teamKey = team.id

        if (!teamPoints[teamKey]) {
          teamPoints[teamKey] = {}
        }

        if (!teamPoints[teamKey][category]) {
          teamPoints[teamKey][category] = 0
        }

        teamPoints[teamKey][category] += position.points || 0
      })

      console.log('📈 Puntos agrupados:', teamPoints)

      // Limpiar rankings actuales
      console.log('🗑️ Limpiando rankings actuales...')
      const { error: deleteError } = await supabase
        .from('current_rankings')
        .delete()
        .not('id', 'is', null) // Delete all records

      if (deleteError) {
        console.error('Error al limpiar rankings:', deleteError)
        throw deleteError
      }

      console.log('✅ Rankings limpiados exitosamente')

      // Insertar nuevos rankings
      const rankingEntries = []
      
      Object.keys(teamPoints).forEach(teamId => {
        Object.keys(teamPoints[teamId]).forEach(category => {
          const totalPoints = teamPoints[teamId][category]
          
          rankingEntries.push({
            team_id: teamId,
            ranking_category: category,
            current_season_points: totalPoints,
            previous_season_points: 0,
            two_seasons_ago_points: 0,
            three_seasons_ago_points: 0,
            total_points: totalPoints,
            ranking_position: 0, // Se calculará después
            last_calculated: new Date().toISOString()
          })
        })
      })

      console.log('📝 Entradas de ranking a insertar:', rankingEntries.length)

      // Ordenar por puntos y asignar posiciones
      rankingEntries.sort((a, b) => b.total_points - a.total_points)
      
      rankingEntries.forEach((entry, index) => {
        entry.ranking_position = index + 1
      })

      console.log('🏆 Rankings ordenados:', rankingEntries.slice(0, 5)) // Mostrar solo los primeros 5

      // Insertar en lotes
      const batchSize = 100
      console.log('💾 Insertando rankings en lotes...')
      for (let i = 0; i < rankingEntries.length; i += batchSize) {
        const batch = rankingEntries.slice(i, i + batchSize)
        console.log(`📦 Insertando lote ${Math.floor(i/batchSize) + 1}: ${batch.length} entradas`)
        
        const { error: insertError } = await supabase
          .from('current_rankings')
          .insert(batch)

        if (insertError) {
          console.error('Error al insertar ranking:', insertError)
          throw insertError
        }
      }

      console.log('✅ Rankings insertados exitosamente')

      return { 
        message: `Ranking recalculado exitosamente. ${rankingEntries.length} entradas procesadas.` 
      }
    } catch (error) {
      console.error('Error en método alternativo:', error)
      throw error
    }
  },

  // Método para recalcular solo una categoría específica
  recalculateSpecificCategory: async (category: string): Promise<any> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log(`🔄 Recalculando categoría específica: ${category}`)

      // Obtener todas las posiciones de la categoría específica
      const { data: positions, error: positionsError } = await supabase
        .from('positions')
        .select(`
          *,
          tournaments:tournamentId(
            id,
            name,
            type,
            year,
            surface,
            modality,
            regionId
          ),
          teams:teamId(
            id,
            name,
            regionId
          )
        `)
        .eq('tournaments.surface', category.split('_')[0].toUpperCase())
        .eq('tournaments.modality', category.split('_')[1].toUpperCase())

      if (positionsError) {
        console.error('Error al obtener posiciones:', positionsError)
        throw positionsError
      }

      console.log(`📊 Posiciones obtenidas para ${category}:`, positions?.length || 0)

      // Eliminar rankings existentes de esta categoría
      const { error: deleteError } = await supabase
        .from('current_rankings')
        .delete()
        .eq('ranking_category', category)

      if (deleteError) {
        console.error('Error al eliminar rankings de la categoría:', deleteError)
        throw deleteError
      }

      if (!positions || positions.length === 0) {
        console.log(`ℹ️ No hay posiciones para la categoría ${category}`)
        return { message: `No hay posiciones para la categoría ${category}` }
      }

      // Agrupar puntos por equipo
      const teamPoints: { [key: string]: number } = {}

      positions.forEach(position => {
        const tournament = position.tournaments
        const team = position.teams

        if (!tournament || !team) {
          console.warn('⚠️ Posición sin torneo o equipo:', position)
          return
        }

        const teamKey = team.id

        if (!teamPoints[teamKey]) {
          teamPoints[teamKey] = 0
        }

        teamPoints[teamKey] += position.points || 0
      })

      console.log(`📈 Puntos agrupados para ${category}:`, teamPoints)

      // Crear entradas de ranking
      const rankingEntries = []
      
      Object.keys(teamPoints).forEach(teamId => {
        const totalPoints = teamPoints[teamId]
        
        rankingEntries.push({
          team_id: teamId,
          ranking_category: category,
          current_season_points: totalPoints,
          previous_season_points: 0,
          two_seasons_ago_points: 0,
          three_seasons_ago_points: 0,
          total_points: totalPoints,
          ranking_position: 0, // Se calculará después
          last_calculated: new Date().toISOString()
        })
      })

      // Ordenar por puntos y asignar posiciones
      rankingEntries.sort((a, b) => b.total_points - a.total_points)
      
      rankingEntries.forEach((entry, index) => {
        entry.ranking_position = index + 1
      })

      console.log(`🏆 Rankings ordenados para ${category}:`, rankingEntries.slice(0, 5))

      // Insertar rankings
      if (rankingEntries.length > 0) {
        const { error: insertError } = await supabase
          .from('current_rankings')
          .insert(rankingEntries)

        if (insertError) {
          console.error('Error al insertar ranking:', insertError)
          throw insertError
        }
      }

      console.log(`✅ Categoría ${category} recalculada exitosamente`)

      return { 
        message: `Categoría ${category} recalculada exitosamente. ${rankingEntries.length} entradas procesadas.` 
      }
    } catch (error) {
      console.error(`Error al recalcular categoría ${category}:`, error)
      throw error
    }
  },

  // Validar y corregir consistencia de datos en rankings
  validateAndFixRankingConsistency: async (category?: string): Promise<any> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log('🔍 Validando consistencia de rankings...')

      // Obtener rankings a validar
      const query = supabase
        .from('current_rankings')
        .select('*')
        .order('ranking_category', { ascending: true })
        .order('total_points', { ascending: false })

      if (category) {
        query.eq('ranking_category', category)
      }

      const { data: rankings, error } = await query

      if (error) {
        console.error('Error al obtener rankings:', error)
        throw error
      }

      if (!rankings || rankings.length === 0) {
        console.log('ℹ️ No hay rankings para validar')
        return { message: 'No hay rankings para validar' }
      }

      console.log(`📊 Validando ${rankings.length} entradas de ranking`)

      // Agrupar por categoría
      const rankingsByCategory: { [key: string]: any[] } = {}
      rankings.forEach(ranking => {
        if (!rankingsByCategory[ranking.ranking_category]) {
          rankingsByCategory[ranking.ranking_category] = []
        }
        rankingsByCategory[ranking.ranking_category].push(ranking)
      })

      let totalFixed = 0
      const inconsistencies: string[] = []

      // Validar cada categoría
      for (const [category, categoryRankings] of Object.entries(rankingsByCategory)) {
        console.log(`🔍 Validando categoría: ${category}`)
        
        // Ordenar por puntos
        categoryRankings.sort((a, b) => b.total_points - a.total_points)
        
        // Verificar posiciones
        let needsUpdate = false
        const updates: any[] = []
        
        categoryRankings.forEach((ranking, index) => {
          const correctPosition = index + 1
          if (ranking.ranking_position !== correctPosition) {
            console.log(`⚠️ Posición incorrecta para ${ranking.team_id}: ${ranking.ranking_position} → ${correctPosition}`)
            inconsistencies.push(`${category}: Equipo ${ranking.team_id} posición ${ranking.ranking_position} → ${correctPosition}`)
            updates.push({
              id: ranking.id,
              ranking_position: correctPosition
            })
            needsUpdate = true
          }
        })

        // Actualizar posiciones si es necesario
        if (needsUpdate && updates.length > 0) {
          console.log(`🔧 Corrigiendo ${updates.length} posiciones en ${category}`)
          
          // Función async para procesar lotes
          const processBatches = async () => {
            const batchSize = 50
            for (let i = 0; i < updates.length; i += batchSize) {
              const batch = updates.slice(i, i + batchSize)
              
              // Crear promesas para el lote actual
              const updatePromises = batch.map(async (update) => {
                const { error: updateError } = await supabase
                  .from('current_rankings')
                  .update({ ranking_position: update.ranking_position })
                  .eq('id', update.id)
                
                if (updateError) {
                  console.error(`Error actualizando posición ${update.id}:`, updateError)
                  return false
                } else {
                  return true
                }
              })
              
              // Esperar a que se completen todas las actualizaciones del lote
              const results = await Promise.all(updatePromises)
              totalFixed += results.filter(result => result === true).length
            }
          }
          
          await processBatches()
        }
      }

      console.log(`✅ Validación completada. ${totalFixed} posiciones corregidas`)

      return {
        message: `Validación completada. ${totalFixed} posiciones corregidas.`,
        totalFixed,
        inconsistencies,
        categoriesChecked: Object.keys(rankingsByCategory).length
      }
    } catch (error) {
      console.error('Error en validación de consistencia:', error)
      throw error
    }
  },

  // Obtener historial de cambios de ranking
  getRankingHistory: async (category?: string, teamId?: string, limit: number = 50): Promise<RankingHistoryEntry[]> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      let query = supabase
        .from('team_season_rankings')
        .select(`
          *,
          teams:team_id(
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (category) {
        // Filtrar por categoría específica basada en los puntos
        query = query.not(`${category}_points`, 'is', null)
      }

      if (teamId) {
        query = query.eq('team_id', teamId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error al obtener historial de ranking:', error)
        throw error
      }

      // Transformar datos para incluir información del equipo y cambios
      const historyData: RankingHistoryEntry[] = (data || []).map((entry, index) => {
        // Calcular posición basada en puntos de la categoría
        const points = category ? entry[`${category}_points`] || 0 : 
          (entry.beach_mixed_points || 0) + (entry.beach_open_points || 0) + 
          (entry.beach_women_points || 0) + (entry.grass_mixed_points || 0) + 
          (entry.grass_open_points || 0) + (entry.grass_women_points || 0)

        return {
          id: entry.id,
          team_id: entry.team_id,
          team_name: entry.teams?.name || 'Equipo desconocido',
          ranking_category: category || 'general',
          position: index + 1, // Simplificado por ahora
          total_points: points,
          change_from_previous: 0, // Se calcularía comparando con el anterior
          calculated_at: entry.created_at,
          season: entry.season
        }
      })

      return historyData
    } catch (error) {
      console.error('Error al obtener historial de ranking:', error)
      return []
    }
  },

  // Obtener evolución de un equipo específico
  getTeamEvolution: async (teamId: string, category: string = 'beach_mixed'): Promise<RankingEvolution> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      // Obtener datos del equipo
      const { data: teamData } = await supabase
        .from('teams')
        .select('id, name')
        .eq('id', teamId)
        .single()

      // Obtener historial de temporadas del equipo
      const { data: seasonData, error } = await supabase
        .from('team_season_rankings')
        .select('*')
        .eq('team_id', teamId)
        .order('season', { ascending: true })

      if (error) {
        console.error('Error al obtener evolución del equipo:', error)
        throw error
      }

      // Transformar datos para el gráfico
      const evolutionData = (seasonData || []).map((entry, index) => ({
        season: entry.season,
        position: index + 1, // Simplificado
        points: entry[`${category}_points`] || 0,
        change: index > 0 ? 
          (entry[`${category}_points`] || 0) - (seasonData[index - 1][`${category}_points`] || 0) : 0
      }))

      return {
        team_id: teamId,
        team_name: teamData?.name || 'Equipo desconocido',
        category,
        data: evolutionData
      }
    } catch (error) {
      console.error('Error al obtener evolución del equipo:', error)
      return {
        team_id: teamId,
        team_name: 'Equipo desconocido',
        category,
        data: []
      }
    }
  },

  // Obtener ranking actual con información de equipos
  getCurrentRankingWithTeams: async (category: string = 'beach_mixed'): Promise<RankingResponse> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      // Obtener ranking con información de equipos y regiones
      const { data: rankingData, error } = await supabase
        .from('current_rankings')
        .select(`
          *,
          teams:team_id(
            id,
            name,
            regionId,
            regions:regionId(
              id,
              name
            )
          )
        `)
        .eq('ranking_category', category)
        .order('ranking_position', { ascending: true })

      if (error) {
        console.error('Error al obtener ranking actual:', error)
        throw error
      }

      console.log('🔍 Datos de ranking obtenidos:', rankingData?.slice(0, 3))

      // Transformar datos para incluir nombres de equipos
      const transformedData: RankingEntry[] = (rankingData || []).map(ranking => {
        console.log('🏆 Procesando ranking:', {
          team_id: ranking.team_id,
          team_name: ranking.teams?.name,
          has_team: !!ranking.teams,
          region_name: ranking.teams?.regions?.name
        })
        
        return {
          team_id: ranking.team_id,
          team_name: ranking.teams?.name || 'Equipo desconocido',
          ranking_category: ranking.ranking_category,
          current_season_points: ranking.current_season_points || 0,
          previous_season_points: ranking.previous_season_points || 0,
          two_seasons_ago_points: ranking.two_seasons_ago_points || 0,
          three_seasons_ago_points: ranking.three_seasons_ago_points || 0,
          total_points: ranking.total_points || 0,
          ranking_position: ranking.ranking_position || 0,
          last_calculated: ranking.last_calculated || new Date().toISOString(),
          team: ranking.teams ? {
            id: ranking.teams.id,
            name: ranking.teams.name,
            regionId: ranking.teams.regionId,
            region: ranking.teams.regions
          } : undefined
        }
      })

      // Ordenar por puntos como respaldo si las posiciones no están correctas
      transformedData.sort((a, b) => {
        // Primero intentar ordenar por ranking_position
        if (a.ranking_position && b.ranking_position && a.ranking_position !== b.ranking_position) {
          return a.ranking_position - b.ranking_position
        }
        // Si las posiciones son iguales o no existen, ordenar por puntos
        return b.total_points - a.total_points
      })

      // Reasignar posiciones correctas basadas en el ordenamiento
      transformedData.forEach((entry, index) => {
        entry.ranking_position = index + 1
      })

      // Calcular estadísticas
      const totalTeams = await supabase.from('teams').select('id', { count: 'exact', head: true })
      const teamsWithPoints = transformedData.filter(r => r.total_points > 0).length
      const maxPoints = transformedData.length > 0 ? Math.max(...transformedData.map(r => r.total_points)) : 0
      const minPoints = transformedData.length > 0 ? Math.min(...transformedData.map(r => r.total_points)) : 0
      const avgPoints = transformedData.length > 0 ? 
        transformedData.reduce((sum, r) => sum + r.total_points, 0) / transformedData.length : 0

      const summary: RankingSummary = {
        total_teams: totalTeams.count || 0,
        teams_with_points: teamsWithPoints,
        teams_without_points: (totalTeams.count || 0) - teamsWithPoints,
        max_points: maxPoints.toFixed(2),
        min_points: minPoints.toFixed(2),
        average_points: avgPoints.toFixed(2)
      }

      return {
        data: transformedData,
        summary
      }
    } catch (error) {
      console.error('Error al obtener ranking actual:', error)
      return {
        data: [],
        summary: {
          total_teams: 0,
          teams_with_points: 0,
          teams_without_points: 0,
          max_points: "0.00",
          min_points: "0.00",
          average_points: "0.00"
        }
      }
    }
  },

  // Obtener ranking por temporada con información de equipos
  getSeasonRankingWithTeams: async (season: string): Promise<RankingResponse> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      // Obtener ranking por temporada
      const { data: rankingData, error } = await supabase
        .from('team_season_rankings')
        .select(`
          *,
          teams:team_id(
            id,
            name,
            regions:regionId(
              id,
              name
            )
          )
        `)
        .eq('season', season)
        .order('total_points', { ascending: false })

      if (error) {
        console.error('Error al obtener ranking de temporada:', error)
        throw error
      }

      // Transformar datos
      const transformedData: RankingEntry[] = (rankingData || []).map((ranking, index) => ({
        team_id: ranking.team_id,
        team_name: ranking.teams?.name || 'Equipo desconocido',
        ranking_category: 'season_ranking',
        current_season_points: ranking.total_points || 0,
        previous_season_points: 0,
        two_seasons_ago_points: 0,
        three_seasons_ago_points: 0,
        total_points: ranking.total_points || 0,
        ranking_position: index + 1,
        last_calculated: ranking.updated_at || new Date().toISOString()
      }))

      // Calcular estadísticas
      const teamsWithPoints = transformedData.filter(r => r.total_points > 0).length
      const maxPoints = transformedData.length > 0 ? Math.max(...transformedData.map(r => r.total_points)) : 0
      const minPoints = transformedData.length > 0 ? Math.min(...transformedData.map(r => r.total_points)) : 0
      const avgPoints = transformedData.length > 0 ? 
        transformedData.reduce((sum, r) => sum + r.total_points, 0) / transformedData.length : 0

      const summary: RankingSummary = {
        total_teams: transformedData.length,
        teams_with_points: teamsWithPoints,
        teams_without_points: transformedData.length - teamsWithPoints,
        max_points: maxPoints.toFixed(2),
        min_points: minPoints.toFixed(2),
        average_points: avgPoints.toFixed(2)
      }

      return {
        data: transformedData,
        summary
      }
    } catch (error) {
      console.error('Error al obtener ranking de temporada:', error)
      return {
        data: [],
        summary: {
          total_teams: 0,
          teams_with_points: 0,
          teams_without_points: 0,
          max_points: "0.00",
          min_points: "0.00",
          average_points: "0.00"
        }
      }
    }
  },

  // Método de diagnóstico para verificar el estado de la base de datos
  diagnoseRanking: async (): Promise<any> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log('🔍 Iniciando diagnóstico del ranking...')

      // Verificar si existe la tabla current_rankings
      const { data: rankingsData, error: rankingsError } = await supabase
        .from('current_rankings')
        .select('*')
        .limit(5)

      console.log('📊 Datos de current_rankings:', rankingsData)
      console.log('❌ Error de current_rankings:', rankingsError)

      // Verificar si existe la tabla positions
      const { data: positionsData, error: positionsError } = await supabase
        .from('positions')
        .select('*')
        .limit(5)

      console.log('🏆 Datos de positions:', positionsData)
      console.log('❌ Error de positions:', positionsError)

      // Verificar si existe la tabla teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .limit(5)

      console.log('👥 Datos de teams:', teamsData)
      console.log('❌ Error de teams:', teamsError)

      return {
        current_rankings: { data: rankingsData, error: rankingsError },
        positions: { data: positionsData, error: positionsError },
        teams: { data: teamsData, error: teamsError }
      }
    } catch (error) {
      console.error('Error en diagnóstico:', error)
      return { error: error.message }
    }
  },

  // Obtener estadísticas del ranking
  getRankingStats: async (): Promise<any> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      // Obtener estadísticas básicas
      const { data: statsData, error } = await supabase
        .from('current_rankings')
        .select('total_points, ranking_position')
        .order('ranking_position', { ascending: true })

      if (error) {
        console.error('Error al obtener estadísticas:', error)
        throw error
      }

      // Calcular estadísticas generales
      const totalTeams = statsData?.length || 0
      const teamsWithPoints = statsData?.filter(entry => entry.total_points > 0).length || 0
      const maxPoints = statsData?.length > 0 ? Math.max(...statsData.map(entry => entry.total_points)) : 0
      const totalPoints = statsData?.reduce((sum, entry) => sum + entry.total_points, 0) || 0
      const avgPoints = totalTeams > 0 ? (totalPoints / totalTeams).toFixed(1) : "0.0"

      return {
        total_teams: totalTeams,
        teams_with_points: teamsWithPoints,
        max_points: maxPoints,
        avg_points: avgPoints
      }
    } catch (error) {
      console.error('Error al obtener estadísticas:', error)
      return {
        total_teams: 0,
        teams_with_points: 0,
        max_points: 0,
        avg_points: "0.0"
      }
    }
  },

  // Obtener comparación entre temporadas
  getSeasonComparison: async (category: string = 'beach_mixed'): Promise<any> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      // Obtener datos de las últimas 4 temporadas
      const { data: seasonData, error } = await supabase
        .from('team_season_rankings')
        .select(`
          *,
          teams:team_id(
            id,
            name
          )
        `)
        .not(`${category}_points`, 'is', null)
        .order('season', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error al obtener comparación de temporadas:', error)
        throw error
      }

      // Agrupar por temporada y equipo
      const comparisonData = (seasonData || []).reduce((acc, entry) => {
        const season = entry.season
        const teamId = entry.team_id
        
        if (!acc[season]) {
          acc[season] = {}
        }
        
        acc[season][teamId] = {
          team_name: entry.teams?.name || 'Equipo desconocido',
          points: entry[`${category}_points`] || 0,
          position: 0 // Se calcularía ordenando por puntos
        }
        
        return acc
      }, {} as any)

      return comparisonData
    } catch (error) {
      console.error('Error al obtener comparación de temporadas:', error)
      return {}
    }
  }
}

export default rankingService
