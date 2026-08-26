import { useMemo, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, UsersRound, MapPin, Trophy, Grid, List, Shield } from 'lucide-react'
import { teamsService, regionsService, getTeamPublicUrl } from '@/services/apiService'
import { homePageService } from '@/services/homePageService'
import hybridRankingService from '@/services/hybridRankingService'
import teamSeasonRankingsService from '@/services/teamSeasonRankingsService'
import { supabase } from '@/services/supabaseService'
import { ALL_RANKING_SURFACES } from '@/utils/coefficientCalculator'
import { useViewMode } from '@/hooks/useViewMode'
import { useUrlState, useUrlDebouncedState, useUrlBatch, useUrlNumberState } from '@/hooks/useUrlState'
import TeamLogo from '@/components/ui/TeamLogo'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import EmptyState from '@/components/ui/EmptyState'
import Pagination from '@/components/ui/Pagination'
import TableSkeleton from '@/components/ui/TableSkeleton'
import CardSkeleton from '@/components/ui/CardSkeleton'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import PageHeroStatsBar from '@/components/layout/PageHeroStatsBar'
import DataTable from '@/components/ui/DataTable'
import TableColumnFilter from '@/components/ui/TableColumnFilter'
import TeamModalityNames from '@/components/teams/TeamModalityNames'
import { getTeamModalityNameEntries } from '@/utils/teamNames'
import { formatPoints } from '@/utils/rankingCalculations'
import { usePageMeta } from '@/hooks/usePageMeta'

type SortField = 'name' | 'region' | 'location' | 'points' | 'historicalPoints'
type SortDirection = 'asc' | 'desc'

const ORDEN_POR_DEFECTO: SortField = 'name'
const DIRECCION_POR_DEFECTO: SortDirection = 'asc'
const POR_PAGINA_POR_DEFECTO = 20

const filterSelectClass =
  'h-7 w-full min-w-[5.5rem] rounded-md border border-line bg-surface px-2 text-xs text-content-muted focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400'

/** Misma fórmula que el ranking histórico general: suma de puntos base sin coeficientes temporales. */
const sumHistoricalPointsFromRow = (row: Record<string, unknown>): number =>
  ALL_RANKING_SURFACES.reduce(
    (sum, surface) => sum + (Number(row[`${surface}_points`]) || 0),
    0
  )

const TeamsPage = () => {
  usePageMeta({ title: 'Equipos', description: 'Todos los equipos de ultimate frisbee de España, con su región y su posición en el ranking FEDV.' })

  const navigate = useNavigate()
  const [teamSearch, setTeamSearch, teamSearchEnUrl] = useUrlDebouncedState('q')
  const [locationSearch, setLocationSearch, locationSearchEnUrl] = useUrlDebouncedState('ubicacion')
  const [selectedRegion, setSelectedRegion] = useUrlState<string>('region', '')
  const [sortField] = useUrlState<SortField>('orden', ORDEN_POR_DEFECTO)
  const [sortDirection] = useUrlState<SortDirection>('dir', DIRECCION_POR_DEFECTO)
  const escribirUrl = useUrlBatch()
  // La página también va en la URL: volver de una ficha a la página 1 cuando
  // estabas en la 3 es la misma molestia que perder el filtro.
  const [currentPage, setCurrentPage] = useUrlNumberState('pagina', 1)
  const [itemsPerPage] = useUrlNumberState('por-pagina', POR_PAGINA_POR_DEFECTO)
  const [viewMode, setViewMode] = useViewMode()

  /** Cambiar el tamaño de página vuelve a la primera, o quedarías fuera de rango. */
  const cambiarPorPagina = (n: number) =>
    escribirUrl({
      'por-pagina': n === POR_PAGINA_POR_DEFECTO ? null : String(n),
      pagina: null,
    })

  // Volver a la página 1 al cambiar un filtro, pero no en el montaje: si no,
  // una URL compartida con ?pagina=3 se reseteaba a sí misma al abrirla.
  //
  // Depende de los valores ya asentados en la URL, no de los inmediatos: con
  // los inmediatos esto se dispararía en cada pulsación del buscador.
  // Se comparan los valores, no se cuentan ejecuciones: StrictMode monta el
  // efecto dos veces en desarrollo y un guard de «primera vez» pasaría de largo
  // en la segunda.
  const filtrosPrevios = useRef<string | null>(null)
  useEffect(() => {
    const clave = `${selectedRegion}|${teamSearchEnUrl}|${locationSearchEnUrl}`
    if (filtrosPrevios.current === clave) return
    const esPrimera = filtrosPrevios.current === null
    filtrosPrevios.current = clave
    if (!esPrimera && currentPage !== 1) setCurrentPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegion, teamSearchEnUrl, locationSearchEnUrl])

  const { data: teamsData, isLoading, error } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsService.getAll(),
  })

  const { data: regionsData } = useQuery({
    queryKey: ['regions'],
    queryFn: () => regionsService.getAll()
  })

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['teams-stats'],
    queryFn: () => homePageService.getMainStats()
  })

  const { data: generalRankingPoints } = useQuery({
    queryKey: ['teams-general-ranking-points'],
    queryFn: async () => {
      const season = await hybridRankingService.getMostRecentSeason()
      const rankings = await teamSeasonRankingsService.getGlobalRankingWithPositionChanges(season)

      if (rankings.length > 0) {
        return rankings
      }

      const computed = await hybridRankingService.getGeneralRanking(season)
      return computed.map((entry) => ({
        team_id: entry.team_id,
        points: entry.total_points || 0,
      }))
    },
  })

  // Puntos históricos: suma en cliente desde team_season_points (no hay columna precalculada).
  // Misma lógica que la pestaña "Ranking histórico" del ranking general.
  const { data: historicalPointsByTeamId } = useQuery({
    queryKey: ['teams-historical-points'],
    queryFn: async () => {
      if (!supabase) return new Map<string, number>()

      const pointColumns = ALL_RANKING_SURFACES.map((surface) => `${surface}_points`).join(', ')
      const { data, error: pointsError } = await supabase
        .from('team_season_points')
        .select(`team_id, ${pointColumns}`)

      if (pointsError) throw pointsError

      const map = new Map<string, number>()
      data?.forEach((row) => {
        const seasonTotal = sumHistoricalPointsFromRow(row as Record<string, unknown>)
        if (seasonTotal <= 0) return
        map.set(row.team_id, (map.get(row.team_id) || 0) + seasonTotal)
      })
      return map
    },
    staleTime: 10 * 60 * 1000,
  })

  const generalPointsByTeamId = useMemo(() => {
    const map = new Map<string, number>()
    generalRankingPoints?.forEach((entry) => {
      map.set(entry.team_id, entry.points || 0)
    })
    return map
  }, [generalRankingPoints])

  const teams = teamsData?.data || []
  const totalClubs = statsData?.totalClubs ?? teams.filter(team => !team.isFilial).length

  const getTeamTotalPoints = useCallback((team: { id: string }) => {
    return generalPointsByTeamId.get(team.id) ?? 0
  }, [generalPointsByTeamId])

  const getTeamHistoricalPoints = useCallback((team: { id: string }) => {
    return historicalPointsByTeamId?.get(team.id) ?? 0
  }, [historicalPointsByTeamId])

  const filteredAndSortedTeams = useMemo(() => {
    const nameQuery = teamSearch.toLowerCase().trim()
    const locationQuery = locationSearch.toLowerCase().trim()

    const filtered = teams.filter(team => {
      const modalityNames = getTeamModalityNameEntries(team, team.name)
        .map((entry) => entry.name.toLowerCase())
      const matchesName =
        !nameQuery ||
        team.name.toLowerCase().includes(nameQuery) ||
        modalityNames.some((name) => name.includes(nameQuery))
      const matchesLocation =
        !locationQuery ||
        (team.location || '').toLowerCase().includes(locationQuery)
      const matchesRegion = !selectedRegion || team.region?.id === selectedRegion
      return matchesName && matchesLocation && matchesRegion
    })

    filtered.sort((a, b) => {
      if (sortField === 'points' || sortField === 'historicalPoints') {
        const aPoints =
          sortField === 'points' ? getTeamTotalPoints(a) : getTeamHistoricalPoints(a)
        const bPoints =
          sortField === 'points' ? getTeamTotalPoints(b) : getTeamHistoricalPoints(b)
        return sortDirection === 'asc' ? aPoints - bPoints : bPoints - aPoints
      }

      let aValue = ''
      let bValue = ''
      if (sortField === 'region') {
        aValue = a.region?.name || ''
        bValue = b.region?.name || ''
      } else if (sortField === 'location') {
        aValue = a.location || ''
        bValue = b.location || ''
      } else {
        aValue = a.name || ''
        bValue = b.name || ''
      }

      const comparison = aValue.localeCompare(bValue, 'es', { sensitivity: 'base' })
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [teams, teamSearch, locationSearch, selectedRegion, sortField, sortDirection, getTeamTotalPoints, getTeamHistoricalPoints])

  const totalPages = Math.ceil(filteredAndSortedTeams.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTeams = filteredAndSortedTeams.slice(startIndex, startIndex + itemsPerPage)

  const hasActiveFilters = teamSearch !== '' || locationSearch !== '' || selectedRegion !== ''

  const aplicarOrden = (campo: SortField, direccion: SortDirection) =>
    escribirUrl({
      orden: campo === ORDEN_POR_DEFECTO ? null : campo,
      dir: direccion === DIRECCION_POR_DEFECTO ? null : direccion,
    })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      aplicarOrden(field, sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      aplicarOrden(field, field === 'points' || field === 'historicalPoints' ? 'desc' : 'asc')
    }
  }

  const getSortState = (field: SortField): 'inactive' | 'asc' | 'desc' => {
    if (sortField !== field) return 'inactive'
    return sortDirection
  }

  const clearFilters = useCallback(() => {
    escribirUrl({
      q: null,
      ubicacion: null,
      region: null,
      pagina: null,
    })
    setTeamSearch('')
    setLocationSearch('')
  }, [escribirUrl, setTeamSearch, setLocationSearch])

  const stopPropagation = (event: React.SyntheticEvent) => {
    event.stopPropagation()
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader
          title="Equipos"
          breadcrumbs={<Breadcrumbs variant="dark" items={[{ label: 'Equipos' }]} />}
        />
        <EmptyState
          icon={UsersRound}
          title="Error al cargar los equipos"
          description="No se pudieron cargar los equipos. Por favor, intenta recargar la página."
          action={{
            label: 'Reintentar',
            onClick: () => window.location.reload(),
          }}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Equipos"
        subtitle="Descubre todos los equipos participantes en el ranking FEDV"
        breadcrumbs={<Breadcrumbs variant="dark" items={[{ label: 'Equipos' }]} />}
        statsBar={
          <PageHeroStatsBar
            isLoading={statsLoading}
            items={[
              {
                icon: UsersRound,
                label: 'Total equipos',
                value: statsData?.totalTeams || teams.length,
              },
              {
                icon: Shield,
                label: 'Total clubes',
                value: totalClubs,
              },
              {
                icon: MapPin,
                label: 'Regiones',
                value: statsData?.totalRegions || regionsData?.data?.length || 0,
              },
              {
                icon: Trophy,
                label: 'Total campeonatos',
                value: statsData?.totalTournaments || 0,
              },
            ]}
          />
        }
      />

      {/*
        Buscador y región para la vista de tarjetas.

        Los filtros vivían solo en la cabecera de la tabla, que en tarjetas está
        oculta: la vista que sale por defecto en móvil no tenía forma de buscar
        entre setenta equipos. En tabla no se repite, porque ahí ya están.
      */}
      {viewMode === 'cards' && (
        <div className="mb-3 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-subtle"
              aria-hidden="true"
            />
            <input
              id="buscar-equipo"
              type="search"
              value={teamSearch}
              onChange={e => setTeamSearch(e.target.value)}
              placeholder="Buscar equipo..."
              aria-label="Buscar equipo por nombre"
              className="input-field pl-9 text-base"
            />
          </div>
          <label htmlFor="filtrar-region" className="sr-only">
            Filtrar por región
          </label>
          <select
            id="filtrar-region"
            value={selectedRegion}
            onChange={e => setSelectedRegion(e.target.value)}
            className="input-field text-base sm:w-48"
          >
            <option value="">Todas las regiones</option>
            {(regionsData?.data || []).map((region: { id: string; name: string }) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Contador, limpiar filtros y vista */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-content-subtle">
          {!isLoading && (
            <>
              {filteredAndSortedTeams.length}{' '}
              {filteredAndSortedTeams.length === 1 ? 'equipo encontrado' : 'equipos encontrados'}
            </>
          )}
        </p>
        <div className="flex shrink-0 items-center gap-3">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-content-subtle hover:text-link transition-colors"
            >
              Limpiar filtros
            </button>
          )}
          {!isLoading && filteredAndSortedTeams.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center justify-center rounded-lg min-h-[44px] min-w-[44px] touch-manipulation transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  viewMode === 'table' ? 'bg-brand-subtle text-link' : 'text-content-muted hover:bg-surface'
                }`}
                aria-label="Vista de tabla"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`inline-flex items-center justify-center rounded-lg min-h-[44px] min-w-[44px] touch-manipulation transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  viewMode === 'cards' ? 'bg-brand-subtle text-link' : 'text-content-muted hover:bg-surface'
                }`}
                aria-label="Vista de tarjetas"
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contenido: Tabla o Cards */}
      {isLoading ? (
        viewMode === 'table' ? <TableSkeleton rows={10} columns={5} /> : <CardSkeleton count={10} />
      ) : filteredAndSortedTeams.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title={hasActiveFilters ? "No se encontraron equipos" : "No hay equipos disponibles"}
          description={
            hasActiveFilters
              ? "Intenta ajustar tus filtros de búsqueda para encontrar más resultados."
              : "Aún no hay equipos registrados en el sistema."
          }
          action={hasActiveFilters ? { label: "Limpiar filtros", onClick: clearFilters } : undefined}
        />
      ) : (
        <>
          {viewMode === 'table' ? (
            <DataTable caption="Listado de equipos" darkHeader={false}>
              <thead className="bg-surface-muted border-b border-line">
                <tr>
                  <TableColumnFilter
                    label="Equipo"
                    sortIcon={getSortState('name')}
                    onSort={() => handleSort('name')}
                    active={!!teamSearch}
                  >
                    <div className="relative min-w-[10rem]">
                      <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-content-subtle" />
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={teamSearch}
                        onChange={(e) => setTeamSearch(e.target.value)}
                        onClick={stopPropagation}
                        className={`${filterSelectClass} pl-7`}
                        aria-label="Filtrar por equipo"
                      />
                    </div>
                  </TableColumnFilter>

                  <TableColumnFilter
                    label="Región"
                    sortIcon={getSortState('region')}
                    onSort={() => handleSort('region')}
                    active={!!selectedRegion}
                  >
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      onClick={stopPropagation}
                      className={filterSelectClass}
                      aria-label="Filtrar por región"
                    >
                      <option value="">Todas</option>
                      {regionsData?.data?.map((region) => (
                        <option key={region.id} value={region.id}>
                          {region.name}
                        </option>
                      ))}
                    </select>
                  </TableColumnFilter>

                  <TableColumnFilter
                    label="Ubicación"
                    sortIcon={getSortState('location')}
                    onSort={() => handleSort('location')}
                    active={!!locationSearch}
                  >
                    <div className="relative min-w-[8rem]">
                      <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-content-subtle" />
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        onClick={stopPropagation}
                        className={`${filterSelectClass} pl-7`}
                        aria-label="Filtrar por ubicación"
                      />
                    </div>
                  </TableColumnFilter>

                  <TableColumnFilter
                    label="Puntos ranking general"
                    sortIcon={getSortState('points')}
                    onSort={() => handleSort('points')}
                  />

                  <TableColumnFilter
                    label="Puntos históricos"
                    sortIcon={getSortState('historicalPoints')}
                    onSort={() => handleSort('historicalPoints')}
                  />
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-line">
                {paginatedTeams.map((team) => (
                    <tr 
                      key={team.id}
                      className="hover:bg-surface-muted cursor-pointer transition-colors duration-150 focus-within:bg-brand-subtle focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-inset"
                      onClick={() => navigate(getTeamPublicUrl(team))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          navigate(getTeamPublicUrl(team))
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Ver detalles de ${team.name}`}
                    >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <TeamLogo 
                              logo={team.logo} 
                              name={team.name} 
                              size="sm"
                              className="mr-3"
                            />
                            <div>
                              <Link
                                to={getTeamPublicUrl(team)}
                                className="text-sm font-medium text-content hover:text-link transition-colors"
                              >
                                {team.name}
                              </Link>
                              <TeamModalityNames team={team} />
                              {team.isFilial && (
                                <div className="text-xs text-link">
                                  Equipo filial
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-content">
                            {team.region?.name || 'Sin región'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-content">
                            {team.location || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-content">
                            {formatPoints(getTeamTotalPoints(team), 1)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-content">
                            {formatPoints(getTeamHistoricalPoints(team), 1)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
            </DataTable>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedTeams.map((team) => (
                <div
                  key={team.id}
                  onClick={() => navigate(getTeamPublicUrl(team))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate(getTeamPublicUrl(team))
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Ver detalles de ${team.name}`}
                  className="card-hover"
                >
                  <div className="flex items-center space-x-4">
                    <TeamLogo 
                      logo={team.logo} 
                      name={team.name} 
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-content truncate">
                        {team.name}
                      </h3>
                      <TeamModalityNames team={team} />
                      {team.isFilial && (
                        <div className="text-xs text-link mt-1">
                          Equipo filial
                        </div>
                      )}
                      <div className="text-sm text-content-muted mt-1">
                        {team.region?.name || 'Sin región'}
                      </div>
                      {team.location && (
                        <div className="text-xs text-content-subtle mt-1">
                          {team.location}
                        </div>
                      )}
                      <div className="text-sm font-medium text-content mt-2">
                        {formatPoints(getTeamTotalPoints(team), 1)} pts actuales
                      </div>
                      <div className="text-xs text-content-subtle mt-0.5">
                        {formatPoints(getTeamHistoricalPoints(team), 1)} pts históricos
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginación mejorada */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredAndSortedTeams.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={cambiarPorPagina}
              />
            </div>
          )}
        </>
      )}
    </PageContainer>
  )
}

export default TeamsPage
