import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, UsersRound, MapPin, Trophy, Calendar, TrendingUp, BarChart3, Mail, Award, Target, History, Sun, Leaf, UserRound } from 'lucide-react'
import { teamDetailService, TeamDetailData, prefetchTeamDetail } from '@/services/teamDetailService'
import { teamsService, tournamentsService, getTeamPublicUrl } from '@/services/apiService'
import PageHeroShell from '@/components/layout/PageHeroShell'
import PageHeroStatsBar from '@/components/layout/PageHeroStatsBar'
import TeamLogo from '@/components/ui/TeamLogo'
import GeneralRankingChart from '@/components/charts/GeneralRankingChart'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import EmptyState from '@/components/ui/EmptyState'
import Tabs, { TabItem } from '@/components/ui/Tabs'
import StickyHeader from '@/components/ui/StickyHeader'
import ShareButton from '@/components/ui/ShareButton'
import TournamentTable from '@/components/ui/TournamentTable'
import DetailHeaderSkeleton from '@/components/ui/DetailHeaderSkeleton'
import TabsSkeleton from '@/components/ui/TabsSkeleton'
import TableSkeleton from '@/components/ui/TableSkeleton'

interface TeamRedirectState {
  resolvedTeamId?: string
  canonicalSlug?: string
}

const TeamDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [teamData, setTeamData] = useState<TeamDetailData | null>(null)
  const [relatedTeams, setRelatedTeams] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview')
  const [chartMetric, setChartMetric] = useState<'position' | 'points'>('position')
  const [compareWithTeamId, setCompareWithTeamId] = useState<string>('')
  const loadIdRef = useRef(0)

  const { data: teamsResponse } = useQuery({
    queryKey: ['teams-list-all'],
    queryFn: () => teamsService.getAll({})
  })
  const allTeams = teamsResponse?.data ?? []

  const { data: historicoTournamentsData } = useQuery({
    queryKey: ['historico-tournaments'],
    queryFn: async () => {
      const res = await tournamentsService.getForHistorico()
      if (!res.success || !res.data) return []
      return res.data as Array<{ id: string; year: number; surface: string; modality: string; type: string; teamCount: number }>
    }
  })
  const historicoTournaments = historicoTournamentsData ?? []

  useEffect(() => {
    setTeamData(null)
    setRelatedTeams([])
    setIsLoading(true)
    loadTeamData()
  }, [slug])

  const loadTeamData = async () => {
    if (!slug) {
      console.warn('[TeamDetailPage] No se proporcionó slug de equipo')
      setIsLoading(false)
      return
    }

    const loadId = ++loadIdRef.current
    let redirected = false

    setIsLoading(true)

    try {
      const redirectState = location.state as TeamRedirectState | null
      let teamId: string

      if (
        redirectState?.resolvedTeamId &&
        redirectState.canonicalSlug === slug
      ) {
        teamId = redirectState.resolvedTeamId
        const qs = searchParams.toString()
        navigate(`${location.pathname}${qs ? `?${qs}` : ''}`, { replace: true, state: null })
      } else {
        const teamRef = await teamsService.resolveTeam(slug)

        if (loadId !== loadIdRef.current) return

        if (teamRef.slug && teamRef.slug !== slug) {
          const qs = searchParams.toString()
          const target = `/equipos/${teamRef.slug}${qs ? `?${qs}` : ''}`
          redirected = true
          prefetchTeamDetail(teamRef.id)
          navigate(target, {
            replace: true,
            state: { resolvedTeamId: teamRef.id, canonicalSlug: teamRef.slug },
          })
          return
        }

        teamId = teamRef.id
      }

      const data = await prefetchTeamDetail(teamId)

      if (loadId !== loadIdRef.current) return

      setTeamData(data)

      try {
        const related = await teamDetailService.getRelatedTeams(teamId)
        setRelatedTeams(related)
      } catch (relatedError) {
        console.warn('[TeamDetailPage] Error al cargar equipos relacionados:', relatedError)
        setRelatedTeams([])
      }
    } catch (error: any) {
      console.error('[TeamDetailPage] Error al cargar datos del equipo:', {
        slug,
        error: error?.message,
        code: error?.code,
        stack: error?.stack
      })

      if (error?.message?.includes('no encontrado') ||
          error?.code === 'PGRST116' ||
          error?.code === 'NOT_FOUND' ||
          error?.message?.includes('NOT_FOUND') ||
          error?.message?.includes('No rows returned')) {
        console.warn(`[TeamDetailPage] Equipo con slug "${slug}" no encontrado`)
        setTeamData(null)
      } else {
        console.error('[TeamDetailPage] Error desconocido al cargar equipo:', error)
        setTeamData(null)
      }
    } finally {
      if (loadId === loadIdRef.current && !redirected) {
        setIsLoading(false)
      }
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      'beach_mixed': 'Playa Mixto',
      'beach_open': 'Playa Open',
      'beach_women': 'Playa Women',
      'grass_mixed': 'Césped Mixto',
      'grass_open': 'Césped Open',
      'grass_women': 'Césped Women'
    }
    return labels[category] || category
  }

  const getTournamentTypeLabel = (type: string) => {
    switch (type) {
      case 'CE1': return 'Campeonato España 1ª División'
      case 'CE2': return 'Campeonato España 2ª División'
      case 'REGIONAL': return 'Campeonato Regional'
      case 'INTERNATIONAL': return 'Torneo Internacional'
      default: return type
    }
  }

  const getPositionColor = (position: number) => {
    if (position === 1) return 'bg-yellow-100 text-yellow-800'
    if (position === 2) return 'bg-slate-100 text-slate-800'
    if (position === 3) return 'bg-orange-100 text-orange-800'
    return 'bg-primary-100 text-primary-800'
  }

  const getSurfaceIcon = (surface: string) => {
    return surface === 'BEACH'
      ? <Sun className="w-4 h-4 text-primary-600 inline" />
      : <Leaf className="w-4 h-4 text-emerald-600 inline" />
  }

  const getModalityIcon = (modality: string) => {
    switch (modality) {
      case 'OPEN':
        return <UsersRound className="w-4 h-4 text-slate-600 inline" />
      case 'WOMEN':
        return <UserRound className="w-4 h-4 text-slate-600 inline" />
      case 'MIXED':
        return <UsersRound className="w-4 h-4 text-primary-600 inline" />
      default:
        return <UsersRound className="w-4 h-4 text-slate-600 inline" />
    }
  }

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId })
    // Scroll to top when changing tabs
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isLoading) {
    return (
      <>
        <DetailHeaderSkeleton variant="team" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <TabsSkeleton count={5} />
          <TableSkeleton rows={6} columns={5} showLeadingAvatar />
        </div>
      </>
    )
  }

  if (!teamData) {
    return (
      <div className="page-container pt-[calc(4.75rem+2rem)]">
        <Breadcrumbs items={[{ label: 'Equipos', href: '/equipos' }, { label: 'No encontrado' }]} />
        <div className="mt-8">
          <EmptyState
            icon={UsersRound}
            title="Equipo no encontrado"
            description="El equipo que buscas no existe o ha sido eliminado."
            action={{
              label: "Volver a equipos",
              onClick: () => window.location.href = '/equipos'
            }}
          />
        </div>
      </div>
    )
  }

  const { team, currentRankings, tournamentResults, rankingHistory, seasonBreakdown, statistics } = teamData

  // Preparar tabs
  const tabItems: TabItem[] = [
    {
      id: 'overview',
      label: 'Resumen',
      icon: BarChart3,
      content: (
        <div className="space-y-6">
          {/* Team Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Información del Equipo</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <UsersRound className="h-4 w-4 text-slate-400 mr-3" />
                  <span className="text-slate-600">Tipo:</span>
                  <span className="ml-2 font-medium">
                    {team.isFilial ? 'Equipo Filial' : 'Equipo Principal'}
                  </span>
                </div>
                
                {team.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-slate-400 mr-3" />
                    <span className="text-slate-600">Ubicación:</span>
                    <span className="ml-2 font-medium">{team.location}</span>
                  </div>
                )}
                
                {team.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-slate-400 mr-3" />
                    <span className="text-slate-600">Email:</span>
                    <a href={`mailto:${team.email}`} className="ml-2 font-medium text-primary-600 hover:text-primary-700">
                      {team.email}
                    </a>
                  </div>
                )}
                
                {team.hasDifferentNames && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Nombres por Categoría:</h4>
                    <div className="space-y-1 text-sm">
                      {team.nameOpen && <div><span className="text-slate-600">Open:</span> {team.nameOpen}</div>}
                      {team.nameWomen && <div><span className="text-slate-600">Women:</span> {team.nameWomen}</div>}
                      {team.nameMixed && <div><span className="text-slate-600">Mixed:</span> {team.nameMixed}</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Estadísticas Detalladas</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600 font-medium">Mejor posición global:</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {statistics.bestPosition > 0 ? `#${statistics.bestPosition}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600 font-medium">Peor posición global:</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {statistics.worstPosition > 0 ? `#${statistics.worstPosition}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600 font-medium">Acumulación histórica:</span>
                  <span className="text-sm font-semibold text-slate-900">{statistics.totalPoints.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600 font-medium">Temporadas activas:</span>
                  <span className="text-sm font-semibold text-slate-900">{statistics.seasonsActive}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-600 font-medium">Categorías jugadas:</span>
                  <span className="text-sm font-semibold text-slate-900">{statistics.categoriesPlayed.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Related Teams */}
          {relatedTeams.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Equipos Relacionados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedTeams.map((relatedTeam) => (
                  <Link
                    key={relatedTeam.id}
                    to={getTeamPublicUrl(relatedTeam)}
                    className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-secondary-50 transition-colors"
                  >
                    <TeamLogo name={relatedTeam.name} size="sm" />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-slate-900">{relatedTeam.name}</div>
                      <div className="text-xs text-slate-500">
                        {relatedTeam.isFilial ? 'Filial' : 'Principal'}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'rankings',
      label: 'Rankings',
      icon: Trophy,
      badge: Object.keys(currentRankings).length,
      content: (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-xl font-semibold text-slate-900 mb-6">Rankings por Superficie</h3>
          {Object.keys(currentRankings).length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No hay rankings disponibles"
              description="Este equipo aún no tiene rankings registrados en ninguna categoría."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Posición
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Puntos
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Cambio
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {Object.entries(currentRankings)
                    .sort(([, a], [, b]) => a.position - b.position)
                    .map(([category, ranking]) => (
                    <tr key={category}>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="mr-2">{getSurfaceIcon(category.split('_')[0])}</span>
                          <span className="mr-2">{getModalityIcon(category.split('_')[1])}</span>
                          <span className="text-sm font-medium text-slate-900">
                            {getCategoryLabel(category)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-900">#{ranking.position}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-900">{ranking.points.toFixed(1)}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {ranking.change !== 0 ? (
                          <span className={`text-sm font-medium ${ranking.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {ranking.change > 0 ? '+' : ''}{ranking.change}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'tournaments',
      label: 'Torneos',
      icon: Calendar,
      badge: tournamentResults.length,
      content: (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <TournamentTable
            results={tournamentResults}
            getCategoryLabel={getCategoryLabel}
            getTournamentTypeLabel={getTournamentTypeLabel}
            getPositionColor={getPositionColor}
            getSurfaceIcon={getSurfaceIcon}
            getModalityIcon={getModalityIcon}
            viewMode="table"
          />
        </div>
      )
    },
    {
      id: 'history',
      label: 'Progresión',
      icon: TrendingUp,
      content: (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Ver por:</span>
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-secondary-50">
                  <button
                    type="button"
                    onClick={() => setChartMetric('position')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      chartMetric === 'position'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Posición
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetric('points')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      chartMetric === 'points'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Puntos
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="compare-team" className="text-sm font-medium text-slate-700 whitespace-nowrap">
                  Comparar con:
                </label>
                <select
                  id="compare-team"
                  value={compareWithTeamId}
                  onChange={(e) => setCompareWithTeamId(e.target.value)}
                  className="input-field text-sm w-full sm:w-56"
                >
                  <option value="">Ninguno</option>
                  {allTeams
                    .filter((t: { id: string }) => t.id !== team.id)
                    .map((t: { id: string; name: string }) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            {!compareWithTeamId && (
              <p className="text-sm text-slate-500 mb-4">
                Selecciona un equipo para comparar su evolución en el ranking.
              </p>
            )}
            <GeneralRankingChart
              teamId={team.id}
              teamName={team.name}
              height={400}
              showPoints={chartMetric === 'points'}
              useDynamicData={true}
              metric={chartMetric}
              compareWithTeamId={compareWithTeamId || undefined}
              compareWithTeamName={compareWithTeamId ? allTeams.find((t: { id: string }) => t.id === compareWithTeamId)?.name : undefined}
            />
          </div>
        </div>
      )
    },
    {
      id: 'historico',
      label: 'Histórico',
      icon: History,
      content: (() => {
        const SURFACES = ['BEACH', 'GRASS'] as const
        const MODALITIES = ['MIXED', 'WOMEN', 'OPEN'] as const
        const TYPES = ['CE1', 'CE2', 'REGIONAL'] as const
        const TYPE_LABEL: Record<string, string> = { CE1: '1Div', CE2: '2Div', REGIONAL: 'Regs' }
        const SURFACE_LABEL: Record<string, string> = { BEACH: 'Playa', GRASS: 'Césped' }
        const MODALITY_LABEL: Record<string, string> = { MIXED: 'Mixto', WOMEN: 'Women', OPEN: 'Open' }
        const formatSeason = (year: number) => `${year}-${String((year + 1) % 100).padStart(2, '0')}`
        const seasons = Array.from(new Set(historicoTournaments.map((t: { year: number }) => t.year))).sort((a, b) => b - a)
        const existingCells = new Set(historicoTournaments.map((t: { year: number; surface: string; modality: string; type: string }) => `${t.year}-${t.surface}-${t.modality}-${t.type}`))
        const teamPositionByCell: Record<string, number> = {}
        tournamentResults.forEach((r: { year: number; surface: string; category: string; type: string; position: number }) => {
          const key = `${r.year}-${r.surface}-${r.category}-${r.type}`
          teamPositionByCell[key] = r.position
        })
        const getCell = (year: number, surface: string, modality: string, type: string): number | '✕' | 'No p.' => {
          const key = `${year}-${surface}-${modality}-${type}`
          if (!existingCells.has(key)) return '✕'
          if (teamPositionByCell[key] == null) return 'No p.'
          return teamPositionByCell[key]
        }
        // Césped no tiene regionales; solo Playa tiene Regs
        const typesForSurface = (surface: string) => surface === 'GRASS' ? (['CE1', 'CE2'] as const) : TYPES
        const rowKeys = SURFACES.flatMap(surface =>
          MODALITIES.flatMap(modality =>
            typesForSurface(surface).map(type => ({ surface, modality, type }))
          )
        )
        return (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Posición del equipo por torneo y temporada</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-secondary-50">
                    <th className="px-4 py-3 text-left font-medium text-slate-700 border-r border-slate-200 w-48">Competición</th>
                    {seasons.map((year: number) => (
                      <th key={year} className="px-3 py-3 text-center font-medium text-slate-700 border-r border-slate-200 last:border-r-0 min-w-[4rem]">
                        {formatSeason(year)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {seasons.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-slate-500">No hay datos de torneos.</td>
                    </tr>
                  ) : rowKeys.map(({ surface, modality, type }) => (
                    <tr key={`${surface}-${modality}-${type}`} className="border-b border-slate-100 hover:bg-secondary-50">
                      <td className="px-4 py-2 font-medium text-slate-900 border-r border-slate-200 whitespace-nowrap">
                        {SURFACE_LABEL[surface]} – {MODALITY_LABEL[modality]} – {TYPE_LABEL[type]}
                      </td>
                      {seasons.map((year: number) => {
                        const cell = getCell(year, surface, modality, type)
                        return (
                          <td key={year} className="px-3 py-2 text-center border-r border-slate-100 last:border-r-0">
                            {cell === '✕' ? (
                              <span className="text-slate-400 font-medium" title="El torneo no se disputó">✕</span>
                            ) : cell === 'No p.' ? (
                              <span className="text-slate-500 text-xs" title="El equipo no participó">No p.</span>
                            ) : typeof cell === 'number' && cell <= 3 ? (
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border ${
                                  cell === 1
                                    ? 'bg-amber-400 text-slate-900 border-amber-500'
                                    : cell === 2
                                    ? 'bg-slate-300 text-slate-800 border-slate-400'
                                    : 'bg-amber-700 text-white border-amber-800'
                                }`}
                                title={`${cell}º puesto`}
                              >
                                {cell}
                              </span>
                            ) : (
                              <span className="font-medium text-slate-900">{cell}º</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 text-sm text-slate-600 space-y-1">
              <p className="font-medium text-slate-700">Leyenda:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li><strong>Círculo dorado (1), plateado (2) o bronce (3):</strong> medalla (1º, 2º o 3º puesto).</li>
                <li><strong>Número (4º en adelante):</strong> posición en la que quedó este equipo en ese torneo.</li>
                <li><strong>✕</strong> (cruz gris): el torneo no existió o no se disputó en esa temporada.</li>
                <li><strong>No p.:</strong> el torneo sí se disputó pero este equipo no participó.</li>
              </ul>
            </div>
          </div>
        )
      })()
    },
    {
      id: 'seasons',
      label: 'Temporadas',
      icon: Calendar,
      badge: seasonBreakdown.length,
      content: (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
          <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-6">Desglose por Temporadas</h3>
          {seasonBreakdown.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No hay datos de temporadas"
              description="Este equipo aún no tiene datos registrados por temporadas."
            />
          ) : (
            <div className="space-y-4">
              {seasonBreakdown.map((season) => (
                <div key={season.season} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
                    <h4 className="text-md font-medium text-slate-900">{season.season}</h4>
                    <span className="text-sm font-medium text-slate-600">
                      {season.totalPoints.toFixed(1)} puntos totales
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(season.categories).map(([category, data]) => (
                      <div key={category} className="bg-secondary-50 rounded p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700">
                            {getCategoryLabel(category)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {getSurfaceIcon(category.split('_')[0])} {getModalityIcon(category.split('_')[1])}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600">
                          <div>{data.points.toFixed(1)} puntos</div>
                          <div>{data.tournaments} torneos</div>
                          <div>Mejor: {data.bestPosition}º</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }
  ]

  const tabsForSticky = tabItems.map(tab => ({
    id: tab.id,
    label: tab.label,
    icon: tab.icon,
    badge: typeof tab.badge === 'number' ? tab.badge : undefined
  }))

  const globalRankingPoints = Object.values(currentRankings).reduce((sum, ranking) => sum + ranking.points, 0)

  const shareButton = (
    <ShareButton
      url={getTeamPublicUrl(team)}
      title={`${team.name} - Ranking FEDV`}
      description={`Consulta las estadísticas y resultados de ${team.name} en el Ranking FEDV`}
      variant="dark"
      size="sm"
    />
  )

  return (
    <>
      {/* Sticky Header */}
      <StickyHeader
        teamName={team.name}
        teamLogo={team.logo}
        globalPosition={statistics.globalPosition}
        totalPoints={statistics.totalPoints}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={tabsForSticky}
        actions={shareButton}
      />

      <PageHeroShell className="mb-0 border-b border-slate-800" innerClassName="pb-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Breadcrumbs
                variant="dark"
                items={[
                  { label: 'Equipos', href: '/equipos' },
                  { label: team.name },
                ]}
              />
            </div>
            {shareButton}
          </div>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-10">
            <div className="team-logo-arcs h-24 w-24 sm:h-28 sm:w-28">
              <TeamLogo
                logo={team.logo}
                name={team.name}
                size="xl"
                className="relative z-10 h-24 w-24 sm:h-28 sm:w-28 ring-4 ring-white/20 shadow-sm"
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="mb-2 font-display text-3xl font-bold text-white sm:text-4xl">{team.name}</h1>
              <p className="mb-1 text-slate-400">
                {team.isFilial && team.parentTeam ? (
                  <>Equipo filial de{' '}
                    <Link to={getTeamPublicUrl(team.parentTeam)} className="font-medium text-primary-300 hover:text-primary-200">
                      {team.parentTeam.name}
                    </Link>
                  </>
                ) : (
                  team.location || team.region?.name || 'Sin ubicación'
                )}
              </p>
              {team.region && (
                <p className="text-sm text-slate-500">Región: {team.region.name}</p>
              )}
            </div>
            <div className="flex flex-shrink-0 gap-6 sm:gap-10">
              <div className="text-center sm:text-right">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                  Ranking global
                </p>
                <p className="font-display text-4xl font-bold text-white sm:text-5xl">
                  {statistics.globalPosition ? `#${statistics.globalPosition}` : 'N/A'}
                </p>
              </div>
              <div className="text-center sm:text-right">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                  Puntos
                </p>
                <p className="font-display text-4xl font-bold text-primary-300 sm:text-5xl">
                  {globalRankingPoints > 0 ? globalRankingPoints.toFixed(1) : statistics.totalPoints.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
          <div className="hero-stats-bar-divider">
            <PageHeroStatsBar
              items={[
                {
                  icon: Calendar,
                  label: 'Torneos',
                  value: statistics.totalTournaments,
                },
                {
                  icon: Award,
                  label: 'Podios',
                  value: statistics.podiums,
                },
                {
                  icon: Trophy,
                  label: 'Torneos ganados',
                  value: statistics.tournamentsWon,
                },
                {
                  icon: Target,
                  label: 'Mejor posición',
                  value: statistics.bestPosition > 0 ? `#${statistics.bestPosition}` : 'N/A',
                },
              ]}
            />
          </div>
      </PageHeroShell>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
        <Tabs
          items={tabItems}
          defaultTab={activeTab}
          onChange={handleTabChange}
          variant="pills"
        />
        </div>
      </div>
    </>
  )
}

export default TeamDetailPage
