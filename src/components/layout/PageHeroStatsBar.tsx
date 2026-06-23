import React, { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

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
                  <p className="hero-stats-bar__value">{item.value}</p>
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
