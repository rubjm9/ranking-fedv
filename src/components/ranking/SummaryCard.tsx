import React from 'react'
import TeamLogo from '@/components/ui/TeamLogo'
import RankingTeamLink from '@/components/ranking/RankingTeamLink'

const getCategoryBadge = (category: string) => {
  if (category.includes('beach')) {
    return (
      <span className="text-xs font-medium text-accent-300 bg-accent-900/40 px-2 py-0.5 rounded-full">
        BEACH
      </span>
    )
  }
  if (category.includes('grass')) {
    return (
      <span className="text-xs font-medium text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded-full">
        GRASS
      </span>
    )
  }
  return null
}

export const getCategoryShortName = (category: string) => {
  const names: Record<string, string> = {
    beach_mixed: 'Playa Mixto',
    beach_women: 'Playa Women',
    beach_open: 'Playa Open',
    grass_mixed: 'Césped Mixto',
    grass_women: 'Césped Women',
    grass_open: 'Césped Open',
  }
  return names[category] || category
}

interface SummaryCardProps {
  title: string
  data: any[]
  category: string
  onViewFull: (category: string) => void
  getRankIcon: (position: number) => React.ReactNode
  getChangeIcon: (change: number) => React.ReactNode
  getChangeText: (change: number) => string
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  data,
  category,
  onViewFull,
  getRankIcon,
  getChangeIcon,
  getChangeText,
}) => {
  const top5 = data?.slice(0, 5) || []

  const dataWithChanges = top5.map((team, index) => {
    const currentPosition = index + 1
    const change =
      team.position_change !== undefined
        ? team.position_change
        : team.ranking_position
          ? team.ranking_position - currentPosition
          : 0
    return { ...team, change }
  })

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-line overflow-hidden">
      <div className="px-4 py-3 bg-slate-900 flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">{title}</h3>
        {getCategoryBadge(category)}
      </div>
      <div className="data-table-wrapper">
        <table className="min-w-full divide-y divide-line">
          <thead className="bg-surface-muted">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-content-subtle uppercase">Pos</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-content-subtle uppercase">Cambio</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-content-subtle uppercase">Equipo</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-content-subtle uppercase">Pts</th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-line">
            {dataWithChanges.map((team, index) => (
              <tr key={team.team_id} className="hover:bg-surface-muted">
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center">{getRankIcon(index + 1)}</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center">
                    {getChangeIcon(team.change)}
                    <span
                      className={`ml-1 text-sm font-medium ${
                        team.change > 0
                          ? 'text-green-600 dark:text-green-300'
                          : team.change < 0
                            ? 'text-red-600 dark:text-red-300'
                            : 'text-content-subtle'
                      }`}
                    >
                      {getChangeText(team.change)}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center">
                    <TeamLogo name={team.team_name} logo={team.logo} size="sm" />
                    <div className="ml-2">
                      <RankingTeamLink
                        team={team}
                        className="text-sm font-medium text-content hover:text-link transition-colors"
                      >
                        {team.team_name}
                      </RankingTeamLink>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="text-sm font-medium text-content">
                    {team.total_points?.toFixed(1) || '0.0'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 bg-surface-muted border-t border-line">
        <button
          type="button"
          onClick={() => onViewFull(category)}
          className="inline-flex items-center min-h-[44px] touch-manipulation text-xs text-link hover:text-brand-strong font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          Ver ranking completo →
        </button>
      </div>
    </div>
  )
}

export default SummaryCard
