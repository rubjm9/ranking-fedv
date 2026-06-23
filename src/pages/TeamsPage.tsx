import { useState, useMemo, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, UsersRound, MapPin, Trophy, ChevronUp, ChevronDown, Loader2, ArrowUpDown, X, Grid, List, Shield } from 'lucide-react'
import { teamsService, regionsService, getTeamPublicUrl } from '@/services/apiService'
import { homePageService } from '@/services/homePageService'
import hybridRankingService from '@/services/hybridRankingService'
import teamSeasonRankingsService from '@/services/teamSeasonRankingsService'
import { useDebounce } from '@/hooks/useDebounce'
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

const TeamsPage = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [selectedRegion, setSelectedRegion] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [sortField, setSortField] = useState<keyof any>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedRegion, debouncedSearchTerm])

  // Obtener equipos desde la API
  const { data: teamsData, isLoading, error } = useQuery({
    queryKey: ['teams', debouncedSearchTerm, selectedRegion],
    queryFn: () => teamsService.getAll({
      search: debouncedSearchTerm || undefined,
      region: selectedRegion || undefined
    })
  })

  // Obtener regiones desde la API
  const { data: regionsData } = useQuery({
    queryKey: ['regions'],
    queryFn: () => regionsService.getAll()
  })

  // Obtener estadísticas reales
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

  // Filtrar y ordenar equipos
  const filteredAndSortedTeams = useMemo(() => {
    const filtered = teams.filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           team.location?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      const matchesRegion = !selectedRegion || team.region?.id === selectedRegion
      return matchesSearch && matchesRegion
    })

    // Ordenar
    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]
      
      // Manejar valores anidados
      if (sortField === 'region') {
        aValue = a.region?.name || ''
        bValue = b.region?.name || ''
      } else if (sortField === 'points') {
        aValue = getTeamTotalPoints(a)
        bValue = getTeamTotalPoints(b)
      }
      
      // Para puntos, comparar numéricamente
      if (sortField === 'points') {
        if (sortDirection === 'asc') {
          return aValue - bValue
        } else {
          return bValue - aValue
        }
      }
      
      // Para otros campos, convertir a string para comparación
      aValue = String(aValue || '').toLowerCase()
      bValue = String(bValue || '').toLowerCase()
      
      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue)
      } else {
        return bValue.localeCompare(aValue)
      }
    })

    return filtered
  }, [teams, debouncedSearchTerm, selectedRegion, sortField, sortDirection, getTeamTotalPoints])

  // Paginación
  const totalPages = Math.ceil(filteredAndSortedTeams.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTeams = filteredAndSortedTeams.slice(startIndex, startIndex + itemsPerPage)

  // Verificar si hay filtros activos
  const hasActiveFilters = searchTerm !== '' || selectedRegion !== ''

  // Función para limpiar filtros
  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setSelectedRegion('')
    setCurrentPage(1)
  }, [])

  // Regiones únicas para el filtro (ya no se usa, pero mantenemos para compatibilidad)
  const regions = Array.from(new Set(teams.map(team => team.region?.name))).filter(Boolean)

  // Función para manejar el ordenamiento
  const handleSort = (field: keyof any) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Función para obtener el icono de ordenamiento
  const getSortIcon = (field: keyof any) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-slate-400" />
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-primary-600" />
      : <ChevronDown className="h-4 w-4 text-primary-600" />
  }

  // Función para obtener tooltip de ordenamiento
  const getSortTooltip = (field: keyof any) => {
    if (sortField !== field) {
      return 'Haz clic para ordenar'
    }
    return sortDirection === 'asc' ? 'Ordenado ascendente (haz clic para descendente)' : 'Ordenado descendente (haz clic para ascendente)'
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
                label: 'Total torneos',
                value: statsData?.totalTournaments || 0,
              },
            ]}
          />
        }
      />

      {/* Filtros y contador */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar equipos por nombre o ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
            aria-label="Buscar equipos"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Filtrar por región"
          >
            <button
              type="button"
              onClick={() => setSelectedRegion('')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                selectedRegion === ''
                  ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-200'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
              }`}
            >
              Todas las regiones
            </button>
            {regionsData?.data?.map(region => (
              <button
                key={region.id}
                type="button"
                onClick={() => setSelectedRegion(region.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  selectedRegion === region.id
                    ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-200'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
                }`}
              >
                {region.name}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-3 self-end sm:self-auto">
            {!isLoading && (
              <p className="text-xs text-slate-500">
                {filteredAndSortedTeams.length}{' '}
                {filteredAndSortedTeams.length === 1 ? 'equipo encontrado' : 'equipos encontrados'}
              </p>
            )}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-slate-700"
                aria-label="Limpiar filtros"
              >
                <X className="h-3.5 w-3.5" />
                Limpiar
              </button>
            )}
            {!isLoading && filteredAndSortedTeams.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`rounded-lg p-1.5 transition-colors ${
                    viewMode === 'table' ? 'bg-primary-100 text-primary-600' : 'text-slate-400 hover:bg-white'
                  }`}
                  aria-label="Vista de tabla"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`rounded-lg p-1.5 transition-colors ${
                    viewMode === 'cards' ? 'bg-primary-100 text-primary-600' : 'text-slate-400 hover:bg-white'
                  }`}
                  aria-label="Vista de tarjetas"
                >
                  <Grid className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido: Tabla o Cards */}
      {isLoading ? (
        viewMode === 'table' ? <TableSkeleton rows={5} columns={4} /> : <CardSkeleton count={6} />
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
              <thead className="bg-secondary-50">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={() => handleSort('name')}
                        title={getSortTooltip('name')}
                        aria-label="Ordenar por nombre"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Equipo</span>
                          {getSortIcon('name')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={() => handleSort('region')}
                        title={getSortTooltip('region')}
                        aria-label="Ordenar por región"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Región</span>
                          {getSortIcon('region')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Ubicación
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={() => handleSort('points')}
                        title={getSortTooltip('points')}
                        aria-label="Ordenar por puntos"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Puntos ranking general</span>
                          {getSortIcon('points')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {paginatedTeams.map((team) => (
                    <tr 
                      key={team.id}
                      className="hover:bg-secondary-50 cursor-pointer transition-colors duration-150 focus-within:bg-primary-50 focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-inset"
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
                              <div className="text-sm font-medium text-slate-900">
                                {team.name}
                              </div>
                              {team.isFilial && (
                                <div className="text-xs text-primary-600">
                                  Equipo filial
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">
                            {team.region?.name || 'Sin región'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">
                            {team.location || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">
                            {getTeamTotalPoints(team).toFixed(1)}
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
                      <h3 className="text-lg font-semibold text-slate-900 truncate">
                        {team.name}
                      </h3>
                      {team.isFilial && (
                        <div className="text-xs text-primary-600 mt-1">
                          Equipo filial
                        </div>
                      )}
                      <div className="text-sm text-slate-600 mt-1">
                        {team.region?.name || 'Sin región'}
                      </div>
                      {team.location && (
                        <div className="text-xs text-slate-500 mt-1">
                          {team.location}
                        </div>
                      )}
                      <div className="text-sm font-medium text-slate-900 mt-2">
                        {(generalPointsByTeamId.get(team.id) ?? 0).toFixed(1)} puntos
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
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          )}
        </>
      )}
    </PageContainer>
  )
}

export default TeamsPage
