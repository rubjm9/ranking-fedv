/**
 * Utilidad para verificar que las optimizaciones se aplicaron correctamente
 */

import { supabase } from '@/services/supabaseService'

export interface VerificationResult {
  success: boolean
  message: string
  details?: Record<string, unknown>
}

/**
 * Verificar que las columnas de position_change existen y tienen datos
 */
export async function verifyPositionChangeColumns(): Promise<VerificationResult> {
  try {
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase no está configurado',
      }
    }

    const { error: columnsError } = await supabase
      .from('team_season_rankings')
      .select(
        'beach_mixed_position_change, beach_mixed_points_change, subupdate_4_global_position_change, subupdate_4_global_rank'
      )
      .limit(1)

    if (columnsError) {
      return {
        success: false,
        message: `Error verificando columnas: ${columnsError.message}`,
      }
    }

    const { data: surfaceChanges, error: surfaceError } = await supabase
      .from('team_season_rankings')
      .select('team_id, season, beach_mixed_position_change')
      .not('beach_mixed_position_change', 'is', null)
      .limit(10)

    if (surfaceError) {
      return {
        success: false,
        message: `Error verificando datos de categoría: ${surfaceError.message}`,
      }
    }

    const { data: globalRanks, error: globalRankError } = await supabase
      .from('team_season_rankings')
      .select('team_id, season, subupdate_4_global_rank, subupdate_4_global_position_change')
      .not('subupdate_4_global_rank', 'is', null)
      .limit(10)

    if (globalRankError) {
      return {
        success: false,
        message: `Error verificando rankings globales: ${globalRankError.message}`,
      }
    }

    const { count: subupdate1Count } = await supabase
      .from('team_season_rankings')
      .select('*', { count: 'exact', head: true })
      .not('subupdate_1_global_rank', 'is', null)

    const { count: totalCount } = await supabase
      .from('team_season_rankings')
      .select('*', { count: 'exact', head: true })

    const surfaceWithData = surfaceChanges?.length || 0
    const globalWithData = globalRanks?.length || 0
    const hasGlobalSnapshots = (subupdate1Count || 0) > 0

    return {
      success: hasGlobalSnapshots && surfaceWithData > 0,
      message: hasGlobalSnapshots
        ? `Columnas verificadas: ${surfaceWithData} muestras de categoría, ${globalWithData} de ranking global (subupdate 4), ${subupdate1Count || 0} con subupdate 1 de ${totalCount || 0} totales.`
        : `Columnas de categoría OK (${surfaceWithData} muestras), pero faltan snapshots globales subupdate_* — ejecuta actualización inteligente.`,
      details: {
        columnsExist: true,
        recordsWithSurfaceChange: surfaceWithData,
        recordsWithGlobalRank: globalWithData,
        recordsWithSubupdate1: subupdate1Count || 0,
        totalRecords: totalCount || 0,
        sampleSurface: surfaceChanges?.slice(0, 2),
        sampleGlobal: globalRanks?.slice(0, 2),
      },
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return {
      success: false,
      message: `Error en verificación: ${message}`,
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
        message: 'Supabase no está configurado',
      }
    }

    const { error } = await supabase
      .from('admin_notifications')
      .select('id, type, status')
      .limit(1)

    if (error) {
      return {
        success: false,
        message: `Error verificando tabla admin_notifications: ${error.message}`,
      }
    }

    const { count: pendingCount } = await supabase
      .from('admin_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    return {
      success: true,
      message: `Tabla admin_notifications verificada. ${pendingCount || 0} notificaciones pendientes.`,
      details: {
        tableExists: true,
        pendingNotifications: pendingCount || 0,
      },
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return {
      success: false,
      message: `Error en verificación: ${message}`,
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
        message: 'Supabase no está configurado',
      }
    }

    const { data: seasonsData, error: seasonsError } = await supabase
      .from('team_season_rankings')
      .select('season')
      .order('season', { ascending: false })

    if (seasonsError) {
      return {
        success: false,
        message: `Error obteniendo temporadas: ${seasonsError.message}`,
      }
    }

    const uniqueSeasons = [...new Set(seasonsData?.map((s) => s.season) || [])]
    const totalRecords = seasonsData?.length || 0

    const subupdateCounts = await Promise.all(
      ([1, 2, 3, 4] as const).map(async (n) => {
        const { count } = await supabase
          .from('team_season_rankings')
          .select('*', { count: 'exact', head: true })
          .not(`subupdate_${n}_global_rank`, 'is', null)
        return { subupdate: n, count: count || 0 }
      })
    )

    const globalCount = subupdateCounts.find((s) => s.subupdate === 4)?.count || 0

    return {
      success: globalCount > 0,
      message: `Rankings históricos: ${totalRecords} registros en ${uniqueSeasons.length} temporadas. Snapshots globales: ${subupdateCounts.map((s) => `sub${s.subupdate}=${s.count}`).join(', ')}.`,
      details: {
        totalRecords,
        seasons: uniqueSeasons,
        subupdateCounts,
        recordsWithGlobalRank: globalCount,
      },
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return {
      success: false,
      message: `Error en verificación: ${message}`,
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
    verifyHistoricalRankings(),
  ])

  return {
    positionChange,
    adminNotifications,
    historicalRankings,
    allSuccess: positionChange.success && adminNotifications.success && historicalRankings.success,
  }
}
