/**
 * Servicio agregador para el dashboard de administración.
 * Reutiliza servicios existentes y consultas ligeras a Supabase.
 */

import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from './supabaseService'
import { homePageService } from './homePageService'
import hybridRankingService from './hybridRankingService'
import subseasonAdminService, { type SubseasonId } from './subseasonAdminService'
import subseasonDetectionService from './subseasonDetectionService'
import rankingStateService from './rankingStateService'
import rankingService from './rankingService'
import { getYearFromSeason } from '@/utils/tournamentUtils'
import type {
  DashboardActionItem,
  DashboardActivityItem,
  DashboardHealth,
  DashboardStatChangeType,
  DashboardStats,
  DashboardSubseasonStatus,
} from '@/types'

const SUBSEASON_CHIP_LABELS: Record<SubseasonId, string> = {
  1: 'CE1 playa',
  2: 'CE2 playa',
  3: 'CE1 césped',
  4: 'CE2 césped',
}

function formatChangeLabel(delta: number): { change: string; changeType: DashboardStatChangeType } {
  if (delta > 0) return { change: `+${delta}`, changeType: 'positive' }
  if (delta < 0) return { change: `${delta}`, changeType: 'negative' }
  return { change: 'Sin cambios', changeType: 'neutral' }
}

function formatRankingStatFootnote(
  lastRankingRebuild: string | null,
  lastPointsUpdate: string | null
): string | undefined {
  if (!lastRankingRebuild || !lastPointsUpdate) return undefined
  const rebuildMs = new Date(lastRankingRebuild).getTime()
  const pointsMs = new Date(lastPointsUpdate).getTime()
  if (pointsMs <= rebuildMs + 60_000) return undefined
  try {
    const rebuildLabel = formatDistanceToNow(new Date(lastRankingRebuild), {
      addSuffix: true,
      locale: es,
    })
    return `Rankings reconstruidos ${rebuildLabel}`
  } catch {
    return 'Rankings pendientes de reconstruir'
  }
}

function formatLastUpdateLabel(isoDate: string | null): string {
  if (!isoDate) return 'Sin datos'
  try {
    return formatDistanceToNow(new Date(isoDate), { addSuffix: true, locale: es })
  } catch {
    return 'Sin datos'
  }
}

function getCalendarMonthRange(monthsAgo: number): { from: Date; to: Date } {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)
  const to = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1)
  return { from, to }
}

async function countInDateRange(
  table: 'teams' | 'tournaments',
  from: Date,
  to: Date,
  seasonYear?: number
): Promise<number> {
  if (!supabase) return 0

  let query = supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .gte('createdAt', from.toISOString())
    .lt('createdAt', to.toISOString())

  if (seasonYear !== undefined) {
    query = query.eq('year', seasonYear)
  }

  const { count, error } = await query

  if (error) {
    console.error(`Error contando ${table} en rango de fechas:`, error)
    return 0
  }

  return count ?? 0
}

async function getMonthlyDeltas(seasonYear: number): Promise<{ teamsChange: number; tournamentsChange: number }> {
  const thisMonth = getCalendarMonthRange(0)
  const lastMonth = getCalendarMonthRange(1)

  const [teamsThisMonth, teamsLastMonth, tournamentsThisMonth, tournamentsLastMonth] = await Promise.all([
    countInDateRange('teams', thisMonth.from, thisMonth.to),
    countInDateRange('teams', lastMonth.from, lastMonth.to),
    countInDateRange('tournaments', thisMonth.from, thisMonth.to, seasonYear),
    countInDateRange('tournaments', lastMonth.from, lastMonth.to, seasonYear),
  ])

  return {
    teamsChange: teamsThisMonth - teamsLastMonth,
    tournamentsChange: tournamentsThisMonth - tournamentsLastMonth,
  }
}

async function countTournamentsForSeason(seasonYear: number): Promise<number> {
  if (!supabase) return 0

  const { count, error } = await supabase
    .from('tournaments')
    .select('*', { count: 'exact', head: true })
    .eq('year', seasonYear)

  if (error) {
    console.error('Error contando torneos de la temporada:', error)
    return 0
  }

  return count ?? 0
}

export const dashboardService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const season = await hybridRankingService.getMostRecentSeason()
    const seasonYear = getYearFromSeason(season)

    const [mainStats, monitorData, tournamentsThisSeason, deltas] = await Promise.all([
      homePageService.getMainStats(),
      subseasonAdminService.getMonitorData(season),
      countTournamentsForSeason(seasonYear),
      getMonthlyDeltas(seasonYear),
    ])

    const teamsDelta = formatChangeLabel(deltas.teamsChange)
    const tournamentsDelta = formatChangeLabel(deltas.tournamentsChange)
    const lastRankingUpdateLabel = formatLastUpdateLabel(monitorData.lastUpdated)
    const rankingFootnote = formatRankingStatFootnote(
      monitorData.lastRankingRebuild,
      monitorData.lastPointsUpdate
    )

    return {
      totalTeams: mainStats.totalTeams,
      totalRegions: mainStats.totalRegions,
      totalTournamentsThisYear: tournamentsThisSeason,
      totalTournaments: mainStats.totalTournaments,
      currentSeason: season,
      lastRankingUpdate: monitorData.lastUpdated,
      lastRankingRebuild: monitorData.lastRankingRebuild,
      lastPointsUpdate: monitorData.lastPointsUpdate,
      teamsChange: deltas.teamsChange,
      tournamentsChange: deltas.tournamentsChange,
      items: [
        {
          name: 'Equipos registrados',
          value: mainStats.totalTeams,
          change: teamsDelta.change,
          changeType: teamsDelta.changeType,
          href: '/admin/teams',
        },
        {
          name: 'Regiones activas',
          value: mainStats.totalRegions,
          change: 'Sin cambios',
          changeType: 'neutral',
          href: '/admin/regions',
        },
        {
          name: 'Torneos este año',
          value: tournamentsThisSeason,
          change: tournamentsDelta.change,
          changeType: tournamentsDelta.changeType,
          href: '/admin/tournaments',
        },
        {
          name: 'Ranking actualizado',
          value: lastRankingUpdateLabel,
          change: season,
          changeType: 'neutral',
          href: '/admin/ranking',
          footnote: rankingFootnote,
        },
      ],
    }
  },

  async getRecentActivity(): Promise<DashboardActivityItem[]> {
    const [recentTeams, recentTournaments, notifications] = await Promise.all([
      supabase
        ? supabase
            .from('teams')
            .select('id, name, createdAt')
            .order('createdAt', { ascending: false })
            .limit(3)
        : Promise.resolve({ data: [], error: null }),
      homePageService.getCompletedTournaments(3),
      subseasonDetectionService.getPendingNotifications(),
    ])

    const teamItems: DashboardActivityItem[] = (recentTeams.data ?? []).map((team) => ({
      type: 'team',
      action: 'Nuevo equipo registrado',
      details: team.name,
      timestamp: team.createdAt,
      href: `/admin/teams/${team.id}/edit`,
    }))

    const tournamentItems: DashboardActivityItem[] = recentTournaments.map((tournament) => ({
      type: 'tournament',
      action: 'Torneo finalizado',
      details: tournament.name,
      timestamp: tournament.startDate,
      href: `/admin/tournaments/${tournament.id}`,
    }))

    const notificationItems: DashboardActivityItem[] = notifications.slice(0, 3).map((notification) => ({
      type: 'notification',
      action: notification.title,
      details: notification.message,
      timestamp: notification.created_at,
      href: notification.action_url || '/admin/seasons',
    }))

    return [...teamItems, ...tournamentItems, ...notificationItems]
      .filter((item) => item.timestamp)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6)
  },

  async getActionableItems(): Promise<DashboardActionItem[]> {
    const season = await hybridRankingService.getMostRecentSeason()
    const [notifications, monitorData, rankingState] = await Promise.all([
      subseasonDetectionService.getPendingNotifications(),
      subseasonAdminService.getMonitorData(season),
      rankingStateService.getRankingState(),
    ])

    const items: DashboardActionItem[] = []

    if (rankingState.isDirty) {
      items.push({
        title: 'Ranking desactualizado',
        description: rankingState.reason || 'Hay cambios en torneos que no se han reflejado en el ranking',
        href: '/admin/seasons',
        priority: 'high',
      })
    }

    notifications
      .filter((n) => n.type !== 'ranking_stale')
      .slice(0, 3)
      .forEach((notification) => {
      items.push({
        title: notification.title,
        description: notification.message,
        href: notification.action_url || '/admin/seasons',
        priority: 'high',
      })
    })

    const tournamentsWithoutResults = monitorData.flatTournaments.filter((t) => t.positionCount === 0)
    if (tournamentsWithoutResults.length > 0) {
      const first = tournamentsWithoutResults[0]
      items.push({
        title: 'Torneos sin resultados',
        description:
          tournamentsWithoutResults.length === 1
            ? `${first.name} no tiene posiciones registradas`
            : `${tournamentsWithoutResults.length} torneos sin posiciones registradas`,
        href: `/admin/tournaments/${first.id}`,
        priority: 'medium',
      })
    }

    if (!rankingState.isDirty && monitorData.lastRankingRebuild) {
      const daysSinceUpdate =
        (Date.now() - new Date(monitorData.lastRankingRebuild).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceUpdate > 7) {
        items.push({
          title: 'Actualizar ranking',
          description: `El ranking lleva ${Math.floor(daysSinceUpdate)} días sin reconstruirse`,
          href: '/admin/seasons',
          priority: 'medium',
        })
      }
    } else if (!rankingState.isDirty && monitorData.lastPointsUpdate) {
      items.push({
        title: 'Actualizar ranking',
        description: 'Hay puntos recalculados pero el ranking público no se ha reconstruido',
        href: '/admin/seasons',
        priority: 'high',
      })
    }

    return items
  },

  async getSystemHealth(): Promise<DashboardHealth> {
    const season = await hybridRankingService.getMostRecentSeason()
    const [monitorData, rankingStats, mainStats, dbCheck] = await Promise.all([
      subseasonAdminService.getMonitorData(season),
      rankingService.getRankingStats(),
      homePageService.getMainStats(),
      supabase
        ? supabase.from('teams').select('id').limit(1)
        : Promise.resolve({ error: { message: 'Supabase no configurado' } }),
    ])

    return {
      dbConnected: !dbCheck.error,
      lastRankingUpdate: monitorData.lastUpdated,
      lastRankingRebuild: monitorData.lastRankingRebuild,
      lastPointsUpdate: monitorData.lastPointsUpdate,
      currentSeason: season,
      teamsWithRanking: rankingStats.teams_with_points ?? 0,
      totalTeamsInRanking: mainStats.totalTeams ?? 0,
    }
  },

  async getSubseasonStatus(): Promise<DashboardSubseasonStatus> {
    const season = await hybridRankingService.getMostRecentSeason()
    const monitorData = await subseasonAdminService.getMonitorData(season)

    const chips = ([1, 2, 3, 4] as SubseasonId[]).map((id) => ({
      id,
      label: SUBSEASON_CHIP_LABELS[id],
      closed: monitorData.subseasonClosed[id],
    }))

    return { season, chips }
  },
}

export default dashboardService
