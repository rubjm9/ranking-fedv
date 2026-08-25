import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import TeamLogo from '@/components/ui/TeamLogo'
import RankingTeamLink from '@/components/ranking/RankingTeamLink'
import PointsBreakdown from '@/components/ranking/PointsBreakdown'
import TotalBreakdown from '@/components/ranking/TotalBreakdown'
import { cn } from '@/utils/cn'

interface RankingCardListProps {
  teams: any[]
  seasons: string[]
  /** Puntos de un equipo en una temporada concreta. */
  getSeasonPoints: (team: any, season: string) => number
  getRankIcon: (position: number) => React.ReactNode
  getChangeIcon: (change: number) => React.ReactNode
  getChangeText: (change: number) => string
  /** En histórico no se muestran los coeficientes por temporada. */
  showCoefficients?: boolean
  showTeamsCount?: boolean
  /** Modalidades que suma cada temporada, para el desglose por torneo. */
  modalities?: string[]
  /** Pesos por antigüedad, para explicar el total. */
  coefficients?: number[]
  /** En el ranking histórico no se pondera por antigüedad. */
  weighted?: boolean
}

const COEFFICIENTS = [1.0, 0.8, 0.5, 0.2]

const formatSeason = (season: string) => {
  const [from, to] = season.split('-')
  return `${from}/${to}`
}

/**
 * Vista de tarjetas del ranking para móvil.
 *
 * La tabla equivalente tiene 8 columnas y 807px de ancho: dentro de un viewport
 * de 390px dejaba los puntos fuera de pantalla y, al desplazarse en horizontal,
 * se perdía de vista a qué equipo pertenecía la fila. Aquí posición, equipo y
 * puntos van siempre juntos, y el desglose por temporada se despliega al tocar.
 */
const RankingCardList: React.FC<RankingCardListProps> = ({
  teams,
  seasons,
  getSeasonPoints,
  getRankIcon,
  getChangeIcon,
  getChangeText,
  showCoefficients = true,
  showTeamsCount = false,
  modalities = [],
  coefficients = COEFFICIENTS,
  weighted = true,
}) => {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <ul className="divide-y divide-line">
      {teams.map((team, index) => {
        const change = team.position_change || 0
        const isOpen = expanded === team.team_id
        const panelId = `ranking-card-${team.team_id}`

        return (
          <li key={team.team_id} className="bg-surface">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex w-9 shrink-0 items-center justify-center">
                {getRankIcon(index + 1)}
              </div>

              <TeamLogo name={team.team_name} logo={team.logo} size="sm" />

              <div className="min-w-0 flex-1">
                <RankingTeamLink
                  team={team}
                  className="block truncate text-sm font-medium text-content hover:text-link transition-colors"
                >
                  {team.team_name}
                </RankingTeamLink>
                <div className="flex items-center gap-2 text-xs text-content-subtle">
                  {team.region_name && <span className="truncate">{team.region_name}</span>}
                  <span className="flex items-center gap-0.5">
                    {getChangeIcon(change)}
                    <span
                      className={cn(
                        'font-medium',
                        change > 0 && 'text-green-600 dark:text-green-300',
                        change < 0 && 'text-red-600 dark:text-red-300'
                      )}
                    >
                      {getChangeText(change)}
                    </span>
                  </span>
                </div>
                {showTeamsCount && team.teams_count > 1 && (
                  <div className="text-xs text-link">{team.teams_count} equipos</div>
                )}
              </div>

              <div className="shrink-0 text-right">
                <TotalBreakdown
                  teamName={team.team_name}
                  seasons={seasons}
                  coefficients={coefficients}
                  getSeasonPoints={(season) => getSeasonPoints(team, season)}
                  total={team.total_points || 0}
                  weighted={weighted}
                  className="font-display text-base"
                />
                <div className="text-[11px] uppercase tracking-wide text-content-subtle">pts</div>
              </div>

              {seasons.length > 0 && (
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : team.team_id)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  aria-label={`Desglose por temporada de ${team.team_name}`}
                  className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg touch-manipulation text-content-subtle transition-colors hover:bg-surface-muted hover:text-content focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')}
                  />
                </button>
              )}
            </div>

            {isOpen && (
              <dl id={panelId} className="divide-y divide-line/60 bg-surface-muted px-4 py-1">
                {seasons.map((season, seasonIndex) => (
                  <div key={season} className="flex items-center justify-between gap-3 py-1">
                    <dt className="text-xs text-content-muted">
                      {formatSeason(season)}
                      {showCoefficients && (
                        <span className="ml-1 text-content-subtle">
                          ×{COEFFICIENTS[seasonIndex] ?? 0}
                        </span>
                      )}
                    </dt>
                    <dd className="text-sm tabular-nums text-content">
                      {modalities.length > 0 ? (
                        <PointsBreakdown
                          teamIds={team.member_team_ids ?? [team.team_id]}
                          teamName={team.team_name}
                          season={season}
                          modalities={modalities}
                          regionId={team.region_id}
                          memberNames={team.member_team_names}
                          value={getSeasonPoints(team, season) || 0}
                          className="justify-start"
                        />
                      ) : (
                        (getSeasonPoints(team, season) || 0).toFixed(2)
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default RankingCardList
