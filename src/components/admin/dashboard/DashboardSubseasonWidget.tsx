import React from 'react'
import { Link } from 'react-router-dom'
import { Lock, Unlock, ArrowRight } from 'lucide-react'
import type { DashboardSubseasonStatus } from '@/types'

interface DashboardSubseasonWidgetProps {
  status?: DashboardSubseasonStatus
  isLoading?: boolean
}

const DashboardSubseasonWidget: React.FC<DashboardSubseasonWidgetProps> = ({
  status,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="card animate-pulse" aria-busy="true" aria-label="Cargando subtemporadas">
        <div className="mb-4 h-5 w-48 rounded bg-secondary-200" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-16 rounded-xl bg-secondary-200" />
          ))}
        </div>
      </div>
    )
  }

  if (!status) return null

  return (
    <section className="card" aria-labelledby="dashboard-subseason-heading">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3
            id="dashboard-subseason-heading"
            className="text-lg font-semibold text-content"
          >
            Subtemporadas
          </h3>
          <p className="text-sm text-content-muted">Temporada {status.season}</p>
        </div>
        <Link
          to="/admin/seasons"
          className="inline-flex items-center gap-1 rounded text-sm font-medium text-link transition-colors duration-200 hover:text-brand-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          Ver detalle
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
        role="list"
        aria-label="Estado de subtemporadas"
      >
        {status.chips.map((chip) => (
          <div
            key={chip.id}
            role="listitem"
            className={`flex flex-col gap-2 rounded-xl border p-3 ${
              chip.closed
                ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40'
                : 'border-line bg-surface-muted'
            }`}
          >
            <div className="flex items-center gap-2">
              {chip.closed ? (
                <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-300" aria-hidden />
              ) : (
                <Unlock className="h-4 w-4 text-content-subtle" aria-hidden />
              )}
              <span
                className={`badge text-xs ${chip.closed ? 'badge-success' : 'badge-secondary'}`}
              >
                {chip.closed ? 'Cerrada' : 'Abierta'}
              </span>
            </div>
            <p className="text-sm font-medium text-content">{chip.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default DashboardSubseasonWidget
