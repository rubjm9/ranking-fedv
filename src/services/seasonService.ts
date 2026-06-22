import { supabase } from './supabaseService'
import { 
  calculateRegionalCoefficient, 
  DEFAULT_REGIONAL_CONFIG,
  DEFAULT_TEMPORAL_WEIGHTS,
  formatSeasonFromYear,
  getNextSeasonLabel,
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

export interface RegionalCoefficientSaveResult {
  season: string
  calculated: number
  saved: number
  failed: number
  errors: string[]
}

export interface RegionalCoefficientYearBreakdown {
  year: number
  weight: number
  rawPoints: number
  weightedPoints: number
}

export interface RegionalCoefficientRegionBreakdown {
  regionId: string
  regionName: string
  weightedPoints: number
  coefficient: number
  deviationFromMean: number
  yearBreakdown: RegionalCoefficientYearBreakdown[]
  isManualOverride?: boolean
}

export interface RegionalCoefficientModalityBreakdown {
  modality: string
  nationalMean: number
  regions: RegionalCoefficientRegionBreakdown[]
}

export interface RegionalCoefficientSeasonBreakdown {
  calculationSeason: string
  appliesToSeason: string
  windowYears: { year: number; seasonLabel: string; weight: number }[]
  modalities: RegionalCoefficientModalityBreakdown[]
}

const MODALITIES = ['beach_mixed', 'beach_open', 'beach_women', 'grass_mixed', 'grass_open', 'grass_women'] as const

const buildWindowYears = (season: string) => {
  const baseYear = parseInt(season.split('-')[0])
  const temporalWeightByYear: Record<number, number> = {
    [baseYear]: DEFAULT_TEMPORAL_WEIGHTS.current,
    [baseYear - 1]: DEFAULT_TEMPORAL_WEIGHTS.previous,
    [baseYear - 2]: DEFAULT_TEMPORAL_WEIGHTS.twoAgo,
    [baseYear - 3]: DEFAULT_TEMPORAL_WEIGHTS.threeAgo,
  }
  const windowYears = [baseYear, baseYear - 1, baseYear - 2, baseYear - 3].map(year => ({
    year,
    seasonLabel: formatSeasonFromYear(year),
    weight: temporalWeightByYear[year],
  }))
  return { baseYear, temporalWeightByYear, windowYears }
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
   * Lista temporadas con coeficientes guardados (más reciente primero).
   */
  listRegionalCoefficientSeasons: async (): Promise<string[]> => {
    try {
      if (!supabase) return []

      const { data, error } = await supabase
        .from('regional_coefficients')
        .select('season')
        .order('season', { ascending: false })

      if (error || !data?.length) {
        const { data: tournamentRows } = await supabase
          .from('tournaments')
          .select('year')
          .not('year', 'is', null)
          .order('year', { ascending: false })

        const years = [...new Set((tournamentRows || []).map((r: { year: number }) => r.year))]
        return years.map(y => `${y}-${String(y + 1).slice(-2)}`)
      }

      return [...new Set(data.map(r => r.season as string))].sort((a, b) => b.localeCompare(a))
    } catch (error) {
      console.error('Error listando temporadas de coeficientes:', error)
      return []
    }
  },

  /**
   * Desglose completo del cálculo de coeficientes para una temporada.
   */
  getRegionalCoefficientBreakdown: async (
    season: string,
    regionId?: string,
    applySavedOverrides = true
  ): Promise<RegionalCoefficientSeasonBreakdown | null> => {
    try {
      if (!supabase) throw new Error('Supabase no está configurado')

      const { data: regions, error: regionsError } = await supabase
        .from('regions')
        .select('id, name')
        .order('name')

      if (regionsError) throw regionsError
      if (!regions?.length) return null

      const filteredRegions = regionId
        ? regions.filter(r => r.id === regionId)
        : regions

      const { temporalWeightByYear, windowYears } = buildWindowYears(season)
      const windowYearList = windowYears.map(w => w.year)

      const { data: positions, error: positionsError } = await supabase
        .from('positions')
        .select(`
          points,
          tournaments:tournamentId!inner(year, type, surface, category),
          teams:teamId!inner(id, regionId)
        `)
        .in('tournaments.type', ['CE1', 'CE2'])
        .in('tournaments.year', windowYearList)

      if (positionsError) {
        console.warn(`⚠️ Sin datos de posiciones para desglose de ${season}:`, positionsError.message)
      }

      const regionPts: Record<string, Record<string, number>> = {}
      const regionYearPts: Record<string, Record<string, Record<number, number>>> = {}

      regions.forEach(r => {
        regionPts[r.id] = Object.fromEntries(MODALITIES.map(m => [m, 0]))
        regionYearPts[r.id] = Object.fromEntries(
          MODALITIES.map(m => [m, Object.fromEntries(windowYearList.map(y => [y, 0]))])
        )
      })

      ;(positions || []).forEach(row => {
        const tournament = (row as { tournaments?: { year: number; surface: string; category: string } }).tournaments
        const regionIdRow = (row as { teams?: { regionId: string } }).teams?.regionId
        if (!tournament || !regionIdRow || !regionPts[regionIdRow]) return

        const weight = temporalWeightByYear[tournament.year]
        if (!weight) return

        const modality = `${String(tournament.surface).toLowerCase()}_${String(tournament.category).toLowerCase()}`
        if (!(modality in regionPts[regionIdRow])) return

        const pts = (row as { points?: number }).points || 0
        regionPts[regionIdRow][modality] += pts * weight
        regionYearPts[regionIdRow][modality][tournament.year] += pts
      })

      const savedCoeffs = applySavedOverrides
        ? await seasonService.getRegionalCoefficients(season)
        : []
      const savedMap = new Map(
        savedCoeffs.map(c => [`${c.regionId}-${c.modality}`, c])
      )

      const modalities: RegionalCoefficientModalityBreakdown[] = MODALITIES.map(modality => {
        const allPts = regions.map(r => regionPts[r.id][modality])
        const total = allPts.reduce((s, p) => s + p, 0)
        const mean = total > 0 ? total / regions.length : 0

        const regionBreakdowns: RegionalCoefficientRegionBreakdown[] = filteredRegions.map(region => {
          const weightedPoints = regionPts[region.id][modality]
          const coef = calculateRegionalCoefficient(weightedPoints, mean, DEFAULT_REGIONAL_CONFIG)
          const saved = savedMap.get(`${region.id}-${modality}`)
          const yearBreakdown = windowYearList.map(year => {
            const rawPoints = regionYearPts[region.id][modality][year] || 0
            const weight = temporalWeightByYear[year]
            return {
              year,
              weight,
              rawPoints,
              weightedPoints: rawPoints * weight,
            }
          })

          return {
            regionId: region.id,
            regionName: region.name,
            weightedPoints,
            coefficient: applySavedOverrides && saved ? saved.coefficient : coef,
            deviationFromMean: mean > 0 ? ((weightedPoints - mean) / mean) * 100 : 0,
            yearBreakdown,
            isManualOverride: saved?.isManualOverride ?? false,
          }
        })

        return { modality, nationalMean: mean, regions: regionBreakdowns }
      })

      return {
        calculationSeason: season,
        appliesToSeason: getNextSeasonLabel(season),
        windowYears,
        modalities,
      }
    } catch (error) {
      console.error('Error obteniendo desglose de coeficientes:', error)
      return null
    }
  },

  /**
   * Calcula coeficientes regionales para una temporada (6 modalidades × todas las regiones).
   *
   * Fuente de datos: posiciones de torneos NACIONALES (CE1 y CE2) de las 4 últimas
   * temporadas (la propia `season` y las 3 anteriores), ponderadas por antigüedad
   * con los pesos [1.0, 0.8, 0.5, 0.2]. Los campeonatos regionales se excluyen para
   * medir la fortaleza "pura" de cada región en el ámbito nacional.
   *
   * Convención: los coeficientes calculados aquí se almacenan con season=season
   * y se aplican a los torneos REGIONAL de la temporada siguiente (season+1).
   */
  calculateRegionalCoefficients: async (season: string): Promise<RegionalCoefficient[]> => {
    const breakdown = await seasonService.getRegionalCoefficientBreakdown(season, undefined, false)
    if (!breakdown) return []

    const now = new Date().toISOString()
    const coefficients: RegionalCoefficient[] = []

    breakdown.modalities.forEach(({ modality, regions }) => {
      regions.forEach(region => {
        coefficients.push({
          id: `${region.regionId}-${season}-${modality}`,
          regionId: region.regionId,
          regionName: region.regionName,
          season,
          modality,
          coefficient: region.coefficient,
          isManualOverride: region.isManualOverride ?? false,
          calculatedValue: region.coefficient,
          appliedAt: now,
        })
      })
    })

    console.log(`✅ Coeficientes calculados: ${coefficients.length} entradas`)
    return coefficients
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

      // Enumerar temporadas a partir de los años de torneos (independiente de
      // team_season_rankings, ya que los coeficientes se calculan desde positions).
      const { data: rows, error } = await supabase
        .from('tournaments')
        .select('year')
        .not('year', 'is', null)
        .order('year', { ascending: true })

      if (error) throw error

      const years = [...new Set((rows || []).map((r: any) => r.year as number))]
      const seasons = years.map(y => `${y}-${String(y + 1).slice(-2)}`)
      console.log(`🔄 Backfill coeficientes para temporadas: ${seasons.join(', ')}`)

      const results: { season: string; count: number }[] = []

      for (const season of seasons) {
        const result = await seasonService.calculateAndSaveRegionalCoefficients(season)
        results.push({ season, count: result.saved })
      }

      return results
    } catch (error) {
      console.error('Error en backfill de coeficientes:', error)
      return []
    }
  },

  /**
   * Calcula y persiste los coeficientes regionales de una temporada.
   * Devuelve cuántos se calcularon y cuántos se guardaron realmente en BD.
   */
  calculateAndSaveRegionalCoefficients: async (season: string): Promise<RegionalCoefficientSaveResult> => {
    if (!supabase) throw new Error('Supabase no está configurado')

    const coefficients = await seasonService.calculateRegionalCoefficients(season)
    const errors: string[] = []

    if (coefficients.length === 0) {
      return { season, calculated: 0, saved: 0, failed: 0, errors }
    }

    const rows = coefficients.map(c => ({
      id: c.id,
      regionId: c.regionId,
      season: c.season,
      modality: c.modality,
      coefficient: c.coefficient,
      isManualOverride: false,
      calculatedValue: c.calculatedValue,
      appliedAt: c.appliedAt,
    }))

    const { error: upsertError } = await supabase
      .from('regional_coefficients')
      .upsert(rows)

    if (upsertError) {
      errors.push(upsertError.message)
      console.error(`❌ Error guardando coeficientes de ${season}:`, upsertError)
      return {
        season,
        calculated: coefficients.length,
        saved: 0,
        failed: coefficients.length,
        errors,
      }
    }

    console.log(`✅ Temporada ${season}: ${coefficients.length} coeficientes guardados`)
    return {
      season,
      calculated: coefficients.length,
      saved: coefficients.length,
      failed: 0,
      errors,
    }
  },
}

export default seasonService
