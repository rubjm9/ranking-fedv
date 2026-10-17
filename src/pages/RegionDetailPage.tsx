import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { UsersRound, Trophy, BarChart3, TrendingUp, Loader2, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { regionsService, getTeamPublicUrl, getRegionPublicUrl } from '@/services/apiService'
import hybridRankingService from '@/services/hybridRankingService'
import seasonService from '@/services/seasonService'
import { getRankingReferenceSeason, getPreviousSeasonLabel, getNextSeasonLabel, formatCoefficient, formatPoints, formatInteger } from '@/utils/rankingCalculations'
import { supabase } from '@/services/supabaseService'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import PageHeroStatsBar from '@/components/layout/PageHeroStatsBar'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import EmptyState from '@/components/ui/EmptyState'
import TeamLogo from '@/components/ui/TeamLogo'
// Con alias: la página ya importa `Tooltip` de recharts para las gráficas.
import InfoTooltip from '@/components/ui/Tooltip'
import ShareButton from '@/components/ui/ShareButton'
import DetailHeaderSkeleton from '@/components/ui/DetailHeaderSkeleton'
import DataTable, {
  DataTableHead,
  DataTableHeaderCell,
  DataTableBody,
  DataTableRow,
  DataTableCell,
} from '@/components/ui/DataTable'
import { useSelectedSeason } from '@/components/regions/SeasonNavigator'
import RegionSeasonSelector from '@/components/regions/RegionSeasonSelector'
import RegionalCoefficientBreakdown from '@/components/regions/RegionalCoefficientBreakdown'
import { MODALITIES, MODALITY_LABELS, MODALITY_ITEMS, getCoefficientStyle } from '@/components/regions/constants'
import RankingTabNav from '@/components/ranking/RankingTabNav'
import { IconBeach, IconGrass } from '@/components/ui/SurfaceIcons'
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
  | 'regionPosition'
  | 'name'
  | 'currentPoints'
  | 'historicalPoints'
  | 'tournaments'
  | 'nationalPosition'
  | 'modalityPoints'

/** Compara posiciones dejando siempre al final a quien no tiene (sin puntos). */
const comparePositions = (a: number | null, b: number | null, direction: 'asc' | 'desc') => {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return direction === 'asc' ? a - b : b - a
}

/** Mismos colores que ya usaba la posición nacional: podio, top 8, resto. */
const PositionBadge: React.FC<{ position: number | null }> = ({ position }) =>
  position === null ? (
    <span className="text-content-subtle" aria-label="Sin posición">—</span>
  ) : (
    <span
      className={`font-bold ${
        position <= 3 ? 'text-amber-600 dark:text-amber-300' : position <= 8 ? 'text-link' : 'text-content-muted'
      }`}
    >
      #{position}
    </span>
  )

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
  const [teamSortField, setTeamSortField] = useState<RegionTeamSortField>('regionPosition')
  const [teamSortDirection, setTeamSortDirection] = useState<'asc' | 'desc'>('asc')
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

  /*
    «Temporada X» significa lo mismo que en /ranking: el ranking de la
    temporada X (que, mientras avanza, se nutre sobre todo de los resultados
    de las anteriores, ponderados) y los coeficientes que aplican a sus
    regionales, calculados con datos hasta la temporada anterior.

    Por defecto, la temporada en curso, con la misma regla que /ranking
    (getRankingReferenceSeason), para que la posición nacional de esta tabla
    coincida con la de /ranking/general.
  */
  const { data: currentSeason } = useQuery({
    queryKey: ['ranking-reference-season'],
    queryFn: async () => getRankingReferenceSeason(await hybridRankingService.getMostRecentSeason()),
  })

  const { data: coefficientSeasons = [] } = useQuery({
    queryKey: ['regional-coefficient-seasons'],
    queryFn: () => seasonService.listRegionalCoefficientSeasons(),
  })

  /* La lista de coeficientes va por temporada de cálculo; aquí se traduce a la
     temporada a la que aplican. No se ofrecen temporadas futuras, y la actual
     está siempre aunque aún no tenga coeficientes. */
  const availableSeasons = useMemo(() => {
    if (!currentSeason) return []
    const anioActual = parseInt(currentSeason, 10)
    const temporadas = new Set(
      coefficientSeasons
        .map(getNextSeasonLabel)
        .filter(t => parseInt(t, 10) <= anioActual)
    )
    temporadas.add(currentSeason)
    return [...temporadas].sort((a, b) => parseInt(b, 10) - parseInt(a, 10))
  }, [coefficientSeasons, currentSeason])

  const selectedSeason = useSelectedSeason(availableSeasons, currentSeason)
  /** Temporada con cuyos datos se calcularon los coeficientes que aplican a la elegida. */
  const coefficientSeason = selectedSeason ? getPreviousSeasonLabel(selectedSeason) : ''

  const { data: modalityCoefficients } = useQuery({
    queryKey: ['region-coefficients', regionId, coefficientSeason],
    queryFn: async () => {
      const all = await seasonService.getRegionalCoefficients(coefficientSeason)
      return all.filter(c => c.regionId === regionId)
    },
    enabled: !!regionId && !!coefficientSeason,
  })

  const { data: coefficientHistory } = useQuery({
    queryKey: ['region-coefficient-history', regionId],
    queryFn: () => seasonService.getRegionCoefficientHistory(regionId!),
    enabled: !!regionId,
  })

  const { data: breakdown, isLoading: isLoadingBreakdown } = useQuery({
    queryKey: ['regional-coefficient-breakdown', coefficientSeason, regionId],
    queryFn: () => seasonService.getRegionalCoefficientBreakdown(coefficientSeason, regionId!),
    enabled: !!regionId && !!coefficientSeason,
  })

  /*
    Puntos del ranking de la temporada elegida: los mismos que /ranking/general
    para esa temporada (suma de las seis superficies). Antes usaba siempre
    getMostRecentSeason(), así que el selector movía los coeficientes pero no
    la tabla.
  */
  const { data: seasonPointsByTeam, isPlaceholderData: isSeasonPointsStale } = useQuery({
    queryKey: ['region-team-points', regionId, selectedSeason],
    queryFn: async () => {
      const allCategoryData = await Promise.all(
        MODALITIES.map(cat => hybridRankingService.getRankingFromSeasonPoints(cat as never, selectedSeason))
      )
      const currentByTeam: Record<string, number> = {}
      allCategoryData.forEach(categoryData => {
        categoryData.forEach(team => {
          currentByTeam[team.team_id] = (currentByTeam[team.team_id] || 0) + (team.total_points || 0)
        })
      })
      return currentByTeam
    },
    enabled: !!regionId && !!selectedSeason,
    // Cambiar de temporada no colapsa la tabla a un spinner.
    placeholderData: keepPreviousData,
  })

  /* Acumulada de siempre: no depende de la temporada, así que vive en su
     propia consulta y no se vuelve a pedir en cada cambio. */
  const { data: historicalPointsByTeam } = useQuery({
    queryKey: ['region-team-historical', regionId],
    queryFn: async () => {
      const { data: regionTeams } = await supabase
        .from('teams')
        .select('id')
        .eq('regionId', regionId)

      const teamIds = (regionTeams || []).map(t => t.id)
      const historicalByTeam: Record<string, number> = {}

      if (teamIds.length > 0) {
        const pointColumns = MODALITIES.map(cat => `${cat}_points`).join(', ')
        const { data: seasonPoints } = await supabase
          .from('team_season_points')
          .select(`team_id, ${pointColumns}`)
          .in('team_id', teamIds)

        seasonPoints?.forEach(row => {
          const seasonTotal = MODALITIES.reduce(
            (sum, cat) => sum + (Number(row[`${cat}_points`]) || 0),
            0
          )
          if (seasonTotal <= 0) return
          historicalByTeam[row.team_id] = (historicalByTeam[row.team_id] || 0) + seasonTotal
        })
      }
      return historicalByTeam
    },
    enabled: !!regionId,
  })

  // Misma forma que antes para no tocar a los consumidores.
  const teamRankingPoints = useMemo(
    () =>
      seasonPointsByTeam && historicalPointsByTeam
        ? { current: seasonPointsByTeam, historical: historicalPointsByTeam }
        : undefined,
    [seasonPointsByTeam, historicalPointsByTeam]
  )

  /** La temporada elegida aún no tiene puntos: mejor decirlo que listar ceros. */
  const seasonHasNoData =
    !!seasonPointsByTeam && !isSeasonPointsStale && Object.keys(seasonPointsByTeam).length === 0

  const { data: modalityRankingData } = useQuery({
    queryKey: ['region-modality-ranking', regionId, activeRankingView, selectedSeason],
    queryFn: async () => {
      const allTeams = await hybridRankingService.getRankingFromSeasonPoints(activeRankingView as never, selectedSeason)

      const { data: regionTeams } = await supabase
        .from('teams')
        .select('id')
        .eq('regionId', regionId)

      const regionTeamIds = new Set((regionTeams || []).map(t => t.id))

      return allTeams
        .map((t, idx) => ({ ...t, national_position: idx + 1 }))
        .filter(t => regionTeamIds.has(t.team_id))
    },
    enabled: !!regionId && !!selectedSeason && activeRankingView !== 'global',
    placeholderData: keepPreviousData,
  })

  /* Mismas pastillas que /ranking: icono, etiqueta a dos líneas y subrayado
     en la activa. Antes eran botones planos que se perdían sobre la tarjeta. */
  const rankingRegionTabs = useMemo(
    () => [
      { id: 'global' as const, label: 'Ranking', labelSecondary: 'global', icon: BarChart3 },
      ...MODALITY_ITEMS.map(({ key, label, surface }) => ({
        id: key,
        label,
        icon: surface === 'BEACH' ? IconBeach : IconGrass,
      })),
    ],
    []
  )

  const handleRankingViewChange = (view: RankingView) => {
    setActiveRankingView(view)
    // En las dos vistas se abre ordenado por posición en la región, que es lo
    // que se usa para el seeding.
    setTeamSortField('regionPosition')
    setTeamSortDirection('asc')
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

  /*
    Posición nacional en el ranking general de la temporada: mismo orden que
    /ranking/general, que ordena por la misma suma de las seis superficies.
    Sin puntos no hay posición.
  */
  const nationalPositionById = useMemo(() => {
    const posiciones = new Map<string, number>()
    if (!seasonPointsByTeam) return posiciones
    Object.entries(seasonPointsByTeam)
      .filter(([, puntos]) => puntos > 0)
      .sort(([, a], [, b]) => b - a)
      .forEach(([id], i) => posiciones.set(id, i + 1))
    return posiciones
  }, [seasonPointsByTeam])

  const globalTeams = useMemo(() => {
    if (!region?.teams) return []
    const base = [...region.teams]
      .map((team: { id: string; slug?: string; name: string; logo?: string; positions?: { count: number }[] }) => ({
        id: team.id,
        slug: team.slug,
        name: team.name,
        logo: team.logo,
        points: teamRankingPoints?.current[team.id] || 0,
        historicalPoints: teamRankingPoints?.historical[team.id] || 0,
        tournaments: team.positions?.[0]?.count || 0,
        nationalPosition: nationalPositionById.get(team.id) ?? null,
      }))

    // Posición en la región: el orden de puntos entre sus equipos, fijo,
    // independiente de la columna por la que se ordene la tabla.
    const regionPositionById = new Map<string, number>()
    base
      .filter(t => t.points > 0)
      .sort((a, b) => b.points - a.points)
      .forEach((t, i) => regionPositionById.set(t.id, i + 1))
    const list = base.map(t => ({ ...t, regionPosition: regionPositionById.get(t.id) ?? null }))

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
        case 'regionPosition':
          return comparePositions(a.regionPosition, b.regionPosition, teamSortDirection)
        case 'nationalPosition':
          return comparePositions(a.nationalPosition, b.nationalPosition, teamSortDirection)
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
  }, [region, teamRankingPoints, nationalPositionById, teamSortField, teamSortDirection])

  const modalityTeams = useMemo(() => {
    if (!modalityRankingData) return []

    const list = modalityRankingData.map((team, index) => ({
      id: team.team_id,
      // Ya viene en orden nacional y filtrada a la región: su índice es la
      // posición dentro de la región.
      regionPosition: (team.total_points || 0) > 0 ? index + 1 : null,
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
        case 'regionPosition':
          return comparePositions(a.regionPosition, b.regionPosition, teamSortDirection)
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

  const siteBase = resolveSiteBaseUrl()
  const regionPath = getRegionPublicUrl(region)
  const placeSchemaId = `${siteBase}${regionPath}#place`

  return (
    <PageContainer>
      <JsonLd
        dedupeById={placeSchemaId}
        data={[
          buildBreadcrumbListSchema(
            [{ name: 'Regiones', url: '/regiones' }, { name: region.name }],
            siteBase
          ),
          buildPlaceSchema(
            {
              name: region.name,
              slug: region.slug,
              id: region.id,
              description: `Equipos, campeonatos y coeficiente regional de ${region.name} en el ranking de Ultimate Frisbee FEDV.`,
              publicPath: regionPath,
            },
            siteBase
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
                label: `Total puntos ${selectedSeason}`,
                value: totalPoints,
              },
              {
                icon: TrendingUp,
                label: `Promedio ${selectedSeason}`,
                value: averagePoints,
              },
            ]}
          />
        }
      />

      {/*
        El ranking va primero: es la referencia que se usa para el seeding de
        los campeonatos regionales, así que es a lo que viene la gente. Antes
        quedaba por debajo de los coeficientes y de dos gráficas.
      */}
      <section className="mb-8" aria-labelledby="titulo-ranking-region">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="titulo-ranking-region" className="font-display text-xl font-semibold text-content">
              Ranking de {region.name}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-content-muted">
              Clasificación con los equipos de esta región únicamente, ordenados por su
              puntuación en el ranking nacional. Es la referencia que se usa para el
              seeding de los campeonatos regionales.
            </p>
          </div>
          {/* Controla toda la página: ranking y coeficientes a la vez. */}
          <RegionSeasonSelector seasons={availableSeasons} selectedSeason={selectedSeason} />
        </div>

        <RankingTabNav
          tabs={rankingRegionTabs}
          activeTab={activeRankingView}
          onTabChange={(id) => handleRankingViewChange(id as RankingView)}
          sticky={false}
          idPrefix="region-ranking"
          ariaLabel="Modalidad del ranking regional"
        />

        <div
          /* Sin `card`: DataTable ya trae su propio borde redondeado, y
             envolverlo dejaba dos bordes y dos redondeos concéntricos. Los
             estados de carga y vacío sí la necesitan, porque no tienen
             superficie propia. */
          className="mt-4"
          role="tabpanel"
          id={`region-ranking-panel-${activeRankingView}`}
          aria-labelledby={`region-ranking-tab-${activeRankingView}`}
        >
          {isRankingLoading ? (
            <div className="card flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-link mr-2" />
              <span className="text-sm text-content-subtle">Cargando clasificación...</span>
            </div>
          ) : seasonHasNoData ? (
            <div className="card">
              <EmptyState
                title={`Todavía no hay ranking para la temporada ${selectedSeason}`}
                description="Elige una temporada anterior en el selector."
              />
            </div>
          ) : displayedTeams.length === 0 ? (
            <div className="card">
              <EmptyState
                title="Sin datos"
                description={
                  isGlobalView
                    ? 'Esta región no tiene equipos registrados.'
                    : `No hay equipos de ${region.name} en el ranking de ${MODALITY_LABELS[activeRankingView as ModalityKey]}.`
                }
              />
            </div>
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
                  {/*
                    Etiqueta corta y explicación en el tooltip: el nombre completo
                    ocupaba tres líneas y ensanchaba las dos primeras columnas. El
                    tooltip va junto al botón de ordenar, no dentro: no se pueden
                    anidar botones.
                  */}
                  <DataTableHeaderCell>
                    <span className="inline-flex items-center">
                      <button
                        type="button"
                        onClick={() => handleTeamSort('regionPosition')}
                        className="inline-flex items-center gap-1.5 min-h-[44px] touch-manipulation hover:text-white/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      >
                        <span aria-hidden="true" className="whitespace-nowrap">Pos. región</span>
                        <span className="sr-only">Posición en la región</span>
                        {getTeamSortIcon('regionPosition')}
                      </button>
                      <InfoTooltip
                        variant="onDark"
                        content={`Puesto del equipo entre los equipos de ${region.name}, según sus puntos de la temporada ${selectedSeason}. Es la referencia para el seeding de los regionales.`}
                      />
                    </span>
                  </DataTableHeaderCell>
                  <DataTableHeaderCell>
                    <span className="inline-flex items-center">
                      <button
                        type="button"
                        onClick={() => handleTeamSort('nationalPosition')}
                        className="inline-flex items-center gap-1.5 min-h-[44px] touch-manipulation hover:text-white/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      >
                        <span aria-hidden="true" className="whitespace-nowrap">Pos. nacional</span>
                        <span className="sr-only">Posición en el ranking nacional</span>
                        {getTeamSortIcon('nationalPosition')}
                      </button>
                      <InfoTooltip
                        variant="onDark"
                        content={
                          isGlobalView
                            ? `Puesto del equipo en el ranking general nacional de la temporada ${selectedSeason}, entre todos los equipos de España.`
                            : `Puesto del equipo en el ranking nacional de ${MODALITY_LABELS[activeRankingView as ModalityKey]} de la temporada ${selectedSeason}, entre todos los equipos de España.`
                        }
                      />
                    </span>
                  </DataTableHeaderCell>
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
                      {isGlobalView ? `Puntos ${selectedSeason}` : 'Puntos'}
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
                          <PositionBadge position={team.regionPosition} />
                        </DataTableCell>
                        <DataTableCell>
                          <PositionBadge position={team.nationalPosition} />
                        </DataTableCell>
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
                          <PositionBadge position={team.regionPosition} />
                        </DataTableCell>
                        <DataTableCell>
                          <PositionBadge position={team.nationalPosition} />
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
      </section>

      <div className="card mb-8">
        <h2 className="font-display text-lg font-semibold text-content mb-4">Coeficientes por temporada</h2>
        {/* El selector vive arriba, en la cabecera del ranking, y controla
            toda la página. Aquí solo queda la explicación de la regla. */}
        <p className="text-sm text-content-muted">
          Calculado con datos hasta <strong>{breakdown?.calculationSeason || coefficientSeason}</strong> → aplica
          a regionales <strong>{breakdown?.appliesToSeason || selectedSeason}</strong>
        </p>

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

      <div className="grid grid-cols-1 gap-8 mb-8 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-display text-lg font-semibold text-content mb-4">Ranking general {selectedSeason}</h2>
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
