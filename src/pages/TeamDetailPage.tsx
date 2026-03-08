import React, { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Users, MapPin, Trophy, Calendar, TrendingUp, BarChart3, Mail, Award, Target, History } from 'lucide-react'
import { teamDetailService, TeamDetailData } from '@/services/teamDetailService'
import { teamsService, tournamentsService } from '@/services/apiService'
import TeamLogo from '@/components/ui/TeamLogo'
import GeneralRankingChart from '@/components/charts/GeneralRankingChart'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import EmptyState from '@/components/ui/EmptyState'
import Tabs, { TabItem } from '@/components/ui/Tabs'
import StickyHeader from '@/components/ui/StickyHeader'
import ShareButton from '@/components/ui/ShareButton'
import TournamentTable from '@/components/ui/TournamentTable'

const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [teamData, setTeamData] = useState<TeamDetailData | null>(null)
  const [relatedTeams, setRelatedTeams] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview')
  const [chartMetric, setChartMetric] = useState<'position' | 'points'>('position')
  const [compareWithTeamId, setCompareWithTeamId] = useState<string>('')

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
    loadTeamData()
  }, [id])

  const loadTeamData = async () => {
    if (!id) {
      console.warn('[TeamDetailPage] No se proporcionó ID de equipo')
      return
    }
    
    console.log(`[TeamDetailPage] Cargando datos del equipo con ID: "${id}"`)
    setIsLoading(true)
    
    try {
      // Cargar datos detallados del equipo
      const data = await teamDetailService.getTeamDetailData(id)
      console.log('[TeamDetailPage] Datos del equipo cargados exitosamente:', data?.team?.name)
      setTeamData(data)
      
      // Cargar equipos relacionados
      try {
        const related = await teamDetailService.getRelatedTeams(id)
        setRelatedTeams(related)
      } catch (relatedError) {
        // Si falla obtener equipos relacionados, no es crítico
        console.warn('[TeamDetailPage] Error al cargar equipos relacionados:', relatedError)
        setRelatedTeams([])
      }
    } catch (error: any) {
      console.error('[TeamDetailPage] Error al cargar datos del equipo:', {
        id,
        error: error?.message,
        code: error?.code,
        stack: error?.stack
      })
      
      // Si el error indica que el equipo no existe, no establecer teamData
      // para que se muestre el mensaje de "Equipo no encontrado"
      if (error?.message?.includes('no encontrado') || 
          error?.code === 'PGRST116' || 
          error?.code === 'NOT_FOUND' ||
          error?.message?.includes('NOT_FOUND') ||
          error?.message?.includes('No rows returned')) {
        console.warn(`[TeamDetailPage] Equipo con ID "${id}" no encontrado`)
        setTeamData(null)
      } else {
        // Para otros errores, también mostrar el mensaje de no encontrado
        console.error('[TeamDetailPage] Error desconocido al cargar equipo:', error)
        setTeamData(null)
      }
    } finally {
      setIsLoading(false)
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
    if (position === 2) return 'bg-gray-100 text-gray-800'
    if (position === 3) return 'bg-orange-100 text-orange-800'
    return 'bg-blue-100 text-blue-800'
  }

  const getSurfaceIcon = (surface: string) => {
    return surface === 'BEACH' ? '🏖️' : '🌱'
  }

  const getModalityIcon = (modality: string) => {
    switch (modality) {
      case 'OPEN': return '👨‍👨‍👦'
      case 'WOMEN': return '👩‍👩‍👧'
      case 'MIXED': return '👨‍👩‍👧‍👦'
      default: return '👥'
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: 'Equipos', href: '/teams' }, { label: 'Cargando...' }]} />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <span className="text-gray-600">Cargando información del equipo...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!teamData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: 'Equipos', href: '/teams' }, { label: 'No encontrado' }]} />
        <div className="mt-8">
          <EmptyState
            icon={Users}
            title="Equipo no encontrado"
            description="El equipo que buscas no existe o ha sido eliminado."
            action={{
              label: "Volver a equipos",
              onClick: () => window.location.href = '/teams'
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
          {/* Team Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Trophy className="h-7 w-7 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Torneos Ganados</p>
                  <p className="text-3xl font-bold text-gray-900">{statistics.tournamentsWon}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Target className="h-7 w-7 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ranking global</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {statistics.globalPosition ? `#${statistics.globalPosition}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Calendar className="h-7 w-7 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Torneos</p>
                  <p className="text-3xl font-bold text-gray-900">{statistics.totalTournaments}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Award className="h-7 w-7 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Podios</p>
                  <p className="text-3xl font-bold text-gray-900">{statistics.podiums}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Team Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Información del Equipo</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">Tipo:</span>
                  <span className="ml-2 font-medium">
                    {team.isFilial ? 'Equipo Filial' : 'Equipo Principal'}
                  </span>
                </div>
                
                {team.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-600">Ubicación:</span>
                    <span className="ml-2 font-medium">{team.location}</span>
                  </div>
                )}
                
                {team.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-600">Email:</span>
                    <a href={`mailto:${team.email}`} className="ml-2 font-medium text-primary-600 hover:text-primary-700">
                      {team.email}
                    </a>
                  </div>
                )}
                
                {team.hasDifferentNames && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Nombres por Categoría:</h4>
                    <div className="space-y-1 text-sm">
                      {team.nameOpen && <div><span className="text-gray-600">Open:</span> {team.nameOpen}</div>}
                      {team.nameWomen && <div><span className="text-gray-600">Women:</span> {team.nameWomen}</div>}
                      {team.nameMixed && <div><span className="text-gray-600">Mixed:</span> {team.nameMixed}</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Estadísticas Detalladas</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600 font-medium">Mejor posición global:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {statistics.bestPosition > 0 ? `#${statistics.bestPosition}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600 font-medium">Peor posición global:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {statistics.worstPosition > 0 ? `#${statistics.worstPosition}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600 font-medium">Acumulación histórica:</span>
                  <span className="text-sm font-semibold text-gray-900">{statistics.totalPoints.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600 font-medium">Temporadas activas:</span>
                  <span className="text-sm font-semibold text-gray-900">{statistics.seasonsActive}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600 font-medium">Categorías jugadas:</span>
                  <span className="text-sm font-semibold text-gray-900">{statistics.categoriesPlayed.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Related Teams */}
          {relatedTeams.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Equipos Relacionados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedTeams.map((relatedTeam) => (
                  <Link
                    key={relatedTeam.id}
                    to={`/teams/${relatedTeam.id}`}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <TeamLogo name={relatedTeam.name} size="sm" />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{relatedTeam.name}</div>
                      <div className="text-xs text-gray-500">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Rankings por Superficie</h3>
          {Object.keys(currentRankings).length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No hay rankings disponibles"
              description="Este equipo aún no tiene rankings registrados en ninguna categoría."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posición
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Puntos
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cambio
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(currentRankings).map(([category, ranking]) => (
                    <tr key={category}>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="mr-2">{getSurfaceIcon(category.split('_')[0])}</span>
                          <span className="mr-2">{getModalityIcon(category.split('_')[1])}</span>
                          <span className="text-sm font-medium text-gray-900">
                            {getCategoryLabel(category)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">#{ranking.position}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{ranking.points.toFixed(1)}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {ranking.change !== 0 ? (
                          <span className={`text-sm font-medium ${ranking.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {ranking.change > 0 ? '+' : ''}{ranking.change}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Ver por:</span>
                <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => setChartMetric('position')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      chartMetric === 'position'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Posición
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetric('points')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      chartMetric === 'points'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Puntos
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="compare-team" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Comparar con:
                </label>
                <select
                  id="compare-team"
                  value={compareWithTeamId}
                  onChange={(e) => setCompareWithTeamId(e.target.value)}
                  className="block w-full sm:w-56 rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Posición del equipo por torneo y temporada</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border-r border-gray-200 w-48">Competición</th>
                    {seasons.map((year: number) => (
                      <th key={year} className="px-3 py-3 text-center font-medium text-gray-700 border-r border-gray-200 last:border-r-0 min-w-[4rem]">
                        {formatSeason(year)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {seasons.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-gray-500">No hay datos de torneos.</td>
                    </tr>
                  ) : rowKeys.map(({ surface, modality, type }) => (
                    <tr key={`${surface}-${modality}-${type}`} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900 border-r border-gray-200 whitespace-nowrap">
                        {SURFACE_LABEL[surface]} – {MODALITY_LABEL[modality]} – {TYPE_LABEL[type]}
                      </td>
                      {seasons.map((year: number) => {
                        const cell = getCell(year, surface, modality, type)
                        return (
                          <td key={year} className="px-3 py-2 text-center border-r border-gray-100 last:border-r-0">
                            {cell === '✕' ? (
                              <span className="text-gray-400 font-medium" title="El torneo no se disputó">✕</span>
                            ) : cell === 'No p.' ? (
                              <span className="text-gray-500 text-xs" title="El equipo no participó">No p.</span>
                            ) : typeof cell === 'number' && cell <= 3 ? (
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border ${
                                  cell === 1
                                    ? 'bg-amber-400 text-gray-900 border-amber-500'
                                    : cell === 2
                                    ? 'bg-gray-300 text-gray-800 border-gray-400'
                                    : 'bg-amber-700 text-white border-amber-800'
                                }`}
                                title={`${cell}º puesto`}
                              >
                                {cell}
                              </span>
                            ) : (
                              <span className="font-medium text-gray-900">{cell}º</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-700">Leyenda:</p>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">Desglose por Temporadas</h3>
          {seasonBreakdown.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No hay datos de temporadas"
              description="Este equipo aún no tiene datos registrados por temporadas."
            />
          ) : (
            <div className="space-y-4">
              {seasonBreakdown.map((season) => (
                <div key={season.season} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
                    <h4 className="text-md font-medium text-gray-900">{season.season}</h4>
                    <span className="text-sm font-medium text-gray-600">
                      {season.totalPoints.toFixed(1)} puntos totales
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(season.categories).map(([category, data]) => (
                      <div key={category} className="bg-gray-50 rounded p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            {getCategoryLabel(category)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {getSurfaceIcon(category.split('_')[0])} {getModalityIcon(category.split('_')[1])}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
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
        actions={
          <ShareButton
            url={`/teams/${team.id}`}
            title={`${team.name} - Ranking FEDV`}
            description={`Consulta las estadísticas y resultados de ${team.name} en el Ranking FEDV`}
          />
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs 
            items={[
              { label: 'Equipos', href: '/teams' },
              { label: team.name }
            ]} 
          />
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/teams"
              className="flex items-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 p-2"
              aria-label="Volver a la lista de equipos"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Volver a equipos</span>
            </Link>
            <ShareButton
              url={`/teams/${team.id}`}
              title={`${team.name} - Ranking FEDV`}
              description={`Consulta las estadísticas y resultados de ${team.name} en el Ranking FEDV`}
            />
          </div>
          
          {/* Team Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 mb-6">
            <TeamLogo
              logo={team.logo}
              name={team.name}
              size="xl"
              className="h-32 w-32 sm:h-40 sm:w-40"
            />
            <div className="text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{team.name}</h1>
              <p className="text-base sm:text-lg text-gray-600 mb-1">
                {team.isFilial && team.parentTeam ? (
                  <>Equipo filial de <Link to={`/teams/${team.parentTeamId}`} className="font-medium text-primary-600 hover:text-primary-700 underline">{team.parentTeam.name}</Link></>
                ) : (
                  team.location || team.region?.name || 'Sin ubicación'
                )}
              </p>
              {team.region && (
                <p className="text-sm text-gray-500">
                  Región: {team.region.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          items={tabItems}
          defaultTab={activeTab}
          onChange={handleTabChange}
          variant="underline"
        />
      </div>
    </>
  )
}

export default TeamDetailPage
