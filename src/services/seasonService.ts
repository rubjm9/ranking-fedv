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
   * Calcula coeficientes regionales para una temporada
   */
  calculateRegionalCoefficients: async (season: string): Promise<RegionalCoefficient[]> => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log(`🔢 Calculando coeficientes regionales para temporada ${season}...`)

      // Obtener todas las regiones
      const { data: regions, error: regionsError } = await supabase
        .from('regions')
        .select('id, name')

      if (regionsError) {
        console.error('Error al obtener regiones:', regionsError)
        throw regionsError
      }

      const coefficients: RegionalCoefficient[] = []

      // Para cada región, calcular su coeficiente
      for (const region of regions || []) {
        console.log(`📍 Procesando región: ${region.name}`)

        // Obtener puntos CE1 y CE2 de equipos de esta región para la temporada
        const { data: positions, error: positionsError } = await supabase
          .from('positions')
          .select(`
            points,
            tournaments:tournamentId(
              type,
              year
            ),
            teams:teamId(
              regionId
            )
          `)
          .eq('teams.regionId', region.id)
          .in('tournaments.type', ['CE1', 'CE2'])
          .eq('tournaments.year', parseInt(season.split('-')[0])) // Año de inicio de temporada

        if (positionsError) {
          console.error(`Error al obtener posiciones para región ${region.name}:`, positionsError)
          continue
        }

        // Sumar puntos CE1 y CE2
        const totalCe1Ce2Points = (positions || []).reduce((sum, pos) => {
          return sum + (pos.points || 0)
        }, 0)

        console.log(`📊 Puntos CE1+CE2 para ${region.name}: ${totalCe1Ce2Points}`)

        // Calcular coeficiente
        const calculatedCoefficient = calculateRegionalCoefficient(totalCe1Ce2Points)

        coefficients.push({
          id: `${region.id}-${season}`,
          regionId: region.id,
          regionName: region.name,
          season,
          coefficient: calculatedCoefficient,
          isManualOverride: false,
          calculatedValue: calculatedCoefficient,
          appliedAt: new Date().toISOString()
        })
      }

      console.log(`✅ Coeficientes calculados para ${coefficients.length} regiones`)
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
              regionId: coefficient.regionId,
              season: coefficient.season,
              coefficient: coefficient.coefficient,
              isManualOverride: coefficient.isManualOverride,
              calculatedValue: coefficient.calculatedValue,
              appliedAt: coefficient.appliedAt
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
   * Obtiene coeficientes regionales para una temporada
   */
  getRegionalCoefficients: async (season: string): Promise<RegionalCoefficient[]> => {
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
        .eq('season', season)

      if (error) {
        console.warn('⚠️ Tabla regional_coefficients no disponible, usando coeficientes por defecto:', error.message)
        // Retornar coeficientes por defecto (1.0 para todas las regiones)
        const { data: regions } = await supabase
          .from('regions')
          .select('id, name, coefficient')
        
        if (regions) {
          return regions.map(region => ({
            id: `default-${region.id}`,
            regionId: region.id,
            season: season,
            coefficient: region.coefficient || 1.0,
            isManualOverride: false,
            calculatedValue: region.coefficient || 1.0,
            appliedAt: new Date().toISOString(),
            regions: { name: region.name }
          }))
        }
        return []
      }

      return (data || []).map(item => ({
        id: item.id,
        regionId: item.regionId,
        regionName: item.regions?.name || 'Región desconocida',
        season: item.season,
        coefficient: item.coefficient,
        isManualOverride: item.isManualOverride,
        calculatedValue: item.calculatedValue,
        appliedAt: item.appliedAt,
        appliedBy: item.appliedBy
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
          regionId,
          season,
          coefficient: newCoefficient,
          isManualOverride: true,
          appliedAt: new Date().toISOString(),
          appliedBy
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
        coefficient: item.coefficient,
        isManualOverride: item.isManualOverride,
        calculatedValue: item.calculatedValue,
        appliedAt: item.appliedAt,
        appliedBy: item.appliedBy
      }))
    } catch (error) {
      console.error('Error al obtener historial de coeficientes:', error)
      return []
    }
  }
}

export default seasonService
