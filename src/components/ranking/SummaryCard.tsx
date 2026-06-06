import React from 'react'
import { Sun, Leaf, Trophy } from 'lucide-react'
import TeamLogo from '@/components/ui/TeamLogo'

export const getCategoryHeaderColor = (category: string) => {
  const colors: Record<string, string> = {
    beach_mixed: 'from-yellow-500 to-yellow-600',
    beach_women: 'from-amber-500 to-amber-600',
    beach_open: 'from-orange-500 to-orange-600',
    grass_mixed: 'from-green-500 to-green-600',
    grass_women: 'from-emerald-500 to-emerald-600',
    grass_open: 'from-teal-500 to-teal-600',
  }
  return colors[category] || 'from-slate-500 to-slate-600'
}

export const getCategoryIcon = (category: string) => {
  if (category.includes('beach')) return <Sun className="w-4 h-4 inline text-white" />
  if (category.includes('grass')) return <Leaf className="w-4 h-4 inline text-white" />
  return <Trophy className="w-4 h-4 inline text-white" />
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
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className={`px-4 py-3 bg-gradient-to-r ${getCategoryHeaderColor(category)}`}>
        <h3 className="text-white font-semibold text-sm flex items-center gap-1.5">
          {getCategoryIcon(category)} {getCategoryShortName(category)}
        </h3>
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
