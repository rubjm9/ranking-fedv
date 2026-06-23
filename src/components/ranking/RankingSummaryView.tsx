import React from 'react'
import { Trophy, BarChart3, TrendingUp, UsersRound, Star } from 'lucide-react'
import StatsBlock from '@/components/ranking/StatsBlock'
import SummaryCard from '@/components/ranking/SummaryCard'
import RankingSummarySkeleton from '@/components/ui/RankingSummarySkeleton'

interface HighlightStats {
  bestGlobalTeam?: { team_name?: string; global_points?: number; logo?: string | null }
  mostPointsGained?: { team_name?: string; points_gained?: number; logo?: string | null }
  biggestRise?: { team_name?: string; positions_gained?: number; logo?: string | null }
  bestFilial?: { team_name?: string; global_points?: number; logo?: string | null } | null
  bestHistorical?: { team_name?: string; historical_points?: number; logo?: string | null }
  totalTeams: number
}

interface RankingSummaryViewProps {
  isLoading?: boolean
  highlightStats: HighlightStats | null
  beachMixedData: any[]
  beachWomenData: any[]
  beachOpenData: any[]
  grassMixedData: any[]
  grassWomenData: any[]
  grassOpenData: any[]
  onViewFullCategory: (category: string) => void
  getRankIcon: (position: number) => React.ReactNode
  getChangeIcon: (change: number) => React.ReactNode
  getChangeText: (change: number) => string
}

const RankingSummaryView: React.FC<RankingSummaryViewProps> = ({
  isLoading = false,
  highlightStats,
  beachMixedData,
  beachWomenData,
  beachOpenData,
  grassMixedData,
  grassWomenData,
  grassOpenData,
  onViewFullCategory,
  getRankIcon,
  getChangeIcon,
  getChangeText,
}) => {
  if (isLoading) {
    return <RankingSummarySkeleton />
  }

  return (
    <div className="space-y-8">
      {highlightStats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 items-stretch">
          <StatsBlock
            title="Mejor global"
            value={highlightStats.bestGlobalTeam?.team_name || 'N/A'}
            subtitle={`${highlightStats.bestGlobalTeam?.global_points?.toFixed(1) || '0'} pts`}
            icon={Trophy}
            logo={highlightStats.bestGlobalTeam?.logo}
            teamName={highlightStats.bestGlobalTeam?.team_name}
            tooltip="Equipo con más puntos sumando todas las categorías con coeficientes de antigüedad aplicados."
            useLogoAsBackground
          />
          <StatsBlock
            title="Equipo revelación"
            value={highlightStats.mostPointsGained?.team_name || 'N/A'}
            subtitle={`+${highlightStats.mostPointsGained?.points_gained?.toFixed(1) || '0'} pts`}
            icon={BarChart3}
            logo={highlightStats.mostPointsGained?.logo}
            teamName={highlightStats.mostPointsGained?.team_name}
            tooltip="Equipo que ha ganado más puntos comparando la temporada actual con la anterior."
            useLogoAsBackground
          />
          <StatsBlock
            title="Subida en el ranking"
            value={highlightStats.biggestRise?.team_name || 'N/A'}
            subtitle={`+${highlightStats.biggestRise?.positions_gained || 0} puestos`}
            icon={TrendingUp}
            logo={highlightStats.biggestRise?.logo}
            teamName={highlightStats.biggestRise?.team_name}
            tooltip="Equipo que ha subido más posiciones comparando la temporada actual con la anterior."
            useLogoAsBackground
          />
          <StatsBlock
            title="Mejor filial"
            value={highlightStats.bestFilial?.team_name || 'Sin filiales'}
            subtitle={
              highlightStats.bestFilial
                ? `${highlightStats.bestFilial.global_points?.toFixed(1) || '0'} pts`
                : 'No hay filiales'
            }
            icon={UsersRound}
            logo={highlightStats.bestFilial?.logo}
            teamName={highlightStats.bestFilial?.team_name}
            tooltip="Equipo filial (secundario de un club principal) con más puntos en el ranking."
            useLogoAsBackground
          />
          <StatsBlock
            title="Líder histórico"
            value={highlightStats.bestHistorical?.team_name || 'N/A'}
            subtitle={`${highlightStats.bestHistorical?.historical_points?.toFixed(1) || '0'} pts`}
            icon={Star}
            logo={highlightStats.bestHistorical?.logo}
            teamName={highlightStats.bestHistorical?.team_name}
            tooltip="Equipo con más puntos acumulados desde que se registran datos en el ranking, en todas las temporadas sin aplicar coeficientes."
            useLogoAsBackground
          />
          <StatsBlock
            title="Total equipos"
            value={highlightStats.totalTeams}
            subtitle="Con torneos disputados"
            icon={UsersRound}
            tooltip="Número total de equipos únicos con puntos en el ranking actual."
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SummaryCard
          title="Playa Mixto"
          data={beachMixedData || []}
          category="beach_mixed"
          onViewFull={onViewFullCategory}
          getRankIcon={getRankIcon}
          getChangeIcon={getChangeIcon}
          getChangeText={getChangeText}
        />
        <SummaryCard
          title="Playa Women"
          data={beachWomenData || []}
          category="beach_women"
          onViewFull={onViewFullCategory}
          getRankIcon={getRankIcon}
          getChangeIcon={getChangeIcon}
          getChangeText={getChangeText}
        />
        <SummaryCard
          title="Playa Open"
          data={beachOpenData || []}
          category="beach_open"
          onViewFull={onViewFullCategory}
          getRankIcon={getRankIcon}
          getChangeIcon={getChangeIcon}
          getChangeText={getChangeText}
        />
        <SummaryCard
          title="Césped Mixto"
          data={grassMixedData || []}
          category="grass_mixed"
          onViewFull={onViewFullCategory}
          getRankIcon={getRankIcon}
          getChangeIcon={getChangeIcon}
          getChangeText={getChangeText}
        />
        <SummaryCard
          title="Césped Women"
          data={grassWomenData || []}
          category="grass_women"
          onViewFull={onViewFullCategory}
          getRankIcon={getRankIcon}
          getChangeIcon={getChangeIcon}
          getChangeText={getChangeText}
        />
        <SummaryCard
          title="Césped Open"
          data={grassOpenData || []}
          category="grass_open"
          onViewFull={onViewFullCategory}
          getRankIcon={getRankIcon}
          getChangeIcon={getChangeIcon}
          getChangeText={getChangeText}
        />
      </div>
    </div>
  )
}

export default RankingSummaryView
