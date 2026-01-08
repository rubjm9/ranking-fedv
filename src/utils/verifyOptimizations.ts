/**
 * Utilidad para verificar que las optimizaciones se aplicaron correctamente
 */

import { supabase } from '@/services/supabaseService'

export interface VerificationResult {
  success: boolean
  message: string
  details?: any
}

/**
 * Verificar que las columnas de position_change existen y tienen datos
 */
export async function verifyPositionChangeColumns(): Promise<VerificationResult> {
  try {
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase no está configurado'
      }
    }

    // Verificar que las columnas existen
    const { data: columns, error: columnsError } = await supabase
      .from('team_season_rankings')
      .select('beach_mixed_position_change, beach_mixed_points_change, subupdate_4_global_position_change')
      .limit(1)

    if (columnsError) {
      return {
        success: false,
        message: `Error verificando columnas: ${columnsError.message}`
      }
    }

    // Verificar que hay datos con position_change calculado
    const { data: dataWithChanges, error: dataError } = await supabase
      .from('team_season_rankings')
      .select('team_id, season, beach_mixed_position_change, beach_mixed_points_change')
      .not('beach_mixed_position_change', 'is', null)
      .limit(10)

    if (dataError) {
      return {
        success: false,
        message: `Error verificando datos: ${dataError.message}`
      }
    }

    const countWithData = dataWithChanges?.length || 0

    // Contar total de registros
    const { count: totalCount } = await supabase
      .from('team_season_rankings')
      .select('*', { count: 'exact', head: true })

    return {
      success: true,
      message: `Columnas verificadas correctamente. ${countWithData} registros con datos de position_change encontrados de ${totalCount || 0} totales.`,
      details: {
        columnsExist: true,
        recordsWithData: countWithData,
        totalRecords: totalCount || 0,
        sampleData: dataWithChanges?.slice(0, 3)
      }
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Error en verificación: ${error.message}`
    }
  }
}

/**
 * Verificar que la tabla admin_notifications existe
 */
export async function verifyAdminNotificationsTable(): Promise<VerificationResult> {
  try {
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase no está configurado'
      }
    }

    const { data, error } = await supabase
      .from('admin_notifications')
      .select('id, type, status')
      .limit(1)

    if (error) {
      return {
        success: false,
        message: `Error verificando tabla admin_notifications: ${error.message}`
      }
    }

    // Contar notificaciones pendientes
    const { count: pendingCount } = await supabase
      .from('admin_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    return {
      success: true,
      message: `Tabla admin_notifications verificada. ${pendingCount || 0} notificaciones pendientes.`,
      details: {
        tableExists: true,
        pendingNotifications: pendingCount || 0
      }
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Error en verificación: ${error.message}`
    }
  }
}

/**
 * Verificar que los rankings históricos tienen datos
 */
export async function verifyHistoricalRankings(): Promise<VerificationResult> {
  try {
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase no está configurado'
      }
    }

    // Contar registros por temporada
    const { data: seasonsData, error: seasonsError } = await supabase
      .from('team_season_rankings')
      .select('season')
      .order('season', { ascending: false })

    if (seasonsError) {
      return {
        success: false,
        message: `Error obteniendo temporadas: ${seasonsError.message}`
      }
    }

    const uniqueSeasons = [...new Set(seasonsData?.map(s => s.season) || [])]
    const totalRecords = seasonsData?.length || 0

    // Verificar que hay datos de rankings globales
    const { count: globalCount } = await supabase
      .from('team_season_rankings')
      .select('*', { count: 'exact', head: true })
      .not('subupdate_4_global_rank', 'is', null)

    return {
      success: true,
      message: `Rankings históricos verificados. ${totalRecords} registros en ${uniqueSeasons.length} temporadas. ${globalCount || 0} con ranking global.`,
      details: {
        totalRecords,
        seasons: uniqueSeasons,
        recordsWithGlobalRank: globalCount || 0
      }
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Error en verificación: ${error.message}`
    }
  }
}

/**
 * Verificación completa de todas las optimizaciones
 */
export async function verifyAllOptimizations(): Promise<{
  positionChange: VerificationResult
  adminNotifications: VerificationResult
  historicalRankings: VerificationResult
  allSuccess: boolean
}> {
  const [positionChange, adminNotifications, historicalRankings] = await Promise.all([
    verifyPositionChangeColumns(),
    verifyAdminNotificationsTable(),
    verifyHistoricalRankings()
  ])

  return {
    positionChange,
    adminNotifications,
    historicalRankings,
    allSuccess: positionChange.success && adminNotifications.success && historicalRankings.success
  }
}



