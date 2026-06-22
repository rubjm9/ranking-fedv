import React from 'react'
import TeamLogo from '@/components/ui/TeamLogo'

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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-4 py-3 bg-slate-900 flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">{title}</h3>
        {getCategoryBadge(category)}
      </div>
      <div className="data-table-wrapper">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-secondary-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Pos</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Cambio</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Equipo</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Pts</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {dataWithChanges.map((team, index) => (
              <tr key={team.team_id} className="hover:bg-secondary-50">
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center">{getRankIcon(index + 1)}</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center">
                    {getChangeIcon(team.change)}
                    <span
                      className={`ml-1 text-sm font-medium ${
                        team.change > 0
                          ? 'text-green-600'
                          : team.change < 0
                            ? 'text-red-600'
                            : 'text-slate-500'
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
                      <div className="text-sm font-medium text-slate-900">{team.team_name}</div>
                      <div className="text-xs text-slate-500">{team.region_name || 'N/A'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="text-sm font-medium text-slate-900">
                    {team.total_points?.toFixed(1) || '0.0'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-secondary-50 border-t border-slate-200">
        <button
          type="button"
          onClick={() => onViewFull(category)}
          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
        >
          Ver ranking completo →
        </button>
      </div>
    </div>
  )
}

export default SummaryCard
