import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Trophy, MapPin, Search, Eye } from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import DataTable from '@/components/ui/DataTable'
import TableSkeleton from '@/components/ui/TableSkeleton'
import TableColumnFilter from '@/components/ui/TableColumnFilter'
import TournamentCategoryIcon from '@/components/ui/TournamentCategoryIcon'
import { tournamentsService } from '@/services/apiService'

type SortField = 'name' | 'year' | 'type' | 'surface' | 'category' | 'region'
type SortDirection = 'asc' | 'desc'

const filterSelectClass =
  'h-7 w-full min-w-[5.5rem] rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400'

const TournamentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSurface, setSelectedSurface] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [sortField, setSortField] = useState<SortField>('year')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const { data: tournamentsData, isLoading, error } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => tournamentsService.getAll(),
  })

  const allTournaments = tournamentsData?.data || []

  const formatSeason = (year: number) => {
    const nextYear = (year + 1).toString().slice(-2)
    return `${year}-${nextYear}`
  }

  const filteredTournaments = allTournaments.filter(tournament => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !selectedType || tournament.type === selectedType
    const matchesYear = !selectedYear || tournament.year.toString() === selectedYear
    const matchesSurface = !selectedSurface || tournament.surface === selectedSurface
    const matchesCategory = !selectedCategory || tournament.category === selectedCategory
    const matchesRegion =
      !selectedRegion ||
      (selectedRegion === '__national__'
        ? !tournament.regionId && !tournament.region?.name
        : tournament.regionId === selectedRegion)
    return matchesSearch && matchesType && matchesYear && matchesSurface && matchesCategory && matchesRegion
  })

  const sortedTournaments = [...filteredTournaments].sort((a, b) => {
    let aValue: string | number
    let bValue: string | number

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'year':
        aValue = a.year
        bValue = b.year
        break
      case 'type':
        aValue = a.type
        bValue = b.type
        break
      case 'surface':
        aValue = a.surface
        bValue = b.surface
        break
      case 'category':
        aValue = a.category || ''
        bValue = b.category || ''
        break
      case 'region':
        aValue = a.region?.name || ''
        bValue = b.region?.name || ''
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const types = Array.from(new Set(allTournaments.map(t => t.type))).filter(Boolean).sort()
  const years = Array.from(new Set(allTournaments.map(t => t.year))).filter(Boolean).sort((a, b) => b - a)
  const surfaces = Array.from(new Set(allTournaments.map(t => t.surface))).filter(Boolean).sort()
  const categories = Array.from(new Set(allTournaments.map(t => t.category))).filter(Boolean).sort()

  const regionOptions = Array.from(
    allTournaments.reduce((map, tournament) => {
      if (tournament.regionId && tournament.region?.name) {
        map.set(tournament.regionId, tournament.region.name)
      }
      return map
    }, new Map<string, string>())
  )
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))

  const hasNationalTournaments = allTournaments.some(t => !t.regionId && !t.region?.name)

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'CE1': return 'CE1'
      case 'CE2': return 'CE2'
      case 'REGIONAL': return 'Regional'
      default: return type
    }
  }

  const getSurfaceLabel = (surface: string) => {
    switch (surface) {
      case 'GRASS': return 'Césped'
      case 'BEACH': return 'Playa'
      case 'INDOOR': return 'Interior'
      default: return surface
    }
  }

  const getCategoryLabel = (category: string | null | undefined) => {
    if (!category) return '-'
    switch (category.toUpperCase()) {
      case 'OPEN': return 'Open'
      case 'WOMEN': return 'Women'
      case 'MIXED': return 'Mixto'
      default: return category
    }
  }

  const getCombinedIcon = (surface: string, category: string) => (
    <TournamentCategoryIcon
      surface={surface}
      category={category}
      title={`${getSurfaceLabel(surface)} - ${getCategoryLabel(category)}`}
    />
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getSortState = (field: SortField): 'inactive' | 'asc' | 'desc' => {
    if (sortField !== field) return 'inactive'
    return sortDirection
  }

  const activeFiltersCount = [selectedType, selectedYear, selectedSurface, selectedCategory, selectedRegion].filter(Boolean).length
  const hasActiveFilters = activeFiltersCount > 0 || searchTerm.length > 0

  const clearFilters = () => {
    setSelectedType('')
    setSelectedYear('')
    setSelectedSurface('')
    setSelectedCategory('')
    setSelectedRegion('')
    setSearchTerm('')
  }

  const stopPropagation = (event: React.SyntheticEvent) => {
    event.stopPropagation()
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">Error al cargar los torneos</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Torneos"
        subtitle="Explora y filtra todos los torneos del ranking FEDV"
      />

      {isLoading ? (
        <TableSkeleton rows={8} columns={7} showLeadingAvatar />
      ) : sortedTournaments.length === 0 && !hasActiveFilters ? (
        <EmptyState
          icon={Trophy}
          title="No se encontraron torneos"
          description="Aún no hay torneos registrados en el sistema."
          actionLink={{ label: 'Ver torneos recientes', href: '/tournaments' }}
        />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {sortedTournaments.length} torneo{sortedTournaments.length !== 1 ? 's' : ''} encontrado{sortedTournaments.length !== 1 ? 's' : ''}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-slate-500 hover:text-primary-600 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <DataTable caption="Listado de torneos" darkHeader={false}>
            <thead className="bg-secondary-50 border-b border-slate-200">
              <tr>
                <TableColumnFilter
                  label="Torneo"
                  sortIcon={getSortState('name')}
                  onSort={() => handleSort('name')}
                  active={!!searchTerm}
                >
                  <div className="relative min-w-[10rem]">
                    <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onClick={stopPropagation}
                      className={`${filterSelectClass} pl-7`}
                    />
                  </div>
                </TableColumnFilter>

                <TableColumnFilter
                  label="Temporada"
                  sortIcon={getSortState('year')}
                  onSort={() => handleSort('year')}
                  active={!!selectedYear}
                >
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    onClick={stopPropagation}
                    className={filterSelectClass}
                  >
                    <option value="">Todas</option>
                    {years.map(year => (
                      <option key={year} value={year.toString()}>
                        {formatSeason(year)}
                      </option>
                    ))}
                  </select>
                </TableColumnFilter>

                <TableColumnFilter
                  label="Tipo"
                  sortIcon={getSortState('type')}
                  onSort={() => handleSort('type')}
                  active={!!selectedType}
                >
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    onClick={stopPropagation}
                    className={filterSelectClass}
                  >
                    <option value="">Todos</option>
                    {types.map(type => (
                      <option key={type} value={type}>{getTypeLabel(type)}</option>
                    ))}
                  </select>
                </TableColumnFilter>

                <TableColumnFilter
                  label="Superficie"
                  sortIcon={getSortState('surface')}
                  onSort={() => handleSort('surface')}
                  active={!!selectedSurface}
                >
                  <select
                    value={selectedSurface}
                    onChange={(e) => setSelectedSurface(e.target.value)}
                    onClick={stopPropagation}
                    className={filterSelectClass}
                  >
                    <option value="">Todas</option>
                    {surfaces.map(surface => (
                      <option key={surface} value={surface}>{getSurfaceLabel(surface)}</option>
                    ))}
                  </select>
                </TableColumnFilter>

                <TableColumnFilter
                  label="Categoría"
                  sortIcon={getSortState('category')}
                  onSort={() => handleSort('category')}
                  active={!!selectedCategory}
                >
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    onClick={stopPropagation}
                    className={filterSelectClass}
                  >
                    <option value="">Todas</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{getCategoryLabel(category)}</option>
                    ))}
                  </select>
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
                  >
                    <option value="">Todas</option>
                    {hasNationalTournaments && (
                      <option value="__national__">Nacional</option>
                    )}
                    {regionOptions.map(region => (
                      <option key={region.id} value={region.id}>{region.name}</option>
                    ))}
                  </select>
                </TableColumnFilter>

                <TableColumnFilter label="Acción" sortIcon="none" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {sortedTournaments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                    No hay torneos que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                sortedTournaments.map((tournament) => (
                  <tr
                    key={tournament.id}
                    className="hover:bg-secondary-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getCombinedIcon(tournament.surface, tournament.category)}
                        <div className="ml-3">
                          <Link
                            to={`/tournaments/${tournament.id}`}
                            className="text-sm font-medium text-slate-900 hover:text-primary-600 transition-colors"
                          >
                            {tournament.name}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-900">
                        <Calendar className="h-4 w-4 text-slate-400 mr-2" />
                        {formatSeason(tournament.year)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tournament.type === 'CE1'
                          ? 'bg-yellow-100 text-yellow-800'
                          : tournament.type === 'CE2'
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-primary-100 text-primary-800'
                      }`}>
                        {getTypeLabel(tournament.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {getSurfaceLabel(tournament.surface)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {tournament.category ? getCategoryLabel(tournament.category) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {tournament.region ? (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-slate-400 mr-1" />
                          {tournament.region.name}
                        </div>
                      ) : (
                        <span className="text-slate-400">Nacional</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        to={`/tournaments/${tournament.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </DataTable>
        </>
      )}
    </PageContainer>
  )
}

export default TournamentsPage
