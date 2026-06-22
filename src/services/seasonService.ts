import { supabase } from './supabaseService'
import { 
  calculateRegionalCoefficient, 
  DEFAULT_REGIONAL_CONFIG,
  DEFAULT_TEMPORAL_WEIGHTS 
} from '@/utils/rankingCalculations'

export interface Season {
  id: string
  name: string // "2024-25"
  startDate: string
  endDate: string
  isCurrent: boolean
  status: 'active' | 'closed' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface RegionalCoefficient {
  id: string
  regionId: string
  regionName: string
  season: string
  modality: string
  coefficient: number
  isManualOverride: boolean
  calculatedValue: number
  appliedAt: string
  appliedBy?: string
}

export interface SeasonSnapshot {
  season: string
  teamId: string
  teamName: string
  category: string
  totalPoints: number
  rankingPosition: number
  breakdown: {
    year: number
    basePoints: number
    adjustedPoints: number
    temporalWeight: number
    weightedPoints: number
  }[]
}

export interface SeasonCloseResult {
  success: boolean
  season: string
  coefficientsCalculated: number
  snapshotsSaved: number
  errors: string[]
}

const seasonService = {
  /**
   * Obtiene la temporada actual
   */
  getCurrentSeason: async (): Promise<Season | null> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('isCurrent', true)
        .single()

      if (error) {
        console.warn('⚠️ Tabla seasons no disponible, usando temporada por defecto:', error.message)
        // Retornar temporada por defecto basada en el año actual
        const currentYear = new Date().getFullYear()
        return {
          id: 'default',
          name: `${currentYear}-${currentYear + 1}`,
          startDate: `${currentYear}-09-01`,
          endDate: `${currentYear + 1}-08-31`,
          isCurrent: true,
          status: 'active'
        }
      }

      return data
    } catch (error) {
      console.error('Error al obtener temporada actual:', error)
      return null
    }
  },

  /**
   * Obtiene todas las temporadas
   */
  getSeasonsList: async (): Promise<Season[]> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .order('startDate', { ascending: false })

      if (error) {
        console.error('Error al obtener temporadas:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error al obtener temporadas:', error)
      return []
    }
  },

  /**
   * Crea una nueva temporada
   */
  createSeason: async (seasonData: {
    name: string
    startDate: string
    endDate: string
  }): Promise<Season | null> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      // Marcar todas las temporadas como no actuales
      await supabase
        .from('seasons')
        .update({ isCurrent: false })

      // Crear nueva temporada como actual
      const { data, error } = await supabase
        .from('seasons')
        .insert({
          ...seasonData,
          isCurrent: true,
          status: 'active'
        })
        .select()
        .single()

      if (error) {
        console.error('Error al crear temporada:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error al crear temporada:', error)
      return null
    }
  },

  /**
   * Calcula coeficientes regionales para una temporada (6 modalidades × todas las regiones).
   *
   * Fuente de datos: team_season_rankings de la temporada `season`.
   * Convención: los coeficientes calculados aquí se almacenan con season=season
   * y se aplican a los torneos REGIONAL de la temporada siguiente (season+1).
   */
  calculateRegionalCoefficients: async (season: string): Promise<RegionalCoefficient[]> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log(`🔢 Calculando coeficientes regionales para temporada ${season}...`)

      const { data: regions, error: regionsError } = await supabase
        .from('regions')
        .select('id, name')

      if (regionsError) throw regionsError
      if (!regions || regions.length === 0) return []

      // Obtener rankings de la temporada base con datos del equipo (región)
      const { data: rankings, error: rankingsError } = await supabase
        .from('team_season_rankings')
        .select(`
          team_id,
          beach_mixed_points,
          beach_open_points,
          beach_women_points,
          grass_mixed_points,
          grass_open_points,
          grass_women_points,
          teams:team_id(id, regionId)
        `)
        .eq('season', season)

      if (rankingsError) {
        console.warn(`⚠️ Sin datos de team_season_rankings para temporada ${season}, usando coef=1.0`)
      }

      // Inicializar acumuladores por región y modalidad
      const regionPts: Record<string, Record<string, number>> = {}
      regions.forEach(r => {
        regionPts[r.id] = {
          beach_mixed: 0, beach_open: 0, beach_women: 0,
          grass_mixed: 0, grass_open: 0, grass_women: 0,
        }
      })

      ;(rankings || []).forEach(row => {
        const regionId = (row.teams as any)?.regionId
        if (!regionId || !regionPts[regionId]) return
        const acc = regionPts[regionId]
        acc.beach_mixed += (row.beach_mixed_points as number) || 0
        acc.beach_open  += (row.beach_open_points as number)  || 0
        acc.beach_women += (row.beach_women_points as number) || 0
        acc.grass_mixed += (row.grass_mixed_points as number) || 0
        acc.grass_open  += (row.grass_open_points as number)  || 0
        acc.grass_women += (row.grass_women_points as number) || 0
      })

      const modalities = ['beach_mixed', 'beach_open', 'beach_women', 'grass_mixed', 'grass_open', 'grass_women']
      const coefficients: RegionalCoefficient[] = []
      const now = new Date().toISOString()

      modalities.forEach(modality => {
        const allPts = regions.map(r => regionPts[r.id][modality])
        const total = allPts.reduce((s, p) => s + p, 0)
        const mean = total > 0 ? total / regions.length : 0

        regions.forEach(region => {
          const pts = regionPts[region.id][modality]
          const coef = calculateRegionalCoefficient(pts, mean, DEFAULT_REGIONAL_CONFIG)
          coefficients.push({
            id: `${region.id}-${season}-${modality}`,
            regionId: region.id,
            regionName: region.name,
            season,
            modality,
            coefficient: coef,
            isManualOverride: false,
            calculatedValue: coef,
            appliedAt: now,
          })
        })
      })

      console.log(`✅ Coeficientes calculados: ${coefficients.length} entradas (${regions.length} regiones × ${modalities.length} modalidades)`)
      return coefficients
    } catch (error) {
      console.error('Error al calcular coeficientes regionales:', error)
      return []
    }
  },

  /**
   * Guarda snapshot de rankings de una temporada
   */
  saveSeasonSnapshot: async (
    season: string,
    rankings: Array<{
      teamId: string
      teamName: string
      category: string
      totalPoints: number
      rankingPosition: number
      breakdown: any[]
    }>
  ): Promise<number> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log(`💾 Guardando snapshot de temporada ${season}...`)

      // Preparar datos para insertar
      const snapshots: SeasonSnapshot[] = rankings.map(ranking => ({
        season,
        teamId: ranking.teamId,
        teamName: ranking.teamName,
        category: ranking.category,
        totalPoints: ranking.totalPoints,
        rankingPosition: ranking.rankingPosition,
        breakdown: ranking.breakdown
      }))

      // Insertar en lotes
      const batchSize = 100
      let insertedCount = 0

      for (let i = 0; i < snapshots.length; i += batchSize) {
        const batch = snapshots.slice(i, i + batchSize)
        
        const { error } = await supabase
          .from('team_season_rankings')
          .insert(batch)

        if (error) {
          console.error('Error al insertar snapshot:', error)
          throw error
        }

        insertedCount += batch.length
      }

      console.log(`✅ Snapshot guardado: ${insertedCount} entradas`)
      return insertedCount
    } catch (error) {
      console.error('Error al guardar snapshot:', error)
      throw error
    }
  },

  /**
   * Cierra la temporada actual y calcula coeficientes para la siguiente
   */
  closeCurrentSeason: async (): Promise<SeasonCloseResult> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log('🏁 Iniciando cierre de temporada...')

      const result: SeasonCloseResult = {
        success: false,
        season: '',
        coefficientsCalculated: 0,
        snapshotsSaved: 0,
        errors: []
      }

      // Obtener temporada actual
      const currentSeason = await seasonService.getCurrentSeason()
      if (!currentSeason) {
        result.errors.push('No se encontró temporada actual')
        return result
      }

      result.season = currentSeason.name

      try {
        // 1. Calcular coeficientes regionales para la próxima temporada
        console.log('📊 Calculando coeficientes regionales...')
        const coefficients = await seasonService.calculateRegionalCoefficients(currentSeason.name)
        result.coefficientsCalculated = coefficients.length

        // Guardar coeficientes calculados
        for (const coefficient of coefficients) {
          const { error } = await supabase
            .from('regional_coefficients')
            .upsert({
              id: coefficient.id,
              regionId: coefficient.regionId,
              season: coefficient.season,
              modality: coefficient.modality,
              coefficient: coefficient.coefficient,
              isManualOverride: coefficient.isManualOverride,
              calculatedValue: coefficient.calculatedValue,
              appliedAt: coefficient.appliedAt,
            })

          if (error) {
            console.error('Error al guardar coeficiente:', error)
            result.errors.push(`Error al guardar coeficiente para región ${coefficient.regionName}`)
          }
        }

        // 2. Guardar snapshot de rankings actuales
        console.log('📸 Guardando snapshot de rankings...')
        // Esto se haría desde el rankingService después de calcular los rankings finales
        // Por ahora solo simulamos
        result.snapshotsSaved = 0

        // 3. Marcar temporada como cerrada
        const { error: updateError } = await supabase
          .from('seasons')
          .update({ 
            status: 'closed',
            isCurrent: false,
            endDate: new Date().toISOString()
          })
          .eq('id', currentSeason.id)

        if (updateError) {
          console.error('Error al cerrar temporada:', updateError)
          result.errors.push('Error al cerrar temporada')
          return result
        }

        result.success = true
        console.log('✅ Temporada cerrada exitosamente')

      } catch (error) {
        console.error('Error durante el cierre de temporada:', error)
        result.errors.push(`Error durante el cierre: ${error.message}`)
      }

      return result
    } catch (error) {
      console.error('Error al cerrar temporada:', error)
      return {
        success: false,
        season: '',
        coefficientsCalculated: 0,
        snapshotsSaved: 0,
        errors: [`Error general: ${error.message}`]
      }
    }
  },

  /**
   * Obtiene coeficientes regionales para una temporada.
   * Con modality opcional para filtrar por modalidad específica.
   */
  getRegionalCoefficients: async (season: string, modality?: string): Promise<RegionalCoefficient[]> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      let query = supabase
        .from('regional_coefficients')
        .select(`*, regions:regionId(name)`)
        .eq('season', season)

      if (modality) {
        query = query.eq('modality', modality)
      }

      const { data, error } = await query

      if (error) {
        console.warn('⚠️ Tabla regional_coefficients no disponible, usando coef=1.0:', error.message)
        const { data: regions } = await supabase.from('regions').select('id, name')
        const modalities = ['beach_mixed', 'beach_open', 'beach_women', 'grass_mixed', 'grass_open', 'grass_women']
        if (regions) {
          const defaults: RegionalCoefficient[] = []
          const mods = modality ? [modality] : modalities
          regions.forEach(region => {
            mods.forEach(mod => {
              defaults.push({
                id: `default-${region.id}-${mod}`,
                regionId: region.id,
                regionName: region.name,
                season,
                modality: mod,
                coefficient: 1.0,
                isManualOverride: false,
                calculatedValue: 1.0,
                appliedAt: new Date().toISOString(),
              })
            })
          })
          return defaults
        }
        return []
      }

      return (data || []).map(item => ({
        id: item.id,
        regionId: item.regionId,
        regionName: item.regions?.name || 'Región desconocida',
        season: item.season,
        modality: item.modality,
        coefficient: item.coefficient,
        isManualOverride: item.isManualOverride,
        calculatedValue: item.calculatedValue,
        appliedAt: item.appliedAt,
        appliedBy: item.appliedBy,
      }))
    } catch (error) {
      console.error('Error al obtener coeficientes regionales:', error)
      return []
    }
  },

  /**
   * Actualiza coeficiente regional con override manual
   */
  updateRegionalCoefficient: async (
    regionId: string,
    season: string,
    modality: string,
    newCoefficient: number,
    appliedBy?: string
  ): Promise<boolean> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      const { error } = await supabase
        .from('regional_coefficients')
        .upsert({
          id: `${regionId}-${season}-${modality}`,
          regionId,
          season,
          modality,
          coefficient: newCoefficient,
          isManualOverride: true,
          appliedAt: new Date().toISOString(),
          appliedBy,
        })

      if (error) {
        console.error('Error al actualizar coeficiente regional:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error al actualizar coeficiente regional:', error)
      return false
    }
  },

  /**
   * Obtiene historial de coeficientes de una región
   */
  getRegionCoefficientHistory: async (regionId: string): Promise<RegionalCoefficient[]> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('regional_coefficients')
        .select(`
          *,
          regions:regionId(
            name
          )
        `)
        .eq('regionId', regionId)
        .order('season', { ascending: false })

      if (error) {
        console.error('Error al obtener historial de coeficientes:', error)
        return []
      }

      return (data || []).map(item => ({
        id: item.id,
        regionId: item.regionId,
        regionName: item.regions?.name || 'Región desconocida',
        season: item.season,
        modality: item.modality,
        coefficient: item.coefficient,
        isManualOverride: item.isManualOverride,
        calculatedValue: item.calculatedValue,
        appliedAt: item.appliedAt,
        appliedBy: item.appliedBy,
      }))
    } catch (error) {
      console.error('Error al obtener historial de coeficientes:', error)
      return []
    }
  },

  /**
   * Rellena coeficientes regionales para todas las temporadas disponibles.
   * Para cada temporada T que existe en team_season_rankings, calcula los
   * coeficientes y los almacena con season=T (aplican a regionales de T+1).
   * Útil para inicializar el histórico en la primera implementación.
   */
  backfillRegionalCoefficients: async (): Promise<{ season: string; count: number }[]> => {
    try {
      if (!supabase) throw new Error('Supabase no está configurado')

      // Obtener temporadas disponibles en team_season_rankings
      const { data: rows, error } = await supabase
        .from('team_season_rankings')
        .select('season')
        .order('season', { ascending: true })

      if (error) throw error

      const seasons = [...new Set((rows || []).map((r: any) => r.season as string))]
      console.log(`🔄 Backfill coeficientes para temporadas: ${seasons.join(', ')}`)

      const results: { season: string; count: number }[] = []

      for (const season of seasons) {
        const coefficients = await seasonService.calculateRegionalCoefficients(season)

        for (const c of coefficients) {
          const { error: upsertError } = await supabase
            .from('regional_coefficients')
            .upsert({
              id: c.id,
              regionId: c.regionId,
              season: c.season,
              modality: c.modality,
              coefficient: c.coefficient,
              isManualOverride: false,
              calculatedValue: c.calculatedValue,
              appliedAt: c.appliedAt,
            })

          if (upsertError) {
            console.error(`Error upsert coef ${c.id}:`, upsertError)
          }
        }

        results.push({ season, count: coefficients.length })
        console.log(`✅ Temporada ${season}: ${coefficients.length} coeficientes guardados`)
      }

      return results
    } catch (error) {
      console.error('Error en backfill de coeficientes:', error)
      return []
    }
  },
}

export default seasonService
