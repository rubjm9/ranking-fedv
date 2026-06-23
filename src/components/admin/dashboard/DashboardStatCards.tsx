import React from 'react'
import { Link } from 'react-router-dom'
import { UsersRound, MapPin, Calendar, TrendingUp } from 'lucide-react'
import { formatStatDisplayValue } from '@/components/layout/PageHeroStatsBar'
import type { DashboardStatItem } from '@/types'

const statIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Equipos registrados': UsersRound,
  'Regiones activas': MapPin,
  'Torneos este año': Calendar,
  'Ranking actualizado': TrendingUp,
}

const changeTypeClass: Record<DashboardStatItem['changeType'], string> = {
  positive: 'text-emerald-600',
  negative: 'text-red-600',
  neutral: 'text-secondary-500',
}

interface DashboardStatCardsProps {
  items: DashboardStatItem[]
  isLoading?: boolean
}

const DashboardStatCards: React.FC<DashboardStatCardsProps> = ({ items, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-secondary-200 rounded w-2/3" />
                <div className="h-8 bg-secondary-200 rounded w-1/2" />
                <div className="h-3 bg-secondary-100 rounded w-3/4" />
              </div>
              <div className="w-12 h-12 bg-secondary-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((stat) => {
        const Icon = statIcons[stat.name] ?? TrendingUp
        return (
          <Link
            key={stat.name}
            to={stat.href}
            className="card-hover"
            aria-label={`${stat.name}: ${stat.value}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">{stat.name}</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {formatStatDisplayValue(stat.value)}
                </p>
                {stat.change && (
                  <p className={`text-sm ${changeTypeClass[stat.changeType]}`}>
                    {stat.name === 'Ranking actualizado'
                      ? `Temporada ${stat.change}`
                      : stat.changeType === 'neutral'
                        ? stat.change
                        : `${stat.change} este mes`}
                  </p>
                )}
                {stat.footnote && (
                  <p className="text-xs text-amber-700 mt-0.5">{stat.footnote}</p>
                )}
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Icon className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export default DashboardStatCards
