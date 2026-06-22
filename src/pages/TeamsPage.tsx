import { useState, useMemo, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, Users, MapPin, Trophy, ChevronUp, ChevronDown, Loader2, ArrowUpDown, X, Grid, List } from 'lucide-react'
import { teamsService, regionsService, getTeamPublicUrl } from '@/services/apiService'
import { homePageService } from '@/services/homePageService'
import { useDebounce } from '@/hooks/useDebounce'
import TeamLogo from '@/components/ui/TeamLogo'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import EmptyState from '@/components/ui/EmptyState'
import Pagination from '@/components/ui/Pagination'
import TableSkeleton from '@/components/ui/TableSkeleton'
import CardSkeleton from '@/components/ui/CardSkeleton'
import StatsCard from '@/components/ui/StatsCard'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
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

  const teams = teamsData?.data || []

  // Función para calcular puntos totales de un equipo
  const getTeamTotalPoints = (team: any) => {
    if (!team.positions || team.positions.length === 0) return 0
    return team.positions.reduce((total: number, position: any) => total + (position.points || 0), 0)
  }

  // Filtrar y ordenar equipos
  const filteredAndSortedTeams = useMemo(() => {
    let filtered = teams.filter(team => {
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
  }, [teams, debouncedSearchTerm, selectedRegion, sortField, sortDirection])

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
          breadcrumbs={<Breadcrumbs items={[{ label: 'Equipos' }]} />}
        />
        <EmptyState
          icon={Users}
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
        breadcrumbs={<Breadcrumbs items={[{ label: 'Equipos' }]} />}
      />

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          icon={Users}
          label="Total Equipos"
          value={statsData?.totalTeams || teams.length}
          isLoading={statsLoading}
          iconBgColor="bg-primary-100"
          iconColor="text-primary-600"
        />
        <StatsCard
          icon={MapPin}
          label="Regiones"
          value={statsData?.totalRegions || regionsData?.data?.length || 0}
          isLoading={statsLoading}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatsCard
          icon={Trophy}
          label="Total Torneos"
          value={statsData?.totalTournaments || 0}
          isLoading={statsLoading}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      {/* Filtros */}
      <div className="card mb-8">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar equipos por nombre o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
                aria-label="Buscar equipos"
              />
            </div>
          </div>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="input-field w-auto min-w-[160px]"
            aria-label="Filtrar por región"
          >
            <option value="">Todas las regiones</option>
            {regionsData?.data?.map(region => (
              <option key={region.id} value={region.id}>{region.name}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              aria-label="Limpiar filtros"
            >
              <X className="h-4 w-4" />
              Limpiar
            </button>
          )}
        </div>
        {hasActiveFilters && (
          <div className="mt-4 text-sm text-slate-600">
            Mostrando {filteredAndSortedTeams.length} {filteredAndSortedTeams.length === 1 ? 'equipo' : 'equipos'}
            {searchTerm && ` que coinciden con "${searchTerm}"`}
            {selectedRegion && ` de la región seleccionada`}
          </div>
        )}
      </div>

      {/* Controles de vista y ordenamiento */}
      {!isLoading && filteredAndSortedTeams.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-slate-600">
            {filteredAndSortedTeams.length} {filteredAndSortedTeams.length === 1 ? 'equipo encontrado' : 'equipos encontrados'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-primary-100 text-primary-600' : 'text-slate-400 hover:bg-slate-100'
              }`}
              aria-label="Vista de tabla"
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'cards' ? 'bg-primary-100 text-primary-600' : 'text-slate-400 hover:bg-slate-100'
              }`}
              aria-label="Vista de tarjetas"
            >
              <Grid className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Contenido: Tabla o Cards */}
      {isLoading ? (
        viewMode === 'table' ? <TableSkeleton rows={5} columns={4} /> : <CardSkeleton count={6} />
      ) : filteredAndSortedTeams.length === 0 ? (
        <EmptyState
          icon={Users}
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
                          <span>Puntos</span>
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
                        {getTeamTotalPoints(team).toFixed(1)} puntos
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
