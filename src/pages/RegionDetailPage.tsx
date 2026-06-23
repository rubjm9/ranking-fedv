import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { UsersRound, Trophy, BarChart3, TrendingUp, Loader2, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { regionsService, getTeamPublicUrl } from '@/services/apiService'
import hybridRankingService from '@/services/hybridRankingService'
import seasonService from '@/services/seasonService'
import { getRegionalCoefficientBaseSeason } from '@/utils/rankingCalculations'
import { supabase } from '@/services/supabaseService'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import StatsCard from '@/components/ui/StatsCard'
import EmptyState from '@/components/ui/EmptyState'
import TeamLogo from '@/components/ui/TeamLogo'
import DetailHeaderSkeleton from '@/components/ui/DetailHeaderSkeleton'
import DataTable, {
  DataTableHead,
  DataTableHeaderCell,
  DataTableBody,
  DataTableRow,
  DataTableCell,
} from '@/components/ui/DataTable'
import SeasonNavigator, { useSelectedSeason } from '@/components/regions/SeasonNavigator'
import RegionalCoefficientBreakdown from '@/components/regions/RegionalCoefficientBreakdown'
import { MODALITIES, MODALITY_LABELS, getCoefficientStyle } from '@/components/regions/constants'

const CHART_COLORS = ['#4F46E5', '#F97316', '#10B981', '#6366F1', '#EA580C', '#0EA5E9']
const formatChartValue = (value: number) => Number(value).toFixed(2)

type ModalityKey = typeof MODALITIES[number]
type RankingView = 'global' | ModalityKey

type RegionTeamSortField =
  | 'name'
  | 'currentPoints'
  | 'historicalPoints'
  | 'tournaments'
  | 'nationalPosition'
  | 'modalityPoints'

interface RegionRedirectState {
  resolvedRegionId?: string
  canonicalSlug?: string
}

const getTournamentTypeLabel = (type: string) => {
  switch (type) {
    case 'CE1': return 'Campeonato España 1ª división'
    case 'CE2': return 'Campeonato España 2ª división'
    case 'REGIONAL': return 'Campeonato regional'
    default: return type
  }
}

const RegionDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [activeRankingView, setActiveRankingView] = useState<RankingView>('global')
  const [teamSortField, setTeamSortField] = useState<RegionTeamSortField>('currentPoints')
  const [teamSortDirection, setTeamSortDirection] = useState<'asc' | 'desc'>('desc')
  const [regionId, setRegionId] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const loadIdRef = useRef(0)

  useEffect(() => {
    if (!slug) {
      setNotFound(true)
      return
    }

    const loadId = ++loadIdRef.current
    setNotFound(false)
    setRegionId(null)

    const resolve = async () => {
      try {
        const redirectState = location.state as RegionRedirectState | null

        if (
          redirectState?.resolvedRegionId &&
          redirectState.canonicalSlug === slug
        ) {
          setRegionId(redirectState.resolvedRegionId)
          const qs = searchParams.toString()
          navigate(`${location.pathname}${qs ? `?${qs}` : ''}`, { replace: true, state: null })
          return
        }

        const regionRef = await regionsService.resolveRegion(slug)
        if (loadId !== loadIdRef.current) return

        if (regionRef.publicSlug !== slug) {
          const qs = searchParams.toString()
          navigate(`/regiones/${regionRef.publicSlug}${qs ? `?${qs}` : ''}`, {
            replace: true,
            state: { resolvedRegionId: regionRef.id, canonicalSlug: regionRef.publicSlug },
          })
          return
        }

        setRegionId(regionRef.id)
      } catch {
        if (loadId === loadIdRef.current) setNotFound(true)
      }
    }

    resolve()
  }, [slug, location.state, location.pathname, navigate, searchParams])

  const { data: regionResponse, isLoading, error } = useQuery({
    queryKey: ['region', regionId],
    queryFn: () => regionsService.getById(regionId!),
    enabled: !!regionId,
  })

  const region = regionResponse?.data

  const { data: coeffSeasonInfo } = useQuery({
    queryKey: ['regional-coeff-season-info'],
    queryFn: async () => {
      const currentSeason = await hybridRankingService.getMostRecentSeason()
      return {
        currentSeason,
        coefficientSeason: getRegionalCoefficientBaseSeason(currentSeason),
      }
    },
  })

  const referenceSeason = coeffSeasonInfo?.coefficientSeason

  const { data: availableSeasons = [] } = useQuery({
    queryKey: ['regional-coefficient-seasons'],
    queryFn: () => seasonService.listRegionalCoefficientSeasons(),
  })

  const selectedSeason = useSelectedSeason(availableSeasons, referenceSeason)

  const { data: modalityCoefficients } = useQuery({
    queryKey: ['region-coefficients', regionId, selectedSeason],
    queryFn: async () => {
      const all = await seasonService.getRegionalCoefficients(selectedSeason)
      return all.filter(c => c.regionId === regionId)
    },
    enabled: !!regionId && !!selectedSeason,
  })

  const { data: coefficientHistory } = useQuery({
    queryKey: ['region-coefficient-history', regionId],
    queryFn: () => seasonService.getRegionCoefficientHistory(regionId!),
    enabled: !!regionId,
  })

  const { data: breakdown, isLoading: isLoadingBreakdown } = useQuery({
    queryKey: ['regional-coefficient-breakdown', selectedSeason, regionId],
    queryFn: () => seasonService.getRegionalCoefficientBreakdown(selectedSeason, regionId!),
    enabled: !!regionId && !!selectedSeason,
  })

  const { data: teamRankingPoints } = useQuery({
    queryKey: ['region-team-points', regionId],
    queryFn: async () => {
      const refSeason = await hybridRankingService.getMostRecentSeason()
      const categories = MODALITIES.map(m => m)

      const allCategoryData = await Promise.all(
        categories.map(cat => hybridRankingService.getRankingFromSeasonPoints(cat as never, refSeason))
      )
      const currentByTeam: Record<string, number> = {}
      allCategoryData.forEach(categoryData => {
        categoryData.forEach(team => {
          currentByTeam[team.team_id] = (currentByTeam[team.team_id] || 0) + (team.total_points || 0)
        })
      })

      const { data: regionTeams } = await supabase
        .from('teams')
        .select('id')
        .eq('regionId', regionId)

      const teamIds = (regionTeams || []).map(t => t.id)
      const historicalByTeam: Record<string, number> = {}

      if (teamIds.length > 0) {
        const pointColumns = categories.map(cat => `${cat}_points`).join(', ')
        const { data: seasonPoints } = await supabase
          .from('team_season_points')
          .select(`team_id, ${pointColumns}`)
          .in('team_id', teamIds)

        seasonPoints?.forEach(row => {
          const seasonTotal = categories.reduce(
            (sum, cat) => sum + (Number(row[`${cat}_points`]) || 0),
            0
          )
          if (seasonTotal <= 0) return
          historicalByTeam[row.team_id] = (historicalByTeam[row.team_id] || 0) + seasonTotal
        })
      }

      return { current: currentByTeam, historical: historicalByTeam }
    },
    enabled: !!regionId,
  })

  const { data: modalityRankingData } = useQuery({
    queryKey: ['region-modality-ranking', regionId, activeRankingView],
    queryFn: async () => {
      const refSeason = await hybridRankingService.getMostRecentSeason()
      const allTeams = await hybridRankingService.getRankingFromSeasonPoints(activeRankingView as never, refSeason)

      const { data: regionTeams } = await supabase
        .from('teams')
        .select('id')
        .eq('regionId', regionId)

      const regionTeamIds = new Set((regionTeams || []).map(t => t.id))

      return allTeams
        .map((t, idx) => ({ ...t, national_position: idx + 1 }))
        .filter(t => regionTeamIds.has(t.team_id))
    },
    enabled: !!regionId && activeRankingView !== 'global',
  })

  const handleRankingViewChange = (view: RankingView) => {
    setActiveRankingView(view)
    if (view === 'global') {
      setTeamSortField('currentPoints')
      setTeamSortDirection('desc')
    } else {
      setTeamSortField('nationalPosition')
      setTeamSortDirection('asc')
    }
  }

  const handleTeamSort = (field: RegionTeamSortField) => {
    if (teamSortField === field) {
      setTeamSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setTeamSortField(field)
      const defaultAsc = field === 'name' || field === 'nationalPosition'
      setTeamSortDirection(defaultAsc ? 'asc' : 'desc')
    }
  }

  const getTeamSortIcon = (field: RegionTeamSortField) => {
    if (teamSortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-white/50" />
    }
    return teamSortDirection === 'asc'
      ? <ChevronUp className="h-3.5 w-3.5" />
      : <ChevronDown className="h-3.5 w-3.5" />
  }

  const teamLogosById = useMemo(() => {
    const map: Record<string, string | null | undefined> = {}
    region?.teams?.forEach((team: { id: string; logo?: string | null }) => {
      map[team.id] = team.logo
    })
    return map
  }, [region?.teams])

  const teamTournamentsById = useMemo(() => {
    const map: Record<string, number> = {}
    region?.teams?.forEach((team: { id: string; positions?: { count: number }[] }) => {
      map[team.id] = team.positions?.[0]?.count || 0
    })
    return map
  }, [region?.teams])

  const globalTeams = useMemo(() => {
    if (!region?.teams) return []
    const list = [...region.teams]
      .map((team: { id: string; slug?: string; name: string; logo?: string; positions?: { count: number }[] }) => ({
        id: team.id,
        slug: team.slug,
        name: team.name,
        logo: team.logo,
        points: teamRankingPoints?.current[team.id] || 0,
        historicalPoints: teamRankingPoints?.historical[team.id] || 0,
        tournaments: team.positions?.[0]?.count || 0,
      }))

    list.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (teamSortField) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          return teamSortDirection === 'asc'
            ? (aValue as string).localeCompare(bValue as string, 'es')
            : (bValue as string).localeCompare(aValue as string, 'es')
        case 'historicalPoints':
          aValue = a.historicalPoints
          bValue = b.historicalPoints
          break
        case 'tournaments':
          aValue = a.tournaments
          bValue = b.tournaments
          break
        case 'currentPoints':
        default:
          aValue = a.points
          bValue = b.points
          break
      }

      return teamSortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number)
    })

    return list
  }, [region, teamRankingPoints, teamSortField, teamSortDirection])

  const modalityTeams = useMemo(() => {
    if (!modalityRankingData) return []

    const list = modalityRankingData.map(team => ({
      id: team.team_id,
      slug: undefined as string | undefined,
      name: team.team_name,
      logo: teamLogosById[team.team_id],
      nationalPosition: team.national_position,
      modalityPoints: team.total_points || 0,
      historicalPoints: teamRankingPoints?.historical[team.team_id] || 0,
      tournaments: teamTournamentsById[team.team_id] || 0,
    }))

    list.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (teamSortField) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          return teamSortDirection === 'asc'
            ? (aValue as string).localeCompare(bValue as string, 'es')
            : (bValue as string).localeCompare(aValue as string, 'es')
        case 'historicalPoints':
          aValue = a.historicalPoints
          bValue = b.historicalPoints
          break
        case 'tournaments':
          aValue = a.tournaments
          bValue = b.tournaments
          break
        case 'modalityPoints':
          aValue = a.modalityPoints
          bValue = b.modalityPoints
          break
        case 'nationalPosition':
        default:
          aValue = a.nationalPosition
          bValue = b.nationalPosition
          break
      }

      return teamSortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number)
    })

    return list
  }, [
    modalityRankingData,
    teamLogosById,
    teamRankingPoints,
    teamTournamentsById,
    teamSortField,
    teamSortDirection,
  ])

  const isGlobalView = activeRankingView === 'global'
  const displayedTeams = isGlobalView ? globalTeams : modalityTeams
  const isRankingLoading = isGlobalView ? !teamRankingPoints : modalityRankingData === undefined

  const teams = globalTeams

  const tournaments = region?.tournaments || []
  const totalPoints = teams.reduce((sum, t) => sum + t.points, 0)
  const averagePoints = teams.length > 0 ? totalPoints / teams.length : 0

  const chartData = teams.slice(0, 8).map(team => ({
    name: team.name.length > 12 ? `${team.name.slice(0, 12)}…` : team.name,
    points: team.points,
  }))

  const historicalChartData = [...teams]
    .sort((a, b) => b.historicalPoints - a.historicalPoints)
    .slice(0, 8)
    .map(team => ({
      name: team.name.length > 12 ? `${team.name.slice(0, 12)}…` : team.name,
      points: team.historicalPoints,
    }))

  const coefByModality = useMemo(() => {
    const map: Record<string, number> = {}
    ;(modalityCoefficients || []).forEach(c => { map[c.modality] = c.coefficient })
    return map
  }, [modalityCoefficients])

  const avgActiveCoef = useMemo(() => {
    const vals = Object.values(coefByModality)
    if (!vals.length) return null
    return vals.reduce((s, v) => s + v, 0) / vals.length
  }, [coefByModality])

  const evolutionChartData = useMemo(() => {
    if (!coefficientHistory?.length) return []

    const seasonMap: Record<string, Record<string, number>> = {}
    coefficientHistory.forEach(c => {
      if (!seasonMap[c.season]) seasonMap[c.season] = {}
      if (c.modality) seasonMap[c.season][c.modality] = c.coefficient
    })

    return Object.entries(seasonMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([season, coefs]) => ({
        season,
        ...coefs,
      }))
  }, [coefficientHistory])

  if (!regionId && !notFound) {
    return (
      <PageContainer>
        <DetailHeaderSkeleton />
      </PageContainer>
    )
  }

  if (notFound || error) {
    return (
      <PageContainer>
        <EmptyState
          title="Región no encontrada"
          description="La región que buscas no existe o ha sido eliminada."
          actionLink={{ label: 'Ver regiones', href: '/regiones' }}
        />
      </PageContainer>
    )
  }

  if (isLoading || !region) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-3 text-slate-600">Cargando región...</span>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={region.name}
        subtitle={
          avgActiveCoef !== null
            ? `Coeficiente medio activo: ${avgActiveCoef.toFixed(2)}×`
            : 'Región participante en el ranking FEDV'
        }
        breadcrumbs={
          <Breadcrumbs
            variant="dark"
            items={[
              { label: 'Regiones', href: '/regiones' },
              { label: region.name },
            ]}
          />
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard icon={UsersRound} label="Equipos" value={region._count?.teams ?? teams.length} />
        <StatsCard
          icon={Trophy}
          label="Torneos"
          value={region._count?.tournaments ?? tournaments.length}
          iconColor="text-emerald-600"
        />
        <StatsCard
          icon={BarChart3}
          label="Total puntos"
          value={totalPoints.toFixed(0)}
          iconColor="text-accent-600"
        />
        <StatsCard
          icon={TrendingUp}
          label="Promedio puntos"
          value={averagePoints.toFixed(1)}
        />
      </div>

      <div className="card mb-8">
        <h2 className="font-display text-lg font-semibold text-slate-900 mb-4">Coeficientes por temporada</h2>
        <SeasonNavigator
          seasons={availableSeasons}
          defaultSeason={referenceSeason}
          calculationSeason={breakdown?.calculationSeason || selectedSeason}
          appliesToSeason={breakdown?.appliesToSeason}
        />

        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {MODALITIES.map(key => {
            const label = MODALITY_LABELS[key]
            const coef = coefByModality[key] ?? null
            const style = coef !== null ? getCoefficientStyle(coef) : null
            const surface = key.startsWith('grass') ? 'GRASS' : 'BEACH'
            const pct = coef !== null ? ((coef - 0.80) / (1.20 - 0.80)) * 100 : 50
            return (
              <div key={key} className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${surface === 'GRASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {surface === 'GRASS' ? 'Césped' : 'Playa'}
                  </span>
                </div>
                {coef !== null ? (
                  <>
                    <p className="text-2xl font-bold text-slate-900 mb-2">{coef.toFixed(2)}×</p>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-1">
                      <div
                        className={`h-full rounded-full transition-all ${style!.bar}`}
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-2">
                      <span>0.80</span>
                      <span>1.00</span>
                      <span>1.20</span>
                    </div>
                    <span className={`text-xs ${style!.badge}`}>{style!.label}</span>
                  </>
                ) : (
                  <p className="text-sm text-slate-400 italic mt-1">Sin datos</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {evolutionChartData.length > 1 && (
        <div className="card mb-8">
          <h2 className="font-display text-lg font-semibold text-slate-900 mb-4">Evolución histórica</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={evolutionChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="season" tick={{ fontSize: 11 }} />
              <YAxis domain={[0.75, 1.25]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => v.toFixed(2)} />
              <Legend />
              {MODALITIES.map((mod, i) => (
                <Line
                  key={mod}
                  type="monotone"
                  dataKey={mod}
                  name={MODALITY_LABELS[mod]}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mb-8">
        <RegionalCoefficientBreakdown
          breakdown={breakdown}
          regionId={regionId!}
          isLoading={isLoadingBreakdown}
          defaultExpanded
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 card">
          <h2 className="font-display text-lg font-semibold text-slate-900 mb-4">Equipos de la región</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => handleRankingViewChange('global')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isGlobalView
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Ranking global
            </button>
            {MODALITIES.map(m => (
              <button
                key={m}
                onClick={() => handleRankingViewChange(m)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeRankingView === m
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {MODALITY_LABELS[m]}
              </button>
            ))}
          </div>

          {isRankingLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary-600 mr-2" />
              <span className="text-sm text-slate-500">Cargando clasificación...</span>
            </div>
          ) : displayedTeams.length === 0 ? (
            <EmptyState
              title="Sin datos"
              description={
                isGlobalView
                  ? 'Esta región no tiene equipos registrados.'
                  : `No hay equipos de ${region.name} en el ranking de ${MODALITY_LABELS[activeRankingView as ModalityKey]}.`
              }
            />
          ) : (
            <DataTable
              caption={
                isGlobalView
                  ? `Ranking global — ${region.name}`
                  : `Clasificación ${MODALITY_LABELS[activeRankingView as ModalityKey]} — ${region.name}`
              }
            >
              <DataTableHead>
                <tr>
                  {!isGlobalView && (
                    <DataTableHeaderCell>
                      <button
                        type="button"
                        onClick={() => handleTeamSort('nationalPosition')}
                        className="inline-flex items-center gap-1.5 hover:text-white/90 transition-colors"
                      >
                        Posición nacional
                        {getTeamSortIcon('nationalPosition')}
                      </button>
                    </DataTableHeaderCell>
                  )}
                  <DataTableHeaderCell>
                    <button
                      type="button"
                      onClick={() => handleTeamSort('name')}
                      className="inline-flex items-center gap-1.5 hover:text-white/90 transition-colors"
                    >
                      Equipo
                      {getTeamSortIcon('name')}
                    </button>
                  </DataTableHeaderCell>
                  <DataTableHeaderCell>
                    <button
                      type="button"
                      onClick={() => handleTeamSort(isGlobalView ? 'currentPoints' : 'modalityPoints')}
                      className="inline-flex items-center gap-1.5 hover:text-white/90 transition-colors"
                    >
                      {isGlobalView ? 'Ranking general actual' : 'Puntos'}
                      {getTeamSortIcon(isGlobalView ? 'currentPoints' : 'modalityPoints')}
                    </button>
                  </DataTableHeaderCell>
                  <DataTableHeaderCell>
                    <button
                      type="button"
                      onClick={() => handleTeamSort('historicalPoints')}
                      className="inline-flex items-center gap-1.5 hover:text-white/90 transition-colors"
                    >
                      Puntuación histórica
                      {getTeamSortIcon('historicalPoints')}
                    </button>
                  </DataTableHeaderCell>
                  {isGlobalView && (
                    <DataTableHeaderCell>
                      <button
                        type="button"
                        onClick={() => handleTeamSort('tournaments')}
                        className="inline-flex items-center gap-1.5 hover:text-white/90 transition-colors"
                      >
                        Torneos
                        {getTeamSortIcon('tournaments')}
                      </button>
                    </DataTableHeaderCell>
                  )}
                </tr>
              </DataTableHead>
              <DataTableBody>
                {isGlobalView
                  ? globalTeams.map(team => (
                      <DataTableRow key={team.id}>
                        <DataTableCell>
                          <Link
                            to={getTeamPublicUrl(team)}
                            className="flex items-center gap-3 font-medium text-slate-900 hover:text-primary-600"
                          >
                            <TeamLogo name={team.name} logo={team.logo} size="sm" />
                            {team.name}
                          </Link>
                        </DataTableCell>
                        <DataTableCell>{team.points.toFixed(1)}</DataTableCell>
                        <DataTableCell>{team.historicalPoints.toFixed(1)}</DataTableCell>
                        <DataTableCell className="text-slate-500">{team.tournaments}</DataTableCell>
                      </DataTableRow>
                    ))
                  : modalityTeams.map(team => (
                      <DataTableRow key={team.id}>
                        <DataTableCell>
                          <span className={`font-bold ${team.nationalPosition <= 3 ? 'text-amber-600' : team.nationalPosition <= 8 ? 'text-primary-600' : 'text-slate-700'}`}>
                            #{team.nationalPosition}
                          </span>
                        </DataTableCell>
                        <DataTableCell>
                          <Link
                            to={getTeamPublicUrl({ id: team.id })}
                            className="flex items-center gap-3 font-medium text-slate-900 hover:text-primary-600"
                          >
                            <TeamLogo name={team.name} logo={team.logo} size="sm" />
                            {team.name}
                          </Link>
                        </DataTableCell>
                        <DataTableCell>{team.modalityPoints.toFixed(1)}</DataTableCell>
                        <DataTableCell>{team.historicalPoints.toFixed(1)}</DataTableCell>
                      </DataTableRow>
                    ))}
              </DataTableBody>
            </DataTable>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="font-display text-lg font-semibold text-slate-900 mb-4">Ranking general actual</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={formatChartValue} />
                  <Tooltip formatter={(v: number) => formatChartValue(v)} />
                  <Bar dataKey="points" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">Sin datos de puntos</p>
            )}
          </div>

          <div className="card">
            <h2 className="font-display text-lg font-semibold text-slate-900 mb-4">Puntuación histórica</h2>
            {historicalChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={historicalChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={formatChartValue} />
                  <Tooltip formatter={(v: number) => formatChartValue(v)} />
                  <Bar dataKey="points" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">Sin datos históricos</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-slate-900 mb-4">Campeonatos regionales</h2>
        {tournaments.length === 0 ? (
          <EmptyState
            title="Sin torneos"
            description="No hay torneos registrados para esta región."
          />
        ) : (
          <DataTable caption="Torneos de la región">
            <DataTableHead>
              <tr>
                <DataTableHeaderCell>Torneo</DataTableHeaderCell>
                <DataTableHeaderCell>Año</DataTableHeaderCell>
                <DataTableHeaderCell>Tipo</DataTableHeaderCell>
                <DataTableHeaderCell>Superficie</DataTableHeaderCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {tournaments.map((tournament: { id: string; name: string; year: number; type: string; surface: string }) => (
                <DataTableRow key={tournament.id}>
                  <DataTableCell>
                    <Link
                      to={`/tournaments/${tournament.id}`}
                      className="font-medium text-slate-900 hover:text-primary-600"
                    >
                      {tournament.name}
                    </Link>
                  </DataTableCell>
                  <DataTableCell>{tournament.year}</DataTableCell>
                  <DataTableCell className="text-slate-500">
                    {getTournamentTypeLabel(tournament.type)}
                  </DataTableCell>
                  <DataTableCell>
                    <span className={tournament.surface === 'GRASS' ? 'surface-badge-grass' : 'surface-badge-beach'}>
                      {tournament.surface === 'GRASS' ? 'Césped' : 'Playa'}
                    </span>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </div>
    </PageContainer>
  )
}

export default RegionDetailPage
