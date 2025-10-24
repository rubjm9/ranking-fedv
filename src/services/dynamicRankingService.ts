/**
 * Servicio para cálculo dinámico de rankings globales y combinados
 * Detecta automáticamente qué subtemporadas se han jugado y aplica coeficientes correctos
 */

import { supabase } from './supabaseService'

export interface DynamicRankingEntry {
  team_id: string
  team_name: string
  region_name: string
  total_points: number
  rank: number
  breakdown: {
    beach_mixed_points: number
    beach_open_points: number
    beach_women_points: number
    grass_mixed_points: number
    grass_open_points: number
    grass_women_points: number
  }
  coefficients: {
    beach_mixed: number
    beach_open: number
    beach_women: number
    grass_mixed: number
    grass_open: number
    grass_women: number
  }
}

export type RankingType = 
  | 'global'           // Suma de todas las modalidades
  | 'beach'            // Suma de playa mixto + open + women
  | 'grass'            // Suma de césped mixto + open + women
  | 'open'             // Suma de playa open + césped open
  | 'women'            // Suma de playa women + césped women
  | 'mixed'            // Suma de playa mixto + césped mixto
  | 'beach_mixed'      // Solo playa mixto
  | 'beach_open'       // Solo playa open
  | 'beach_women'      // Solo playa women
  | 'grass_mixed'      // Solo césped mixto
  | 'grass_open'       // Solo césped open
  | 'grass_women'      // Solo césped women

const dynamicRankingService = {
  /**
   * Detectar qué subtemporadas se han jugado en la temporada actual
   */
  detectPlayedSubseasons: async (currentSeason: string): Promise<{
    beach_mixed: boolean
    beach_open: boolean
    beach_women: boolean
    grass_mixed: boolean
    grass_open: boolean
    grass_women: boolean
  }> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      // Obtener torneos de 1ª división de la temporada actual
      const { data: tournaments, error } = await supabase
        .from('tournaments')
        .select('surface, modality, type')
        .eq('season', currentSeason)
        .eq('type', 'CE1') // Solo 1ª división
        .not('positions', 'is', null) // Que tengan posiciones (resultados completos)

      if (error) {
        console.error('Error detectando subtemporadas:', error)
        return {
          beach_mixed: false,
          beach_open: false,
          beach_women: false,
          grass_mixed: false,
          grass_open: false,
          grass_women: false
        }
      }

      // Detectar qué modalidades se han jugado
      const playedSubseasons = {
        beach_mixed: false,
        beach_open: false,
        beach_women: false,
        grass_mixed: false,
        grass_open: false,
        grass_women: false
      }

      tournaments?.forEach(tournament => {
        const surface = tournament.surface?.toLowerCase()
        const modality = tournament.modality?.toLowerCase()
        
        if (surface === 'beach' && modality === 'mixed') {
          playedSubseasons.beach_mixed = true
        } else if (surface === 'beach' && modality === 'open') {
          playedSubseasons.beach_open = true
        } else if (surface === 'beach' && modality === 'women') {
          playedSubseasons.beach_women = true
        } else if (surface === 'grass' && modality === 'mixed') {
          playedSubseasons.grass_mixed = true
        } else if (surface === 'grass' && modality === 'open') {
          playedSubseasons.grass_open = true
        } else if (surface === 'grass' && modality === 'women') {
          playedSubseasons.grass_women = true
        }
      })

      console.log(`🎯 Subtemporadas jugadas en ${currentSeason}:`, playedSubseasons)
      return playedSubseasons

    } catch (error) {
      console.error('Error detectando subtemporadas:', error)
      return {
        beach_mixed: false,
        beach_open: false,
        beach_women: false,
        grass_mixed: false,
        grass_open: false,
        grass_women: false
      }
    }
  },

  /**
   * Obtener coeficientes dinámicos según subtemporadas jugadas
   */
  getDynamicCoefficients: async (currentSeason: string): Promise<{
    beach_mixed: number
    beach_open: number
    beach_women: number
    grass_mixed: number
    grass_open: number
    grass_women: number
  }> => {
    const playedSubseasons = await dynamicRankingService.detectPlayedSubseasons(currentSeason)
    
    // Calcular año de la temporada actual
    const currentYear = parseInt(currentSeason.split('-')[0])
    
    const coefficients = {
      beach_mixed: playedSubseasons.beach_mixed ? 1.0 : 0.8, // Si no se jugó, usar temporada anterior
      beach_open: playedSubseasons.beach_open ? 1.0 : 0.8,
      beach_women: playedSubseasons.beach_women ? 1.0 : 0.8,
      grass_mixed: playedSubseasons.grass_mixed ? 1.0 : 0.8,
      grass_open: playedSubseasons.grass_open ? 1.0 : 0.8,
      grass_women: playedSubseasons.grass_women ? 1.0 : 0.8
    }

    console.log(`📊 Coeficientes dinámicos para ${currentSeason}:`, coefficients)
    return coefficients
  },

  /**
   * Calcular ranking dinámico según el tipo especificado
   */
  calculateDynamicRanking: async (
    rankingType: RankingType,
    currentSeason: string = '2024-25'
  ): Promise<DynamicRankingEntry[]> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log(`🔄 Calculando ranking dinámico: ${rankingType} para ${currentSeason}`)

      // Obtener coeficientes dinámicos
      const coefficients = await dynamicRankingService.getDynamicCoefficients(currentSeason)
      
      // Calcular año de la temporada actual
      const currentYear = parseInt(currentSeason.split('-')[0])
      const seasons = [
        currentSeason,
        `${currentYear - 1}-${currentYear.toString().slice(-2)}`,
        `${currentYear - 2}-${(currentYear - 1).toString().slice(-2)}`,
        `${currentYear - 3}-${(currentYear - 2).toString().slice(-2)}`
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
          grass_women_points,
          teams!inner(name, region:regions(name))
        `)
        .in('season', seasons)

      if (error) {
        throw error
      }

      // Calcular puntos totales por equipo según el tipo de ranking
      const teamPointsMap: { [teamId: string]: DynamicRankingEntry } = {}

      seasonData?.forEach((row: any) => {
        const teamId = row.team_id
        const season = row.season
        const seasonIndex = seasons.indexOf(season)
        
        // Coeficientes según antigüedad de temporada
        const seasonCoefficients = [1.0, 0.8, 0.5, 0.2]
        const baseCoefficient = seasonCoefficients[seasonIndex] || 0

        if (!teamPointsMap[teamId]) {
          teamPointsMap[teamId] = {
            team_id: teamId,
            team_name: row.teams.name,
            region_name: row.teams.region?.name || 'Sin región',
            total_points: 0,
            rank: 0,
            breakdown: {
              beach_mixed_points: 0,
              beach_open_points: 0,
              beach_women_points: 0,
              grass_mixed_points: 0,
              grass_open_points: 0,
              grass_women_points: 0
            },
            coefficients: {
              beach_mixed: coefficients.beach_mixed,
              beach_open: coefficients.beach_open,
              beach_women: coefficients.beach_women,
              grass_mixed: coefficients.grass_mixed,
              grass_open: coefficients.grass_open,
              grass_women: coefficients.grass_women
            }
          }
        }

        // Calcular puntos según el tipo de ranking
        let categoryPoints = 0

        switch (rankingType) {
          case 'global':
            categoryPoints = (row.beach_mixed_points || 0) + 
                           (row.beach_open_points || 0) + 
                           (row.beach_women_points || 0) + 
                           (row.grass_mixed_points || 0) + 
                           (row.grass_open_points || 0) + 
                           (row.grass_women_points || 0)
            break
          case 'beach':
            categoryPoints = (row.beach_mixed_points || 0) + 
                           (row.beach_open_points || 0) + 
                           (row.beach_women_points || 0)
            break
          case 'grass':
            categoryPoints = (row.grass_mixed_points || 0) + 
                           (row.grass_open_points || 0) + 
                           (row.grass_women_points || 0)
            break
          case 'open':
            categoryPoints = (row.beach_open_points || 0) + 
                           (row.grass_open_points || 0)
            break
          case 'women':
            categoryPoints = (row.beach_women_points || 0) + 
                           (row.grass_women_points || 0)
            break
          case 'mixed':
            categoryPoints = (row.beach_mixed_points || 0) + 
                           (row.grass_mixed_points || 0)
            break
          case 'beach_mixed':
            categoryPoints = row.beach_mixed_points || 0
            break
          case 'beach_open':
            categoryPoints = row.beach_open_points || 0
            break
          case 'beach_women':
            categoryPoints = row.beach_women_points || 0
            break
          case 'grass_mixed':
            categoryPoints = row.grass_mixed_points || 0
            break
          case 'grass_open':
            categoryPoints = row.grass_open_points || 0
            break
          case 'grass_women':
            categoryPoints = row.grass_women_points || 0
            break
        }

        if (categoryPoints > 0) {
          // Aplicar coeficiente dinámico según el tipo de ranking
          let dynamicCoefficient = 1.0
          
          if (rankingType === 'global') {
            // Para ranking global, usar coeficientes específicos por categoría
            const beachMixedWeight = (row.beach_mixed_points || 0) * coefficients.beach_mixed
            const beachOpenWeight = (row.beach_open_points || 0) * coefficients.beach_open
            const beachWomenWeight = (row.beach_women_points || 0) * coefficients.beach_women
            const grassMixedWeight = (row.grass_mixed_points || 0) * coefficients.grass_mixed
            const grassOpenWeight = (row.grass_open_points || 0) * coefficients.grass_open
            const grassWomenWeight = (row.grass_women_points || 0) * coefficients.grass_women
            
            const totalWeighted = beachMixedWeight + beachOpenWeight + beachWomenWeight + 
                                grassMixedWeight + grassOpenWeight + grassWomenWeight
            const totalUnweighted = categoryPoints
            
            dynamicCoefficient = totalUnweighted > 0 ? totalWeighted / totalUnweighted : 1.0
          } else if (rankingType.includes('beach_')) {
            dynamicCoefficient = coefficients.beach_mixed // Usar el coeficiente de la categoría específica
          } else if (rankingType.includes('grass_')) {
            dynamicCoefficient = coefficients.grass_mixed // Usar el coeficiente de la categoría específica
          }

          const weightedPoints = categoryPoints * baseCoefficient * dynamicCoefficient
          teamPointsMap[teamId].total_points += weightedPoints

          // Actualizar breakdown
          teamPointsMap[teamId].breakdown.beach_mixed_points += (row.beach_mixed_points || 0) * baseCoefficient
          teamPointsMap[teamId].breakdown.beach_open_points += (row.beach_open_points || 0) * baseCoefficient
          teamPointsMap[teamId].breakdown.beach_women_points += (row.beach_women_points || 0) * baseCoefficient
          teamPointsMap[teamId].breakdown.grass_mixed_points += (row.grass_mixed_points || 0) * baseCoefficient
          teamPointsMap[teamId].breakdown.grass_open_points += (row.grass_open_points || 0) * baseCoefficient
          teamPointsMap[teamId].breakdown.grass_women_points += (row.grass_women_points || 0) * baseCoefficient
        }
      })

      // Convertir a array y ordenar por puntos
      const rankingEntries = Object.values(teamPointsMap)
        .filter(entry => entry.total_points > 0)
        .sort((a, b) => b.total_points - a.total_points)

      // Asignar rankings
      rankingEntries.forEach((entry, index) => {
        entry.rank = index + 1
      })

      console.log(`✅ Ranking ${rankingType} calculado: ${rankingEntries.length} equipos`)
      return rankingEntries

    } catch (error) {
      console.error(`❌ Error calculando ranking ${rankingType}:`, error)
      return []
    }
  },

  /**
   * Obtener historial de ranking global para gráficas
   */
  getGlobalRankingHistory: async (teamId?: string): Promise<any[]> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      // Obtener todas las temporadas disponibles
      const { data: tournaments, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('year')
        .not('year', 'is', null)
        .order('year', { ascending: false })

      if (tournamentsError) {
        throw tournamentsError
      }

      const uniqueYears = [...new Set(tournaments?.map((t: any) => t.year) || [])]
      const seasons = uniqueYears.map((year: number) => {
        const nextYear = (year + 1).toString().slice(-2)
        return `${year}-${nextYear}`
      })

      const historyData: any[] = []

      // Para cada temporada, calcular el ranking global
      for (const season of seasons) {
        const ranking = await dynamicRankingService.calculateDynamicRanking('global', season)
        
        if (teamId) {
          // Buscar el equipo específico
          const teamEntry = ranking.find(entry => entry.team_id === teamId)
          if (teamEntry) {
            historyData.push({
              date: `${parseInt(season.split('-')[0])}-12-31`,
              season: season,
              category: 'global',
              rank: teamEntry.rank,
              points: teamEntry.total_points
            })
          }
        } else {
          // Agregar todos los equipos (para análisis general)
          ranking.forEach(entry => {
            historyData.push({
              date: `${parseInt(season.split('-')[0])}-12-31`,
              season: season,
              team_id: entry.team_id,
              team_name: entry.team_name,
              rank: entry.rank,
              points: entry.total_points
            })
          })
        }
      }

      return historyData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    } catch (error) {
      console.error('❌ Error obteniendo historial de ranking global:', error)
      return []
    }
  }
}

export default dynamicRankingService
