/**
 * Estado global del pipeline de ranking (cambios sin reflejar).
 */

import { supabase } from './supabaseService'
import subseasonAdminService from './subseasonAdminService'
import hybridRankingService from './hybridRankingService'

const GLOBAL_ID = 'global'
const STALE_FINGERPRINT = 'ranking_stale_global_null_null'
const HUB_URL = '/admin/seasons'

export interface RankingState {
  isDirty: boolean
  dirtySince: string | null
  lastRebuildAt: string | null
  reason: string | null
  affectsCoefficients: boolean
}

const DEFAULT_STATE: RankingState = {
  isDirty: false,
  dirtySince: null,
  lastRebuildAt: null,
  reason: null,
  affectsCoefficients: false,
}

function buildStaleMessage(reason: string, affectsCoefficients: boolean): string {
  const base =
    reason ||
    'Hay cambios en torneos o resultados que aún no se han reflejado en el ranking público.'
  if (affectsCoefficients) {
    return (
      `${base} Si afectan a campeonatos de España (CE1/CE2), también conviene recalcular los coeficientes regionales antes de publicar el ranking.`
    )
  }
  return base
}

const rankingStateService = {
  /**
   * Heurística de respaldo: puntos recalculados después del último rebuild público.
   */
  async detectStaleFromTimestamps(): Promise<RankingState | null> {
    if (!supabase) return null

    try {
      const season = await hybridRankingService.getMostRecentSeason()
      const monitor = await subseasonAdminService.getMonitorData(season)

      const lastRebuild = monitor.lastRankingRebuild
      const lastPoints = monitor.lastPointsUpdate

      if (!lastPoints) return null
      if (!lastRebuild) {
        return {
          isDirty: true,
          dirtySince: lastPoints,
          lastRebuildAt: null,
          reason:
            'Hay puntos recalculados pero el ranking público no se ha reconstruido. Ejecuta la actualización inteligente.',
          affectsCoefficients: false,
        }
      }

      if (new Date(lastPoints).getTime() > new Date(lastRebuild).getTime() + 60_000) {
        return {
          isDirty: true,
          dirtySince: lastPoints,
          lastRebuildAt: lastRebuild,
          reason:
            'Los puntos por temporada son más recientes que el último ranking reconstruido. Ejecuta la actualización inteligente.',
          affectsCoefficients: false,
        }
      }
    } catch (error) {
      console.warn('Heurística de ranking desactualizado no disponible:', error)
    }

    return null
  },

  async getRankingState(): Promise<RankingState> {
    if (!supabase) return DEFAULT_STATE

    try {
      const { data, error } = await supabase
        .from('ranking_state')
        .select('dirty_since, last_rebuild_at, reason, affects_coefficients')
        .eq('id', GLOBAL_ID)
        .maybeSingle()

      if (error) {
        console.warn('ranking_state no disponible, usando notificaciones:', error.message)
        const fromNotification = await rankingStateService.getRankingStateFromNotification()
        if (fromNotification.isDirty) return fromNotification
        return (await rankingStateService.detectStaleFromTimestamps()) ?? DEFAULT_STATE
      }

      if (data?.dirty_since) {
        return {
          isDirty: true,
          dirtySince: data.dirty_since,
          lastRebuildAt: data.last_rebuild_at,
          reason: data.reason,
          affectsCoefficients: data.affects_coefficients ?? false,
        }
      }

      const fromNotification = await rankingStateService.getRankingStateFromNotification()
      if (fromNotification.isDirty) return fromNotification

      return (await rankingStateService.detectStaleFromTimestamps()) ?? {
        isDirty: false,
        dirtySince: null,
        lastRebuildAt: data?.last_rebuild_at ?? null,
        reason: null,
        affectsCoefficients: false,
      }
    } catch {
      const fromNotification = await rankingStateService.getRankingStateFromNotification()
      if (fromNotification.isDirty) return fromNotification
      return (await rankingStateService.detectStaleFromTimestamps()) ?? DEFAULT_STATE
    }
  },

  async getRankingStateFromNotification(): Promise<RankingState> {
    if (!supabase) return DEFAULT_STATE

    const { data } = await supabase
      .from('admin_notifications')
      .select('created_at, message, metadata')
      .eq('fingerprint', STALE_FINGERPRINT)
      .eq('status', 'pending')
      .maybeSingle()

    if (!data) return DEFAULT_STATE

    const metadata = (data.metadata as { affects_coefficients?: boolean }) || {}

    return {
      isDirty: true,
      dirtySince: data.created_at,
      lastRebuildAt: null,
      reason: data.message,
      affectsCoefficients: metadata.affects_coefficients ?? false,
    }
  },

  async markRankingDirty(
    reason: string,
    options?: { affectsCoefficients?: boolean }
  ): Promise<void> {
    if (!supabase) return

    const affectsCoefficients = options?.affectsCoefficients ?? false
    const now = new Date().toISOString()
    const message = buildStaleMessage(reason, affectsCoefficients)

    await supabase.from('ranking_state').upsert({
      id: GLOBAL_ID,
      dirty_since: now,
      reason: message,
      affects_coefficients: affectsCoefficients,
      updated_at: now,
    })

    const { data: existing } = await supabase
      .from('admin_notifications')
      .select('id')
      .eq('fingerprint', STALE_FINGERPRINT)
      .maybeSingle()

    const payload = {
      type: 'ranking_stale',
      title: 'Ranking desactualizado',
      message,
      status: 'pending',
      action_url: HUB_URL,
      action_label: 'Actualizar ahora',
      fingerprint: STALE_FINGERPRINT,
      metadata: { affects_coefficients: affectsCoefficients, reason },
      read_at: null,
      resolved_at: null,
    }

    if (existing?.id) {
      await supabase.from('admin_notifications').update(payload).eq('id', existing.id)
    } else {
      await supabase.from('admin_notifications').insert(payload)
    }
  },

  async markRankingClean(): Promise<void> {
    if (!supabase) return

    const now = new Date().toISOString()

    await supabase.from('ranking_state').upsert({
      id: GLOBAL_ID,
      dirty_since: null,
      last_rebuild_at: now,
      reason: null,
      affects_coefficients: false,
      updated_at: now,
    })

    await supabase
      .from('admin_notifications')
      .update({
        status: 'resolved',
        resolved_at: now,
      })
      .eq('fingerprint', STALE_FINGERPRINT)
      .eq('status', 'pending')
  },
}

/** Atajo para llamar tras mutaciones que afectan al ranking */
export async function markRankingDirtyAfterEdit(
  reason: string,
  options?: { affectsCoefficients?: boolean }
): Promise<void> {
  try {
    await rankingStateService.markRankingDirty(reason, options)
  } catch (error) {
    console.warn('No se pudo marcar ranking como desactualizado:', error)
  }
}

export default rankingStateService
