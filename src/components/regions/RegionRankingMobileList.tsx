import React from 'react'
import { Link } from 'react-router-dom'
import TeamLogo from '@/components/ui/TeamLogo'
import { formatPoints } from '@/utils/rankingCalculations'

/** Mismos colores que la posición en la tabla: podio, top 8, resto. */
export const PositionBadge: React.FC<{ position: number | null; className?: string }> = ({
  position,
  className = '',
}) =>
  position === null ? (
    <span className={`text-content-subtle ${className}`} aria-label="Sin posición">—</span>
  ) : (
    <span
      className={`font-bold ${
        position <= 3 ? 'text-amber-600 dark:text-amber-300' : position <= 8 ? 'text-link' : 'text-content-muted'
      } ${className}`}
    >
      #{position}
    </span>
  )

export interface RegionRankingMobileRow {
  id: string
  name: string
  logo?: string | null
  href: string
  regionPosition: number | null
  nationalPosition: number | null
  points: number
}

interface RegionRankingMobileListProps {
  rows: RegionRankingMobileRow[]
  /** Nombre accesible de la lista, el mismo que el caption de la tabla. */
  label: string
  /** Rótulo de la columna de puntos, p. ej. «Puntos 2026-27». */
  pointsLabel: string
}

/**
 * Versión móvil del ranking regional.
 *
 * La tabla mide unos 950px y en 375px solo dejaba ver las dos columnas de
 * posición: nombre y puntos quedaban fuera y había que desplazarse en
 * horizontal para leer cada fila. Aquí cabe lo esencial en una sola línea:
 * la posición en la región, que es el número del seeding, en grande; el
 * equipo con su posición nacional debajo, y los puntos.
 */
const RegionRankingMobileList: React.FC<RegionRankingMobileListProps> = ({ rows, label, pointsLabel }) => (
  <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
    <div className="flex items-center justify-between bg-secondary-900 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white">
      <span>Pos. región · Equipo</span>
      <span>{pointsLabel}</span>
    </div>
    <ol aria-label={label} className="divide-y divide-line">
      {rows.map(row => (
        <li key={row.id}>
          <Link
            to={row.href}
            className="flex min-h-[56px] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-muted focus:outline-none focus-visible:bg-surface-muted"
          >
            <PositionBadge position={row.regionPosition} className="w-9 shrink-0 text-lg" />
            <TeamLogo name={row.name} logo={row.logo} size="sm" />
            <span className="min-w-0 flex-1">
              {/* Dos líneas, no truncate: cortar con puntos suspensivos se comía
                  justo la «B» que distingue a un filial. */}
              <span className="block line-clamp-2 font-medium leading-snug text-content">{row.name}</span>
              <span className="block text-xs text-content-subtle">
                {row.nationalPosition === null ? 'Sin posición nacional' : `#${row.nationalPosition} nacional`}
              </span>
            </span>
            <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-content">
              {formatPoints(row.points, 1)}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  </div>
)

export default RegionRankingMobileList
