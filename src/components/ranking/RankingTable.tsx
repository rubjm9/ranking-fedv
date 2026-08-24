import React from 'react'
import TeamLogo from '@/components/ui/TeamLogo'
import RankingTeamLink from '@/components/ranking/RankingTeamLink'
import PointsBreakdown from '@/components/ranking/PointsBreakdown'
import RankingCardList from '@/components/ranking/RankingCardList'
import type { ViewMode } from '@/hooks/useViewMode'

interface RankingTableProps {
  teams: any[]
  seasons: string[]
  coefficients: number[]
  getSeasonPoints: (team: any, season: string) => number
  getRankIcon: (position: number) => React.ReactNode
  getChangeIcon: (change: number) => React.ReactNode
  getChangeText: (change: number) => string
  rankingType: 'current' | 'historical' | 'clubs'
  viewMode: ViewMode
  /** Modalidades que suma cada celda, para el desglose por torneo. */
  modalities: string[]
}

const formatSeason = (season: string) => {
  const [from, to] = season.split('-')
  return `${from}/${to}`
}

/**
 * Tabla del ranking, compartida por la vista global y las de modalidad.
 *
 * Antes había dos copias casi idénticas, y por eso el conmutador de vista solo
 * existía en una de ellas.
 */
const RankingTable: React.FC<RankingTableProps> = ({
  teams,
  seasons,
  coefficients,
  getSeasonPoints,
  getRankIcon,
  getChangeIcon,
  getChangeText,
  rankingType,
  viewMode,
  modalities,
}) => {
  if (viewMode === 'cards') {
    return (
      <RankingCardList
        teams={teams}
        seasons={seasons}
        getSeasonPoints={getSeasonPoints}
        getRankIcon={getRankIcon}
        getChangeIcon={getChangeIcon}
        getChangeText={getChangeText}
        showCoefficients={rankingType !== 'historical'}
        showTeamsCount={rankingType === 'clubs'}
        modalities={modalities}
      />
    )
  }

  return (
    <div className="data-table-wrapper">
      <table className="ranking-table-sticky w-full">
        <thead className="bg-surface-muted">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-content-subtle uppercase tracking-wider">
              Posición
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-content-subtle uppercase tracking-wider">
              Cambio
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-content-subtle uppercase tracking-wider">
              Equipo
            </th>
            {seasons.map((season, index) => (
              <th
                key={season}
                className="px-4 py-3 text-right text-xs font-medium text-content-subtle uppercase tracking-wider"
              >
                <div className="flex flex-col">
                  <span>{formatSeason(season)}</span>
                  {rankingType !== 'historical' && (
                    <span className="text-xs text-content-subtle font-normal">
                      {coefficients[index] ?? 0}
                    </span>
                  )}
                </div>
              </th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-medium text-content-subtle uppercase tracking-wider">
              Pts
            </th>
          </tr>
        </thead>
        <tbody className="bg-surface divide-y divide-line">
          {teams.map((team, index) => {
            const filaPar = index % 2 === 1
            const cambio = team.position_change || 0
            return (
              <tr
                key={team.team_id}
                className={`hover:bg-surface-muted ${filaPar ? 'bg-surface-muted' : 'bg-surface'}`}
              >
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-content">
                  <div className="flex items-center">{getRankIcon(index + 1)}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getChangeIcon(cambio)}
                    <span
                      className={`ml-1 text-sm font-medium ${
                        cambio > 0
                          ? 'text-green-600 dark:text-green-300'
                          : cambio < 0
                            ? 'text-red-600 dark:text-red-300'
                            : 'text-content-subtle'
                      }`}
                    >
                      {getChangeText(cambio)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <TeamLogo name={team.team_name} logo={team.logo} size="sm" />
                    <div className="ml-3">
                      <RankingTeamLink
                        team={team}
                        className="text-sm font-medium text-content hover:text-link transition-colors"
                      >
                        {team.team_name}
                      </RankingTeamLink>
                      {team.region_name && (
                        <div className="text-xs text-content-subtle">{team.region_name}</div>
                      )}
                      {rankingType === 'clubs' && team.teams_count > 1 && (
                        <div className="text-xs text-link">{team.teams_count} equipos</div>
                      )}
                    </div>
                  </div>
                </td>
                {seasons.map((season) => (
                  <td
                    key={season}
                    className="px-4 py-4 whitespace-nowrap text-sm text-content text-right"
                  >
                    <PointsBreakdown
                      teamId={team.team_id}
                      teamName={team.team_name}
                      season={season}
                      modalities={modalities}
                      regionId={team.region_id}
                      value={getSeasonPoints(team, season) || 0}
                    />
                  </td>
                ))}
                <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-content text-right tabular-nums">
                  {(team.total_points || 0).toFixed(2)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default RankingTable
