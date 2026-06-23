import React, { useMemo } from 'react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { MODALITIES, MODALITY_LABELS } from '@/components/regions/constants'

interface RankingEntry {
  position: number
  points: number
  change: number
  totalTeams?: number
}

interface TeamRankingRadarChartProps {
  currentRankings: Record<string, RankingEntry>
  height?: number
}

function positionToScore(position: number, totalTeams: number): number {
  if (!position || position <= 0 || totalTeams <= 0) return 0
  if (totalTeams === 1) return position === 1 ? 100 : 0
  const score = ((totalTeams - position) / (totalTeams - 1)) * 100
  return Math.round(score * 10) / 10
}

const TeamRankingRadarChart: React.FC<TeamRankingRadarChartProps> = ({
  currentRankings,
  height = 260,
}) => {
  const chartData = useMemo(
    () =>
      MODALITIES.map((modality) => {
        const ranking = currentRankings[modality]
        const position = ranking?.position ?? 0
        const totalTeams = ranking?.totalTeams ?? 0
        return {
          modality: MODALITY_LABELS[modality],
          modalityKey: modality,
          score: positionToScore(position, totalTeams),
          position,
          totalTeams,
          points: ranking?.points ?? 0,
        }
      }),
    [currentRankings]
  )

  const hasAnyRanking = chartData.some((entry) => entry.position > 0)

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof chartData[0] }> }) => {
    if (!active || !payload?.length) return null
    const entry = payload[0].payload
    return (
      <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg text-sm">
        <p className="font-medium text-slate-900 mb-1">{entry.modality}</p>
        {entry.position > 0 ? (
          <>
            <p className="text-slate-600">
              Posición:{' '}
              <span className="font-semibold text-slate-900">
                #{entry.position}
                {entry.totalTeams > 0 && (
                  <span className="font-normal text-slate-500"> de {entry.totalTeams} equipos</span>
                )}
              </span>
            </p>
            <p className="text-slate-600">
              Puntos: <span className="font-semibold text-slate-900">{entry.points.toFixed(1)}</span>
            </p>
          </>
        ) : (
          <p className="text-slate-400 italic">Sin ranking</p>
        )}
      </div>
    )
  }

  if (!hasAnyRanking) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm text-center px-4">
        No hay posiciones en rankings para mostrar
      </div>
    )
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="modality"
            tick={{ fontSize: 11, fill: '#64748b' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="Posición"
            dataKey="score"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
      <p className="mt-2 text-xs text-slate-400 text-center">
        Mayor área = mejor posición en cada modalidad
      </p>
    </div>
  )
}

export default TeamRankingRadarChart
