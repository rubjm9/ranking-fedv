import React from 'react'
import { Link } from 'react-router-dom'
import { UsersRound, Calendar, TrendingUp, Bell, Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { DashboardActivityItem } from '@/types'

interface DashboardActivityFeedProps {
  items: DashboardActivityItem[]
  isLoading?: boolean
}

function getActivityIcon(type: DashboardActivityItem['type']) {
  switch (type) {
    case 'team':
      return <UsersRound className="h-4 w-4" />
    case 'tournament':
      return <Calendar className="h-4 w-4" />
    case 'ranking':
      return <TrendingUp className="h-4 w-4" />
    case 'notification':
      return <Bell className="h-4 w-4" />
    default:
      return <Activity className="h-4 w-4" />
  }
}

function formatActivityTime(timestamp: string): string {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: es })
  } catch {
    return ''
  }
}

const DashboardActivityFeed: React.FC<DashboardActivityFeedProps> = ({ items, isLoading = false }) => {
  if (isLoading) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-content mb-4">Actividad reciente</h2>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 p-3 bg-surface rounded-lg border border-line animate-pulse"
            >
              <div className="w-8 h-8 bg-line rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-line rounded w-3/4" />
                <div className="h-3 bg-surface-muted rounded w-full" />
                <div className="h-3 bg-surface-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-content mb-4">Actividad reciente</h2>
        <p className="text-sm text-content-muted p-4 bg-surface rounded-lg border border-line">
          No hay actividad reciente registrada.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-content mb-4">Actividad reciente</h2>
      <div className="space-y-4">
        {items.map((activity, index) => (
          <Link
            key={`${activity.type}-${activity.timestamp}-${index}`}
            to={activity.href}
            className="flex items-start space-x-3 p-3 bg-surface rounded-lg border border-line hover:border-brand-strong/30 hover:bg-brand-subtle/30 transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            <div className="w-8 h-8 bg-surface-muted rounded-full flex items-center justify-center flex-shrink-0 text-content-muted">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-content">{activity.action}</p>
              <p className="text-sm text-content-muted truncate">{activity.details}</p>
              <p className="text-xs text-content-subtle">{formatActivityTime(activity.timestamp)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default DashboardActivityFeed
