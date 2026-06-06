import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Users, TrendingUp, Trophy, ChevronRight, BarChart3, Loader2 } from 'lucide-react'
import { regionsService } from '@/services/apiService'
import hybridRankingService from '@/services/hybridRankingService'
import { supabase } from '@/services/supabaseService'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import StatsCard from '@/components/ui/StatsCard'

const RegionsPage = () => {
  const [sortBy, setSortBy] = useState<'name' | 'coefficient' | 'teams' | 'points'>('coefficient')
  const [regionStats, setRegionStats] = useState<{
    mostActive: { name: string; count: number } | null
    mostCompetitive: { name: string; avgPoints: number } | null
    bestRegion: { name: string; totalPoints: number } | null
  }>({
    mostActive: null,
    mostCompetitive: null,
    bestRegion: null,
  })

  const { data: regionsData, isLoading, error } = useQuery({
    queryKey: ['regions'],
    queryFn: () => regionsService.getAll(),
  })

  const regions = regionsData?.data || []

  useEffect(() => {
    const calculateRegionStats = async () => {
      try {
        const referenceSeason = await hybridRankingService.getMostRecentSeason()
        const categories = [
          'beach_mixed',
          'beach_open',
          'beach_women',
          'grass_mixed',
          'grass_open',
          'grass_women',
        ]
        const allCategoryData = await Promise.all(
          categories.map((cat) =>
            hybridRankingService.getRankingFromSeasonPoints(cat as any, referenceSeason)
          )
        )

        const teamGlobalPoints: { [key: string]: { team: any; totalPoints: number } } = {}

        allCategoryData.forEach((categoryData) => {
          categoryData.forEach((team) => {
            const teamId = team.team_id
            if (!teamGlobalPoints[teamId]) {
              teamGlobalPoints[teamId] = { team, totalPoints: 0 }
            }
            teamGlobalPoints[teamId].totalPoints += team.total_points || 0
          })
        })

        const globalRanking = Object.values(teamGlobalPoints).map((item) => ({
          ...item.team,
          global_points: item.totalPoints,
        }))

        const teamIds = globalRanking.map((team) => team.team_id)
        const { data: teamsData } = await supabase
          .from('teams')
          .select('id, regionId, regions:regionId(id, name)')
          .in('id', teamIds)

        const teamRegionMap = new Map(
          teamsData?.map((team) => [team.id, team.regions?.name || 'Sin región']) || []
        )

        const regionStatsMap: {
          [regionName: string]: { count: number; totalPoints: number; teams: any[] }
        } = {}

        globalRanking.forEach((team) => {
          const regionName = teamRegionMap.get(team.team_id) || 'Sin región'
          if (!regionStatsMap[regionName]) {
            regionStatsMap[regionName] = { count: 0, totalPoints: 0, teams: [] }
          }
          regionStatsMap[regionName].count++
          regionStatsMap[regionName].totalPoints += team.global_points || 0
          regionStatsMap[regionName].teams.push(team)
        })

        const mostActive = Object.entries(regionStatsMap)
          .map(([name, data]) => ({ name, count: data.count }))
          .sort((a, b) => b.count - a.count)[0]

        const mostCompetitive = Object.entries(regionStatsMap)
          .map(([name, data]) => ({
            name,
            avgPoints: data.count > 0 ? data.totalPoints / data.count : 0,
          }))
          .sort((a, b) => b.avgPoints - a.avgPoints)[0]

        const bestRegion = Object.entries(regionStatsMap)
          .map(([name, data]) => ({ name, totalPoints: data.totalPoints }))
          .sort((a, b) => b.totalPoints - a.totalPoints)[0]

        setRegionStats({
          mostActive: mostActive || null,
          mostCompetitive: mostCompetitive || null,
          bestRegion: bestRegion || null,
        })
      } catch (err) {
        console.error('Error calculando estadísticas de regiones:', err)
      }
    }

    if (regions.length > 0) {
      calculateRegionStats()
    }
  }, [regions])

  const sortedRegions = [...regions].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'coefficient':
        return b.coefficient - a.coefficient
      case 'teams':
        return (b._count?.teams || b.teams?.length || 0) - (a._count?.teams || a.teams?.length || 0)
      default:
        return 0
    }
  })

  const totalRegions = regions.length
  const totalTeams = regions.reduce(
    (sum, region) => sum + (region._count?.teams || region.teams?.length || 0),
    0
  )
  const averageCoefficient =
    regions.length > 0
      ? (regions.reduce((sum, region) => sum + region.coefficient, 0) / regions.length).toFixed(2)
      : '0.00'

  const sortOptions = [
    { id: 'name' as const, label: 'Nombre' },
    { id: 'coefficient' as const, label: 'Coeficiente' },
    { id: 'teams' as const, label: 'Equipos' },
  ]

  if (error) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">Error al cargar las regiones</div>
            <button onClick={() => window.location.reload()} className="btn-primary">
              Reintentar
            </button>
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Regiones"
        subtitle="Explora las regiones participantes en el ranking FEDV"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatsCard icon={MapPin} label="Total regiones" value={totalRegions} />
        <StatsCard
          icon={Users}
          label="Total equipos"
          value={totalTeams}
          iconBgColor="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatsCard
          icon={TrendingUp}
          label="Coef. promedio"
          value={averageCoefficient}
          iconBgColor="bg-accent-100"
          iconColor="text-accent-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card border-l-4 border-l-primary-500">
          <h3 className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
            Región activa
          </h3>
          <p className="text-lg font-bold text-slate-900">{regionStats.mostActive?.name || 'N/A'}</p>
          <p className="text-xs text-slate-600 mt-1">
            {regionStats.mostActive?.count || 0} equipos
          </p>
        </div>
        <div className="card border-l-4 border-l-emerald-500">
          <h3 className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
            Región competitiva
          </h3>
          <p className="text-lg font-bold text-slate-900">
            {regionStats.mostCompetitive?.name || 'N/A'}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            {regionStats.mostCompetitive?.avgPoints?.toFixed(1) || '0'} pts
          </p>
        </div>
        <div className="card border-l-4 border-l-accent-500">
          <h3 className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
            Mejor región
          </h3>
          <p className="text-lg font-bold text-slate-900">{regionStats.bestRegion?.name || 'N/A'}</p>
          <p className="text-xs text-slate-600 mt-1">
            {regionStats.bestRegion?.totalPoints?.toFixed(1) || '0'} pts
          </p>
        </div>
      </div>

      <div className="card mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-medium text-slate-900">Ordenar por</h3>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSortBy(option.id)}
                className={`px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  sortBy === option.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedRegions.map((region) => (
            <Link key={region.id} to={`/regions/${region.id}`} className="card-hover group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                      {region.name}
                    </h3>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Coeficiente:</span>
                  <span className="text-sm font-medium text-accent-600">
                    {region.coefficient.toFixed(2)}x
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Equipos:</span>
                  <span className="text-sm font-medium text-slate-900">
                    {region._count?.teams || region.teams?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Torneos:</span>
                  <span className="text-sm font-medium text-slate-900">
                    {region._count?.tournaments || region.tournaments?.length || 0}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  )
}

export default RegionsPage
