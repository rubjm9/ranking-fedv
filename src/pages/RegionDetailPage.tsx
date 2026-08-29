import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { UsersRound, Trophy, BarChart3, TrendingUp, Loader2, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { regionsService, getTeamPublicUrl, getRegionPublicUrl } from '@/services/apiService'
import hybridRankingService from '@/services/hybridRankingService'
import seasonService from '@/services/seasonService'
import { getRegionalCoefficientBaseSeason, formatCoefficient, formatPoints, formatInteger } from '@/utils/rankingCalculations'
import { supabase } from '@/services/supabaseService'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import PageHeroStatsBar from '@/components/layout/PageHeroStatsBar'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import EmptyState from '@/components/ui/EmptyState'
import TeamLogo from '@/components/ui/TeamLogo'
import ShareButton from '@/components/ui/ShareButton'
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
import { usePageMeta, resolveSiteBaseUrl } from '@/hooks/usePageMeta'
import { buildRegionPageDescription, buildRegionPageTitle } from '@/utils/seoTitles'
import JsonLd from '@/components/seo/JsonLd'
import { buildBreadcrumbListSchema, buildPlaceSchema } from '@/utils/structuredData'
import { useChartTheme, SERIES_DASH } from '@/utils/chartTheme'


/** Ticks del eje: enteros, que con 200px de alto los decimales no caben. */
const formatChartAxis = (value: number) => formatInteger(Number(value))

/** Barra de coeficiente con animación de crecimiento al montar o cambiar el valor. */
const CoefProgressBar: React.FC<{ pct: number; barClass: string }> = ({ pct, barClass }) => {
  const targetWidth = Math.max(4, pct)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    setWidth(0)
    const frame = requestAnimationFrame(() => {
      setWidth(targetWidth)
    })
    return () => cancelAnimationFrame(frame)
  }, [targetWidth])

  return (
    <div className="h-2 bg-line rounded-full overflow-hidden mb-1">
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out ${barClass}`}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

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
  const chart = useChartTheme()
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

  const isNotFound = notFound || (!!error && !isLoading)

  usePageMeta({
    title: region?.name
      ? buildRegionPageTitle({ name: region.name })
      : isNotFound
        ? 'Región no encontrada'
        : undefined,
    description: region?.name ? buildRegionPageDescription({ name: region.name }) : undefined,
    robots: isNotFound ? 'noindex' : undefined,
  })

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
        <div className="sr-only" role="status">
          Cargando región
        </div>
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
      <PageContainer>
        <DetailHeaderSkeleton />
        <div className="sr-only" role="status">
          Cargando región
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <JsonLd
        data={[
          buildBreadcrumbListSchema(
            [{ name: 'Regiones', url: '/regiones' }, { name: region.name }],
            resolveSiteBaseUrl()
          ),
          buildPlaceSchema(
            {
              name: region.name,
              slug: region.slug,
              id: region.id,
              description: `Equipos, campeonatos y coeficiente regional de ${region.name} en el ranking de Ultimate Frisbee FEDV.`,
              publicPath: getRegionPublicUrl(region),
            },
            resolveSiteBaseUrl()
          ),
        ]}
      />
      <PageHeader
        title={region.name}
        subtitle={
          avgActiveCoef !== null
            ? `Coeficiente medio activo: ${formatCoefficient(avgActiveCoef)}×`
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
        actions={
          <ShareButton
            url={getRegionPublicUrl(region)}
            title={`${region.name} - Ranking FEDV`}
            description={`Equipos, campeonatos y coeficiente regional de ${region.name} en el Ranking FEDV`}
            variant="dark"
            size="sm"
          />
        }
        statsBar={
          <PageHeroStatsBar
            isLoading={teamRankingPoints === undefined}
            items={[
              {
                icon: UsersRound,
                label: 'Equipos',
                value: region._count?.teams ?? teams.length,
              },
              {
                icon: Trophy,
                label: 'Campeonatos',
                value: region._count?.tournaments ?? tournaments.length,
              },
              {
                icon: BarChart3,
                label: 'Total puntos',
                value: totalPoints,
              },
              {
                icon: TrendingUp,
                label: 'Promedio puntos',
                value: averagePoints,
              },
            ]}
          />
        }
      />

      <div className="card mb-8">
        <h2 className="font-display text-lg font-semibold text-content mb-4">Coeficientes por temporada</h2>
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
              <div key={key} className="bg-surface-muted rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-content-muted">{label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${surface === 'GRASS' ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300' : 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'}`}>
                    {surface === 'GRASS' ? 'Césped' : 'Playa'}
                  </span>
                </div>
                {coef !== null ? (
                  <>
                    <p className="text-2xl font-bold text-content mb-2">{formatCoefficient(coef)}×</p>
                    <CoefProgressBar pct={pct} barClass={style!.bar} />
                    <div className="flex justify-between text-[10px] text-content-subtle mb-2">
                      <span>{formatCoefficient(0.8)}</span>
                      <span>{formatCoefficient(1)}</span>
                      <span>{formatCoefficient(1.2)}</span>
                    </div>
                    <span className={`text-xs ${style!.badge}`}>{style!.label}</span>
                  </>
                ) : (
                  <p className="text-sm text-content-subtle italic mt-1">Sin datos</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {evolutionChartData.length > 1 && (
        <div className="card mb-8">
          <h2 className="font-display text-lg font-semibold text-content mb-4">Evolución histórica</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={evolutionChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis dataKey="season" tick={{ fontSize: 11 }} />
              <YAxis domain={[0.75, 1.25]} tick={{ fontSize: 11 }} tickFormatter={(v: number) => formatCoefficient(v)} />
              <Tooltip formatter={(v: number) => formatCoefficient(v)} />
              <Legend
                /* plainline hace que el marcador reproduzca el trazo de cada
                   serie. Sin él la leyenda pinta seis marcadores idénticos y no
                   hay forma de emparejar el trazo con el nombre. */
                iconType="plainline"
                /* Sin formatter la etiqueta hereda el color de la serie, que sobre
                   fondo oscuro caía a 2,76:1. */
                formatter={(value) => <span className="text-content-muted">{value}</span>}
              />
              {MODALITIES.map((mod, i) => (
                <Line
                  key={mod}
                  type="monotone"
                  dataKey={mod}
                  name={MODALITY_LABELS[mod]}
                  stroke={chart.series[i % chart.series.length]}
                  strokeWidth={2}
                  strokeDasharray={SERIES_DASH[i % SERIES_DASH.length]}
                  /* Recharts anima el dibujado manipulando stroke-dasharray:
                     con un trazo propio se pelean y la línea no llega a
                     pintarse. En una gráfica de cinco puntos la animación no
                     aporta nada que compense perder la codificación. */
                  isAnimationActive={false}
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
          <h2 className="font-display text-lg font-semibold text-content mb-4">Equipos de la región</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => handleRankingViewChange('global')}
              className={`inline-flex items-center px-3 py-1.5 min-h-[44px] touch-manipulation rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                isGlobalView
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-muted text-content-muted hover:bg-line'
              }`}
            >
              Ranking global
            </button>
            {MODALITIES.map(m => (
              <button
                key={m}
                onClick={() => handleRankingViewChange(m)}
                className={`inline-flex items-center px-3 py-1.5 min-h-[44px] touch-manipulation rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  activeRankingView === m
                    ? 'bg-primary-600 text-white'
                    : 'bg-surface-muted text-content-muted hover:bg-line'
                }`}
              >
                {MODALITY_LABELS[m]}
              </button>
            ))}
          </div>

          {isRankingLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-link mr-2" />
              <span className="text-sm text-content-subtle">Cargando clasificación...</span>
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
                        className="inline-flex items-center gap-1.5 min-h-[44px] touch-manipulation hover:text-white/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
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
                      className="inline-flex items-center gap-1.5 min-h-[44px] touch-manipulation hover:text-white/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      Equipo
                      {getTeamSortIcon('name')}
                    </button>
                  </DataTableHeaderCell>
                  <DataTableHeaderCell>
                    <button
                      type="button"
                      onClick={() => handleTeamSort(isGlobalView ? 'currentPoints' : 'modalityPoints')}
                      className="inline-flex items-center gap-1.5 min-h-[44px] touch-manipulation hover:text-white/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      {isGlobalView ? 'Ranking general actual' : 'Puntos'}
                      {getTeamSortIcon(isGlobalView ? 'currentPoints' : 'modalityPoints')}
                    </button>
                  </DataTableHeaderCell>
                  <DataTableHeaderCell>
                    <button
                      type="button"
                      onClick={() => handleTeamSort('historicalPoints')}
                      className="inline-flex items-center gap-1.5 min-h-[44px] touch-manipulation hover:text-white/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
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
                        className="inline-flex items-center gap-1.5 min-h-[44px] touch-manipulation hover:text-white/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      >
                        Campeonatos
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
                            className="flex items-center gap-3 font-medium text-content hover:text-link"
                          >
                            <TeamLogo name={team.name} logo={team.logo} size="sm" />
                            {team.name}
                          </Link>
                        </DataTableCell>
                        <DataTableCell>{formatPoints(team.points, 1)}</DataTableCell>
                        <DataTableCell>{formatPoints(team.historicalPoints, 1)}</DataTableCell>
                        <DataTableCell className="text-content-subtle">{team.tournaments}</DataTableCell>
                      </DataTableRow>
                    ))
                  : modalityTeams.map(team => (
                      <DataTableRow key={team.id}>
                        <DataTableCell>
                          <span className={`font-bold ${team.nationalPosition <= 3 ? 'text-amber-600 dark:text-amber-300' : team.nationalPosition <= 8 ? 'text-link' : 'text-content-muted'}`}>
                            #{team.nationalPosition}
                          </span>
                        </DataTableCell>
                        <DataTableCell>
                          <Link
                            to={getTeamPublicUrl({ id: team.id })}
                            className="flex items-center gap-3 font-medium text-content hover:text-link"
                          >
                            <TeamLogo name={team.name} logo={team.logo} size="sm" />
                            {team.name}
                          </Link>
                        </DataTableCell>
                        <DataTableCell>{formatPoints(team.modalityPoints, 1)}</DataTableCell>
                        <DataTableCell>{formatPoints(team.historicalPoints, 1)}</DataTableCell>
                      </DataTableRow>
                    ))}
              </DataTableBody>
            </DataTable>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="font-display text-lg font-semibold text-content mb-4">Ranking general actual</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={formatChartAxis} />
                  <Tooltip formatter={(v: number) => formatPoints(v, 1)} />
                  <Bar dataKey="points" fill={chart.series[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-content-subtle text-center py-8">Sin datos de puntos</p>
            )}
          </div>

          <div className="card">
            <h2 className="font-display text-lg font-semibold text-content mb-4">Puntuación histórica</h2>
            {historicalChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={historicalChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={formatChartAxis} />
                  <Tooltip formatter={(v: number) => formatPoints(v, 1)} />
                  <Bar dataKey="points" fill={chart.series[1]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-content-subtle text-center py-8">Sin datos históricos</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-content mb-4">Campeonatos regionales</h2>
        {tournaments.length === 0 ? (
          <EmptyState
            title="Sin campeonatos"
            description="No hay campeonatos registrados para esta región."
          />
        ) : (
          <DataTable caption="Campeonatos de la región">
            <DataTableHead>
              <tr>
                <DataTableHeaderCell>Campeonato</DataTableHeaderCell>
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
                      to={`/campeonatos/${tournament.id}`}
                      className="font-medium text-content hover:text-link"
                    >
                      {tournament.name}
                    </Link>
                  </DataTableCell>
                  <DataTableCell>{tournament.year}</DataTableCell>
                  <DataTableCell className="text-content-subtle">
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
