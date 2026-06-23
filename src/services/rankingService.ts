import { supabase } from './supabaseService'
import seasonService from './seasonService'
import {
  getTeamDisplayNameForCategory,
  TEAM_RANKING_NAME_SELECT,
} from '@/utils/teamNames'

export interface RankingEntry {
  team_id: string
  team_name: string
  logo?: string | null
  region_name?: string
  ranking_category: string
  current_season_points: number
  previous_season_points: number
  two_seasons_ago_points: number
  three_seasons_ago_points: number
  total_points: number
  ranking_position: number
  last_calculated: string
  // Desglose por temporadas con coeficientes aplicados
  season_breakdown: {
    [season: string]: {
      base_points: number
      weighted_points: number
      coefficient: number
    }
  }
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

// Cache para rankings calculados
const rankingCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

// Limpiar cache expirado
const cleanExpiredCache = (): void => {
  const now = Date.now()
  for (const [key, value] of rankingCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      rankingCache.delete(key)
    }
  }
}

// Obtener datos del cache si están disponibles
const getFromCache = (key: string): any | null => {
  cleanExpiredCache()
  const cached = rankingCache.get(key)
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data
  }
  return null
}

// Guardar datos en cache
const setCache = (key: string, data: any): void => {
  rankingCache.set(key, { data, timestamp: Date.now() })
}

// Limpiar cache específico
const clearCache = (pattern?: string): void => {
  if (pattern) {
    for (const key of rankingCache.keys()) {
      if (key.includes(pattern)) {
        rankingCache.delete(key)
      }
    }
  } else {
    rankingCache.clear()
  }
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

// Formatear temporada (YYYY-YY)
const formatSeason = (year: number): string => {
  const nextYear = (year + 1).toString().slice(-2)
  return `${year}-${nextYear}`
}

// Obtener temporada de referencia por superficie
const getCurrentSeason = async (surface?: string): Promise<string> => {
  try {
    // Si no se especifica superficie, buscar el CE más reciente completado de cualquier superficie
    if (!surface) {
      const { data: ceTournaments, error } = await supabase
        .from('tournaments')
        .select('id, year, name, surface, category')
        .ilike('name', '%campeonato de españa%')
        .not('year', 'is', null)
        .order('year', { ascending: false })

      if (error) {
        console.warn('⚠️ Error obteniendo CE general, usando año calendario:', error.message)
        const currentYear = new Date().getFullYear()
        return formatSeason(currentYear - 1) // Usar temporada anterior por defecto
      }

      if (ceTournaments && ceTournaments.length > 0) {
        // Buscar el CE más reciente que tenga posiciones completadas
        for (const ce of ceTournaments) {
          const { data: positions, error: positionsError } = await supabase
            .from('positions')
            .select('id')
            .eq('tournamentId', ce.id)
            .limit(1)

          if (!positionsError && positions && positions.length > 0) {
            const referenceSeason = formatSeason(ce.year)
            console.log(`📅 Temporada de referencia general detectada: ${referenceSeason} (CE completado: ${ce.name})`)
            return referenceSeason
          }
        }
      }

      // Si no hay CE completado, usar temporada anterior
      const currentYear = new Date().getFullYear()
      return formatSeason(currentYear - 1)
    }

    // Para superficies específicas, verificar si hay CE de 1ª división completado
    const surfaceParts = surface.split('_')
    const surfaceType = surfaceParts[0] // beach o grass
    const category = surfaceParts[1] // mixed, open, women

    // Buscar el CE de 1ª división más reciente para esta superficie específica
    const { data: ceTournaments, error } = await supabase
        .from('tournaments')
        .select('id, year, name, surface, category')
        .eq('surface', surfaceType.toUpperCase())
        .eq('category', category.toUpperCase())
      .ilike('name', '%campeonato de españa%')
      .not('year', 'is', null)
      .order('year', { ascending: false })

      if (error) {
        console.warn(`⚠️ Error obteniendo CE para ${surface}:`, error.message)
        // Fallback a la lógica general sin superficie
        return getCurrentSeason()
      }

    if (ceTournaments && ceTournaments.length > 0) {
      // Verificar que el CE más reciente tenga posiciones definidas
      const latestCE = ceTournaments[0]
      
      // Verificar si hay posiciones para este torneo
      const { data: positions, error: positionsError } = await supabase
        .from('positions')
        .select('id')
        .eq('tournamentId', latestCE.id || '')
        .limit(1)

      if (positionsError) {
        console.warn(`⚠️ Error verificando posiciones para CE ${latestCE.name}:`, positionsError.message)
        // Si no podemos verificar, asumir que no está completo
        const currentYear = new Date().getFullYear()
        return formatSeason(currentYear - 1) // Usar temporada anterior
      }

      if (positions && positions.length > 0) {
        // El CE tiene posiciones, esta temporada está completa
        const referenceSeason = formatSeason(latestCE.year)
        console.log(`📅 Temporada de referencia para ${surface}: ${referenceSeason} (CE completado: ${latestCE.name} - ${surfaceType}/${category})`)
        return referenceSeason
      } else {
        // El CE no tiene posiciones, usar temporada anterior
        const previousYear = latestCE.year - 1
        const referenceSeason = formatSeason(previousYear)
        console.log(`📅 Temporada de referencia para ${surface}: ${referenceSeason} (CE ${latestCE.name} sin posiciones - ${surfaceType}/${category})`)
        return referenceSeason
      }
    }

    // Si no hay CE específico, usar la lógica general sin superficie
    console.log(`📅 No se encontró CE específico para ${surface}, usando lógica general`)
    return getCurrentSeason()

  } catch (error) {
    console.warn('⚠️ Error obteniendo temporada de referencia por superficie:', error)
    const currentYear = new Date().getFullYear()
    return formatSeason(currentYear)
  }
}

const rankingService = {
  // Obtener ranking por superficie
  // Obtener ranking por superficie con cache optimizado
  getRanking: async (surface: string = 'beach_mixed'): Promise<RankingResponse> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      const cacheKey = `ranking_${surface}`
      const cachedData = getFromCache(cacheKey)
      
      if (cachedData) {
        console.log('📦 Usando datos del cache para ranking')
        return cachedData
      }

      console.log('🔄 Obteniendo ranking desde base de datos...')

      // Obtener ranking con información de equipos
      const { data: rankingData, error } = await supabase
        .from('current_rankings')
        .select(`
          *,
          teams:team_id(
            id,
            name,
            nameOpen,
            nameWomen,
            nameMixed,
            regions:regionId(
              id,
              name
            )
          )
        `)
        .eq('ranking_category', surface)
        .order('ranking_position', { ascending: true })

      if (error) {
        console.error('Error al obtener ranking:', error)
        throw error
      }

      // Transformar datos para incluir nombres de equipos y desglose por temporadas
      const referenceSeason = await getCurrentSeason(surface)
      const transformedData: RankingEntry[] = (rankingData || []).map(ranking => {
        // Calcular desglose por temporadas
        const seasonBreakdown: { [season: string]: { base_points: number, weighted_points: number, coefficient: number } } = {}
        
        // Temporada de referencia (la más reciente con datos completos)
        if (ranking.current_season_points > 0) {
          const coefficient = getSeasonCoefficient(referenceSeason, referenceSeason)
          seasonBreakdown[referenceSeason] = {
            base_points: ranking.current_season_points,
            weighted_points: ranking.current_season_points * coefficient,
            coefficient
          }
        }
        
        // Temporada anterior
        if (ranking.previous_season_points > 0) {
          const referenceYear = parseInt(referenceSeason.split('-')[0])
          const prevSeason = formatSeason(referenceYear - 1)
          const coefficient = getSeasonCoefficient(prevSeason, referenceSeason)
          seasonBreakdown[prevSeason] = {
            base_points: ranking.previous_season_points,
            weighted_points: ranking.previous_season_points * coefficient,
            coefficient
          }
        }
        
        // Dos temporadas atrás
        if (ranking.two_seasons_ago_points > 0) {
          const referenceYear = parseInt(referenceSeason.split('-')[0])
          const twoSeasonsAgo = formatSeason(referenceYear - 2)
          const coefficient = getSeasonCoefficient(twoSeasonsAgo, referenceSeason)
          seasonBreakdown[twoSeasonsAgo] = {
            base_points: ranking.two_seasons_ago_points,
            weighted_points: ranking.two_seasons_ago_points * coefficient,
            coefficient
          }
        }
        
        // Tres temporadas atrás
        if (ranking.three_seasons_ago_points > 0) {
          const referenceYear = parseInt(referenceSeason.split('-')[0])
          const threeSeasonsAgo = formatSeason(referenceYear - 3)
          const coefficient = getSeasonCoefficient(threeSeasonsAgo, referenceSeason)
          seasonBreakdown[threeSeasonsAgo] = {
            base_points: ranking.three_seasons_ago_points,
            weighted_points: ranking.three_seasons_ago_points * coefficient,
            coefficient
          }
        }

        return {
        team_id: ranking.team_id,
        team_name: getTeamDisplayNameForCategory(ranking.teams, surface),
        ranking_category: ranking.ranking_category,
        current_season_points: ranking.current_season_points || 0,
        previous_season_points: ranking.previous_season_points || 0,
        two_seasons_ago_points: ranking.two_seasons_ago_points || 0,
        three_seasons_ago_points: ranking.three_seasons_ago_points || 0,
        total_points: ranking.total_points || 0,
        ranking_position: ranking.ranking_position || 0,
          last_calculated: ranking.last_calculated || new Date().toISOString(),
          season_breakdown: seasonBreakdown
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

      const result = {
        data: transformedData,
        summary
      }

      // Guardar en cache
      setCache(cacheKey, result)
      
      console.log(`✅ Ranking obtenido: ${transformedData.length} equipos`)
      return result
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

  // Limpiar cache cuando se recalculen rankings
  clearRankingCache: (category?: string) => {
    if (category) {
      rankingService.clearCache(`ranking_${category}`)
    } else {
      rankingService.clearCache('ranking')
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
  recalculateRankingAlternative: async (category?: string): Promise<any> => {
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
            category,
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

      // Cargar coeficientes regionales de la temporada anterior
      // Convención: coef calculado de T-1 → se aplica a regionales de T
      const refSeason = await getCurrentSeason()
      const prevSeasonYear = parseInt(refSeason.split('-')[0]) - 1
      const prevSeason = formatSeason(prevSeasonYear)
      const regionalCoeffs = await seasonService.getRegionalCoefficients(prevSeason)
      const regionalCoeffMap = new Map<string, number>()
      regionalCoeffs.forEach(c => {
        regionalCoeffMap.set(`${c.regionId}-${c.modality}`, c.coefficient)
      })
      console.log(`📊 Coeficientes regionales cargados para temporada base ${prevSeason}: ${regionalCoeffMap.size} entradas`)

      // Agrupar puntos por equipo, categoría y temporada
      const teamPoints: { [key: string]: { [key: string]: { [key: string]: number } } } = {}

      positions.forEach(position => {
        const tournament = position.tournaments
        const team = position.teams

        console.log('🏆 Procesando posición:', {
          position: position.position,
          points: position.points,
          tournament: tournament?.name || 'Sin torneo',
          team: team?.name || 'Sin equipo',
          year: tournament?.year
        })

        if (!tournament || !team) {
          console.warn('⚠️ Posición sin torneo o equipo:', position)
          return
        }

        // Determinar superficie basada en superficie y categoría
        const surface = `${tournament.surface.toLowerCase()}_${tournament.category.toLowerCase()}`
        const teamKey = team.id
        const season = formatSeason(tournament.year)

        if (!teamPoints[teamKey]) {
          teamPoints[teamKey] = {}
        }

        if (!teamPoints[teamKey][surface]) {
          teamPoints[teamKey][surface] = {}
        }

        if (!teamPoints[teamKey][surface][season]) {
          teamPoints[teamKey][surface][season] = 0
        }

        // Aplicar coeficiente regional solo a torneos REGIONAL
        const isRegional = tournament.type === 'REGIONAL'
        const regionalCoef = isRegional
          ? (regionalCoeffMap.get(`${team.regionId}-${surface}`) ?? 1.0)
          : 1.0

        teamPoints[teamKey][surface][season] += (position.points || 0) * regionalCoef
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

      // Insertar nuevos rankings con cálculo por temporadas
      const rankingEntries = []
      // Nota: category aquí almacena superficies (beach_mixed, etc.)
      const currentSeason = await getCurrentSeason(category)
      
      Object.keys(teamPoints).forEach(teamId => {
        Object.keys(teamPoints[teamId]).forEach(surfaceKey => {
          const seasonPoints = teamPoints[teamId][surfaceKey]
          
          // Calcular puntos por temporada con coeficientes
          let currentSeasonPoints = 0
          let previousSeasonPoints = 0
          let twoSeasonsAgoPoints = 0
          let threeSeasonsAgoPoints = 0
          let totalPoints = 0
          
          Object.keys(seasonPoints).forEach(season => {
            const basePoints = seasonPoints[season]
            const coefficient = getSeasonCoefficient(season, currentSeason)
            const weightedPoints = basePoints * coefficient
            
            totalPoints += weightedPoints
            
            // Asignar puntos BASE (sin coeficiente) a la temporada correspondiente
            if (season === currentSeason) {
              currentSeasonPoints = basePoints
            } else if (season === formatSeason(parseInt(currentSeason.split('-')[0]) - 1)) {
              previousSeasonPoints = basePoints
            } else if (season === formatSeason(parseInt(currentSeason.split('-')[0]) - 2)) {
              twoSeasonsAgoPoints = basePoints
            } else if (season === formatSeason(parseInt(currentSeason.split('-')[0]) - 3)) {
              threeSeasonsAgoPoints = basePoints
            }
          })
          
          if (totalPoints > 0) {
          rankingEntries.push({
            team_id: teamId,
            ranking_category: surfaceKey,
              current_season_points: currentSeasonPoints,
              previous_season_points: previousSeasonPoints,
              two_seasons_ago_points: twoSeasonsAgoPoints,
              three_seasons_ago_points: threeSeasonsAgoPoints,
            total_points: totalPoints,
            ranking_position: 0, // Se calculará después
            last_calculated: new Date().toISOString()
          })
          }
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

      // Limpiar cache después del recálculo
      clearCache('ranking')

      return { 
        message: `Ranking recalculado exitosamente. ${rankingEntries.length} entradas procesadas.` 
      }
    } catch (error) {
      console.error('Error en método alternativo:', error)
      throw error
    }
  },

  // Método para recalcular solo una superficie específica
  // Nota: el parámetro category almacena superficies (beach_mixed, etc.)
  recalculateSpecificCategory: async (category: string): Promise<any> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log(`🔄 Recalculando superficie específica: ${category}`)

      // Obtener todas las posiciones de la superficie específica
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
            category,
            regionId
          ),
          teams:teamId(
            id,
            name,
            regionId
          )
        `)
        .eq('tournaments.surface', category.split('_')[0].toUpperCase())
        .eq('tournaments.category', category.split('_')[1].toUpperCase())

      if (positionsError) {
        console.error('Error al obtener posiciones:', positionsError)
        throw positionsError
      }

      console.log(`📊 Posiciones obtenidas para ${category}:`, positions?.length || 0)

      // Eliminar rankings existentes de esta superficie
      const { error: deleteError } = await supabase
        .from('current_rankings')
        .delete()
        .eq('ranking_category', category)

      if (deleteError) {
        console.error('Error al eliminar rankings de la superficie:', deleteError)
        throw deleteError
      }

      if (!positions || positions.length === 0) {
        console.log(`ℹ️ No hay posiciones para la superficie ${category}`)
        return { message: `No hay posiciones para la superficie ${category}` }
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

      console.log(`✅ Superficie ${category} recalculada exitosamente`)

      // Limpiar cache específico de la superficie
      clearCache(`ranking_${category}`)

      return { 
        message: `Superficie ${category} recalculada exitosamente. ${rankingEntries.length} entradas procesadas.` 
      }
    } catch (error) {
      console.error(`Error al recalcular superficie ${category}:`, error)
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

  // Validación de integridad referencial
  validateReferentialIntegrity: async (): Promise<any> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log('🔍 Validando integridad referencial...')

      const issues = []

      // 1. Verificar posiciones con equipos inexistentes
      const { data: orphanPositions } = await supabase
        .from('positions')
        .select('id, teamId')
        .not('teamId', 'in', `(SELECT id FROM teams)`)

      if (orphanPositions && orphanPositions.length > 0) {
        issues.push({
          type: 'orphan_positions',
          count: orphanPositions.length,
          message: `${orphanPositions.length} posiciones con equipos inexistentes`
        })
      }

      // 2. Verificar posiciones con torneos inexistentes
      const { data: orphanTournaments } = await supabase
        .from('positions')
        .select('id, tournamentId')
        .not('tournamentId', 'in', `(SELECT id FROM tournaments)`)

      if (orphanTournaments && orphanTournaments.length > 0) {
        issues.push({
          type: 'orphan_tournaments',
          count: orphanTournaments.length,
          message: `${orphanTournaments.length} posiciones con torneos inexistentes`
        })
      }

      // 3. Verificar rankings con equipos inexistentes
      const { data: orphanRankings } = await supabase
        .from('current_rankings')
        .select('id, team_id')
        .not('team_id', 'in', `(SELECT id FROM teams)`)

      if (orphanRankings && orphanRankings.length > 0) {
        issues.push({
          type: 'orphan_rankings',
          count: orphanRankings.length,
          message: `${orphanRankings.length} rankings con equipos inexistentes`
        })
      }

      const result = {
        isValid: issues.length === 0,
        issues,
        totalIssues: issues.length,
        timestamp: new Date().toISOString()
      }

      console.log('✅ Validación de integridad completada:', result)
      return result

    } catch (error) {
      console.error('Error en validación de integridad:', error)
      throw error
    }
  },

  // Validación de rangos de puntos
  validatePointRanges: async (): Promise<any> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log('🔍 Validando rangos de puntos...')

      const issues = []

      // 1. Verificar puntos negativos en posiciones
      const { data: negativePositions } = await supabase
        .from('positions')
        .select('id, points, teamId, tournamentId')
        .lt('points', 0)

      if (negativePositions && negativePositions.length > 0) {
        issues.push({
          type: 'negative_points',
          count: negativePositions.length,
          message: `${negativePositions.length} posiciones con puntos negativos`,
          data: negativePositions
        })
      }

      // 2. Verificar puntos excesivamente altos (> 10000)
      const { data: excessivePositions } = await supabase
        .from('positions')
        .select('id, points, teamId, tournamentId')
        .gt('points', 10000)

      if (excessivePositions && excessivePositions.length > 0) {
        issues.push({
          type: 'excessive_points',
          count: excessivePositions.length,
          message: `${excessivePositions.length} posiciones con puntos excesivos (>10000)`,
          data: excessivePositions
        })
      }

      // 3. Verificar posiciones fuera de rango (1-100)
      const { data: invalidPositions } = await supabase
        .from('positions')
        .select('id, position, teamId, tournamentId')
        .or('position.lt.1,position.gt.100')

      if (invalidPositions && invalidPositions.length > 0) {
        issues.push({
          type: 'invalid_position_range',
          count: invalidPositions.length,
          message: `${invalidPositions.length} posiciones fuera del rango válido (1-100)`,
          data: invalidPositions
        })
      }

      const result = {
        isValid: issues.length === 0,
        issues,
        totalIssues: issues.length,
        timestamp: new Date().toISOString()
      }

      console.log('✅ Validación de rangos completada:', result)
      return result

    } catch (error) {
      console.error('Error en validación de rangos:', error)
      throw error
    }
  },

  // Ejecutar todas las validaciones
  runAllValidations: async (): Promise<any> => {
    try {
      console.log('🔍 Ejecutando todas las validaciones...')

      const [integrity, points] = await Promise.all([
        rankingService.validateReferentialIntegrity(),
        rankingService.validatePointRanges()
      ])

      const allIssues = [
        ...integrity.issues,
        ...points.issues
      ]

      const result = {
        isValid: allIssues.length === 0,
        validations: {
          integrity,
          points
        },
        totalIssues: allIssues.length,
        allIssues,
        timestamp: new Date().toISOString()
      }

      console.log('✅ Todas las validaciones completadas:', result)
      return result

    } catch (error) {
      console.error('Error en validaciones completas:', error)
      throw error
    }
  },

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
            name,
            nameOpen,
            nameWomen,
            nameMixed
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
          team_name: getTeamDisplayNameForCategory(entry.teams, category),
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
        .select(`id, ${TEAM_RANKING_NAME_SELECT}`)
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
        team_name: getTeamDisplayNameForCategory(teamData, category),
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
            nameOpen,
            nameWomen,
            nameMixed,
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

      // Transformar datos para incluir nombres de equipos y desglose por temporadas
      const currentSeason = await getCurrentSeason(category)
      const transformedData: RankingEntry[] = (rankingData || []).map(ranking => {
        console.log('🏆 Procesando ranking:', {
          team_id: ranking.team_id,
          team_name: ranking.teams?.name,
          has_team: !!ranking.teams,
          region_name: ranking.teams?.regions?.name
        })
        
        // Calcular desglose por temporadas
        const seasonBreakdown: { [season: string]: { base_points: number, weighted_points: number, coefficient: number } } = {}
        
        // Temporada de referencia (la más reciente con datos completos)
        if (ranking.current_season_points > 0) {
          const coefficient = getSeasonCoefficient(currentSeason, currentSeason)
          seasonBreakdown[currentSeason] = {
            base_points: ranking.current_season_points,
            weighted_points: ranking.current_season_points * coefficient,
            coefficient
          }
        }
        
        // Temporada anterior
        if (ranking.previous_season_points > 0) {
          const referenceYear = parseInt(currentSeason.split('-')[0])
          const prevSeason = formatSeason(referenceYear - 1)
          const coefficient = getSeasonCoefficient(prevSeason, currentSeason)
          seasonBreakdown[prevSeason] = {
            base_points: ranking.previous_season_points,
            weighted_points: ranking.previous_season_points * coefficient,
            coefficient
          }
        }
        
        // Dos temporadas atrás
        if (ranking.two_seasons_ago_points > 0) {
          const referenceYear = parseInt(currentSeason.split('-')[0])
          const twoSeasonsAgo = formatSeason(referenceYear - 2)
          const coefficient = getSeasonCoefficient(twoSeasonsAgo, currentSeason)
          seasonBreakdown[twoSeasonsAgo] = {
            base_points: ranking.two_seasons_ago_points,
            weighted_points: ranking.two_seasons_ago_points * coefficient,
            coefficient
          }
        }
        
        // Tres temporadas atrás
        if (ranking.three_seasons_ago_points > 0) {
          const referenceYear = parseInt(currentSeason.split('-')[0])
          const threeSeasonsAgo = formatSeason(referenceYear - 3)
          const coefficient = getSeasonCoefficient(threeSeasonsAgo, currentSeason)
          seasonBreakdown[threeSeasonsAgo] = {
            base_points: ranking.three_seasons_ago_points,
            weighted_points: ranking.three_seasons_ago_points * coefficient,
            coefficient
          }
        }
        
        return {
          team_id: ranking.team_id,
          team_name: getTeamDisplayNameForCategory(ranking.teams, category),
          ranking_category: ranking.ranking_category,
          current_season_points: ranking.current_season_points || 0,
          previous_season_points: ranking.previous_season_points || 0,
          two_seasons_ago_points: ranking.two_seasons_ago_points || 0,
          three_seasons_ago_points: ranking.three_seasons_ago_points || 0,
          total_points: ranking.total_points || 0,
          ranking_position: ranking.ranking_position || 0,
          last_calculated: ranking.last_calculated || new Date().toISOString(),
          season_breakdown: seasonBreakdown,
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
            nameOpen,
            nameWomen,
            nameMixed,
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
        team_name: getTeamDisplayNameForCategory(ranking.teams, 'general'),
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

  // Método de diagnóstico mejorado para verificar el estado de la base de datos
  diagnoseRanking: async (): Promise<any> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log('🔍 Iniciando diagnóstico completo del ranking...')

      const diagnostics = {
        timestamp: new Date().toISOString(),
        tables: {},
        dataIntegrity: {},
        performance: {},
        recommendations: []
      }

      // 1. Verificar tablas principales
      const tables = ['current_rankings', 'positions', 'teams', 'tournaments', 'regions']
      
      for (const table of tables) {
        try {
          const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact' })
        .limit(5)

          diagnostics.tables[table] = {
            exists: !error,
            error: error?.message || null,
            sampleData: data || [],
            totalRecords: count || 0,
            status: error ? 'error' : 'ok'
          }
        } catch (err) {
          diagnostics.tables[table] = {
            exists: false,
            error: err.message,
            sampleData: [],
            totalRecords: 0,
            status: 'error'
          }
        }
      }

      // 2. Verificar integridad de datos
      try {
        // Verificar que todas las posiciones tienen equipos válidos
        const { data: orphanPositions } = await supabase
        .from('positions')
          .select('id, teamId')
          .is('teamId', null)

        // Verificar que todas las posiciones tienen torneos válidos
        const { data: orphanTournaments } = await supabase
          .from('positions')
          .select('id, tournamentId')
          .is('tournamentId', null)

        // Verificar rankings sin equipos válidos
        const { data: orphanRankings } = await supabase
          .from('current_rankings')
          .select('id, team_id')
          .is('team_id', null)

        diagnostics.dataIntegrity = {
          orphanPositions: orphanPositions?.length || 0,
          orphanTournaments: orphanTournaments?.length || 0,
          orphanRankings: orphanRankings?.length || 0,
          hasOrphans: (orphanPositions?.length || 0) > 0 || (orphanTournaments?.length || 0) > 0 || (orphanRankings?.length || 0) > 0
        }
      } catch (err) {
        diagnostics.dataIntegrity = { error: err.message }
      }

      // 3. Verificar consistencia de rankings
      try {
        const { data: rankings } = await supabase
          .from('current_rankings')
        .select('*')
          .order('ranking_category', { ascending: true })
          .order('total_points', { ascending: false })

        if (rankings && rankings.length > 0) {
          const categories = [...new Set(rankings.map(r => r.ranking_category))]
          let inconsistentCategories = 0
          let totalInconsistencies = 0

          for (const category of categories) {
            const categoryRankings = rankings.filter(r => r.ranking_category === category)
            categoryRankings.sort((a, b) => b.total_points - a.total_points)
            
            let categoryInconsistencies = 0
            categoryRankings.forEach((ranking, index) => {
              if (ranking.ranking_position !== index + 1) {
                categoryInconsistencies++
                totalInconsistencies++
              }
            })

            if (categoryInconsistencies > 0) {
              inconsistentCategories++
            }
          }

          diagnostics.dataIntegrity.rankingConsistency = {
            totalCategories: categories.length,
            inconsistentCategories,
            totalInconsistencies,
            isConsistent: inconsistentCategories === 0
          }
        }
      } catch (err) {
        diagnostics.dataIntegrity.rankingConsistency = { error: err.message }
      }

      // 4. Generar recomendaciones
      if (diagnostics.dataIntegrity.hasOrphans) {
        diagnostics.recommendations.push('🔧 Limpiar datos huérfanos en posiciones y rankings')
      }

      if (diagnostics.dataIntegrity.rankingConsistency && !diagnostics.dataIntegrity.rankingConsistency.isConsistent) {
        diagnostics.recommendations.push('🔧 Ejecutar validación de consistencia de rankings')
      }

      if (diagnostics.tables.current_rankings.totalRecords === 0) {
        diagnostics.recommendations.push('⚠️ No hay rankings calculados. Ejecutar recálculo completo.')
      }

      if (diagnostics.tables.positions.totalRecords === 0) {
        diagnostics.recommendations.push('⚠️ No hay posiciones registradas. Importar resultados de torneos.')
      }

      // 5. Estadísticas de rendimiento
      const startTime = Date.now()
      try {
        await supabase.from('current_rankings').select('count').limit(1)
        diagnostics.performance.queryTime = Date.now() - startTime
      } catch (err) {
        diagnostics.performance.queryTime = -1
      }

      console.log('✅ Diagnóstico completado:', diagnostics)
      return diagnostics

    } catch (error) {
      console.error('❌ Error en diagnóstico:', error)
      return { 
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  },

  // Obtener estadísticas del ranking (equipos únicos; current_rankings tiene una fila por categoría)
  getRankingStats: async (): Promise<any> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      const [teamsCountResult, rankingsResult] = await Promise.all([
        supabase.from('teams').select('id', { count: 'exact', head: true }),
        supabase.from('current_rankings').select('team_id, total_points'),
      ])

      if (rankingsResult.error) {
        console.error('Error al obtener estadísticas:', rankingsResult.error)
        throw rankingsResult.error
      }
      if (teamsCountResult.error) {
        console.error('Error al contar equipos registrados:', teamsCountResult.error)
        throw teamsCountResult.error
      }

      const teamBestPoints = new Map<string, number>()
      for (const entry of rankingsResult.data ?? []) {
        const current = teamBestPoints.get(entry.team_id) ?? 0
        if (entry.total_points > current) {
          teamBestPoints.set(entry.team_id, entry.total_points)
        }
      }

      const pointValues = [...teamBestPoints.values()].filter((pts) => pts > 0)
      const teamsWithPoints = pointValues.length
      const totalTeams = teamsCountResult.count ?? 0
      const maxPoints = pointValues.length > 0 ? Math.max(...pointValues) : 0
      const totalPoints = pointValues.reduce((sum, pts) => sum + pts, 0)
      const avgPoints = teamsWithPoints > 0 ? (totalPoints / teamsWithPoints).toFixed(1) : '0.0'

      return {
        total_teams: totalTeams,
        teams_with_points: teamsWithPoints,
        max_points: maxPoints,
        avg_points: avgPoints,
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
            name,
            nameOpen,
            nameWomen,
            nameMixed
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
          team_name: getTeamDisplayNameForCategory(entry.teams, category),
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
