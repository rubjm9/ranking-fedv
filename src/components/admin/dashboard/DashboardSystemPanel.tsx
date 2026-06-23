import React from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Target, CheckCircle2 } from 'lucide-react'
import type { DashboardActionItem, DashboardHealth } from '@/types'

interface DashboardSystemPanelProps {
  health?: DashboardHealth
  actions: DashboardActionItem[]
  isLoading?: boolean
}

function formatLastUpdate(isoDate: string | null): string {
  if (!isoDate) return 'Sin datos'
  try {
    return formatDistanceToNow(new Date(isoDate), { addSuffix: true, locale: es })
  } catch {
    return 'Sin datos'
  }
}

const DashboardSystemPanel: React.FC<DashboardSystemPanelProps> = ({
  health,
  actions,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="card animate-pulse space-y-3">
            <div className="h-6 bg-secondary-200 rounded w-1/2" />
            {Array.from({ length: 4 }).map((__, row) => (
              <div key={row} className="flex justify-between">
                <div className="h-4 bg-secondary-100 rounded w-1/3" />
                <div className="h-4 bg-secondary-200 rounded w-1/4" />
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Estado del sistema</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary-600">Base de datos</span>
            <span className={health?.dbConnected ? 'badge-success' : 'badge-error'}>
              {health?.dbConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary-600">Temporada activa</span>
            <span className="text-sm font-medium text-secondary-900">{health?.currentSeason ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary-600">Última actividad de ranking</span>
            <span className="text-sm text-secondary-900">
              {formatLastUpdate(health?.lastRankingUpdate ?? null)}
            </span>
          </div>
          {health?.lastRankingRebuild &&
            health?.lastPointsUpdate &&
            new Date(health.lastPointsUpdate).getTime() >
              new Date(health.lastRankingRebuild).getTime() + 60_000 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">Rankings reconstruidos</span>
                <span className="text-sm text-amber-700">
                  {formatLastUpdate(health.lastRankingRebuild)}
                </span>
              </div>
            )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary-600">Equipos con puntos en ranking</span>
            <span className="text-sm text-secondary-900">
              {health?.teamsWithRanking ?? 0} de {health?.totalTeamsInRanking ?? 0} registrados
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Próximas acciones</h3>
        {actions.length === 0 ? (
          <div className="flex items-center space-x-3 text-emerald-700">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">Todo al día</p>
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((action) => (
              <Link
                key={`${action.title}-${action.href}`}
                to={action.href}
                className="flex items-start space-x-3 rounded-lg p-2 -mx-2 hover:bg-primary-50/50 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <Target
                  className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                    action.priority === 'high'
                      ? 'text-red-500'
                      : action.priority === 'medium'
                        ? 'text-accent-600'
                        : 'text-primary-500'
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-secondary-900">{action.title}</p>
                  <p className="text-xs text-secondary-600">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardSystemPanel
