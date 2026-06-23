import React, { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { formatInteger, formatPoints } from '@/utils/rankingCalculations'

export interface HeroStatItem {
  icon: LucideIcon
  label: string
  value: ReactNode
}

interface PageHeroStatsBarProps {
  items: HeroStatItem[]
  isLoading?: boolean
  className?: string
}

/** Formatea números para la barra de stats (millares con punto, decimales con coma). */
export const formatStatDisplayValue = (value: ReactNode): ReactNode => {
  if (typeof value === 'number') {
    const hasDecimals = Math.abs(value % 1) > 1e-9
    return hasDecimals ? formatPoints(value, 1) : formatInteger(value)
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (/^-?\d+$/.test(trimmed)) return formatInteger(Number(trimmed))
    if (/^-?\d+\.\d+$/.test(trimmed)) return formatPoints(Number(trimmed), 1)
  }
  return value
}

const PageHeroStatsBar: React.FC<PageHeroStatsBarProps> = ({
  items,
  isLoading = false,
  className = '',
}) => {
  return (
    <div
      className={`hero-stats-bar ${className}`.trim()}
      role="list"
      aria-label="Estadísticas"
    >
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.label} role="listitem" className="hero-stats-bar__item">
            <div className="hero-stats-bar__icon-wrap">
              <Icon className="hero-stats-bar__icon" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              {isLoading ? (
                <div className="space-y-1.5">
                  <div className="hero-stats-bar__skeleton-value" />
                  <div className="hero-stats-bar__skeleton-label" />
                </div>
              ) : (
                <>
                  <p className="hero-stats-bar__value">{formatStatDisplayValue(item.value)}</p>
                  <p className="hero-stats-bar__label">{item.label}</p>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default PageHeroStatsBar
