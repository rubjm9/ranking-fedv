/**
 * Hook para obtener y cachear las temporadas más recientes
 * Optimización: Una sola query obtiene todas las temporadas, evitando múltiples queries
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/services/supabaseService'

export interface SeasonsByCategory {
  global: string | null
  beach_mixed: string | null
  beach_open: string | null
  beach_women: string | null
  grass_mixed: string | null
  grass_open: string | null
  grass_women: string | null
}

export interface MostRecentSeasonsResult {
  seasons: SeasonsByCategory
  isLoading: boolean
  error: Error | null
  // Helper para obtener la temporada de una categoría específica
  getSeasonForCategory: (category: string) => string | null
  // Helper para verificar si todas las temporadas están cargadas
  allSeasonsLoaded: boolean
}

const CATEGORIES = [
  'beach_mixed',
  'beach_open', 
  'beach_women',
  'grass_mixed',
  'grass_open',
  'grass_women'
] as const

/**
 * Obtiene todas las temporadas más recientes con una sola query
 */
const fetchMostRecentSeasons = async (): Promise<SeasonsByCategory> => {
  if (!supabase) {
    throw new Error('Supabase no está configurado')
  }

  // Query única que obtiene la temporada más reciente con datos para cada categoría
  const { data, error } = await supabase
    .from('team_season_points')
    .select('season, beach_mixed_points, beach_open_points, beach_women_points, grass_mixed_points, grass_open_points, grass_women_points')
    .order('season', { ascending: false })

  if (error) {
    console.error('Error obteniendo temporadas:', error)
    throw error
  }

  if (!data || data.length === 0) {
    // Fallback: calcular basándose en el año actual
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    const fallbackSeason = currentMonth >= 7 
      ? `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
      : `${currentYear - 1}-${currentYear.toString().slice(-2)}`
    
    return {
      global: fallbackSeason,
      beach_mixed: fallbackSeason,
      beach_open: fallbackSeason,
      beach_women: fallbackSeason,
      grass_mixed: fallbackSeason,
      grass_open: fallbackSeason,
      grass_women: fallbackSeason
    }
  }

  // Agrupar por temporada y encontrar cuáles tienen datos
  const seasonsByCategory: SeasonsByCategory = {
    global: null,
    beach_mixed: null,
    beach_open: null,
    beach_women: null,
    grass_mixed: null,
    grass_open: null,
    grass_women: null
  }

  // La temporada más reciente para el ranking global
  seasonsByCategory.global = data[0]?.season || null

  // Para cada categoría, encontrar la temporada más reciente con datos
  for (const category of CATEGORIES) {
    const pointsColumn = `${category}_points` as keyof typeof data[0]
    
    for (const row of data) {
      const points = row[pointsColumn]
      if (points && (typeof points === 'number' ? points > 0 : parseFloat(points) > 0)) {
        seasonsByCategory[category] = row.season
        break
      }
    }

    // Fallback a la temporada global si no hay datos específicos
    if (!seasonsByCategory[category]) {
      seasonsByCategory[category] = seasonsByCategory.global
    }
  }

  console.log('📅 Temporadas más recientes cargadas:', seasonsByCategory)
  return seasonsByCategory
}

/**
 * Hook que proporciona todas las temporadas más recientes
 * con cache largo y reutilizable en toda la aplicación
 */
export const useMostRecentSeasons = (): MostRecentSeasonsResult => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['most-recent-seasons-all'],
    queryFn: fetchMostRecentSeasons,
    staleTime: 30 * 60 * 1000, // 30 minutos - datos que cambian poco
    gcTime: 60 * 60 * 1000, // 1 hora en cache
    refetchOnWindowFocus: false,
    retry: 2
  })

  const defaultSeasons: SeasonsByCategory = {
    global: null,
    beach_mixed: null,
    beach_open: null,
    beach_women: null,
    grass_mixed: null,
    grass_open: null,
    grass_women: null
  }

  const seasons = data || defaultSeasons

  const getSeasonForCategory = (category: string): string | null => {
    if (category === 'general' || category === 'summary') {
      return seasons.global
    }
    return seasons[category as keyof SeasonsByCategory] || seasons.global
  }

  const allSeasonsLoaded = !isLoading && !!data && !!data.global

  return {
    seasons,
    isLoading,
    error: error as Error | null,
    getSeasonForCategory,
    allSeasonsLoaded
  }
}

/**
 * Hook específico para obtener solo la temporada de una categoría
 * Reutiliza el cache del hook principal
 */
export const useSeasonForCategory = (category: string): {
  season: string | null
  isLoading: boolean
} => {
  const { getSeasonForCategory, isLoading } = useMostRecentSeasons()
  
  return {
    season: getSeasonForCategory(category),
    isLoading
  }
}

/**
 * Hook para obtener la temporada global más reciente
 */
export const useGlobalSeason = (): {
  season: string | null
  isLoading: boolean
} => {
  const { seasons, isLoading } = useMostRecentSeasons()
  
  return {
    season: seasons.global,
    isLoading
  }
}

export default useMostRecentSeasons



