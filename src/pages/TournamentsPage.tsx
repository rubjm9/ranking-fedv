import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Trophy, MapPin, Search, ArrowUpDown, ArrowUp, ArrowDown, Eye, Waves, Sprout } from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import FilterBar from '@/components/ui/FilterBar'
import EmptyState from '@/components/ui/EmptyState'
import DataTable from '@/components/ui/DataTable'
import TableSkeleton from '@/components/ui/TableSkeleton'
import { tournamentsService } from '@/services/apiService'

type SortField = 'name' | 'year' | 'type' | 'surface' | 'category' | 'region'
type SortDirection = 'asc' | 'desc'

const TournamentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSurface, setSelectedSurface] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortField, setSortField] = useState<SortField>('year')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Obtener torneos desde la API (solo una vez, sin filtros)
  const { data: tournamentsData, isLoading, error } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => tournamentsService.getAll()
  })

  const allTournaments = tournamentsData?.data || []

  // Función para formatear temporada
  const formatSeason = (year: number) => {
    const nextYear = (year + 1).toString().slice(-2)
    return `${year}-${nextYear}`
  }

  // Filtrar torneos localmente (sin query nueva)
  const filteredTournaments = allTournaments.filter(tournament => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !selectedType || tournament.type === selectedType
    const matchesYear = !selectedYear || tournament.year.toString() === selectedYear
    const matchesSurface = !selectedSurface || tournament.surface === selectedSurface
    const matchesCategory = !selectedCategory || tournament.category === selectedCategory
    return matchesSearch && matchesType && matchesYear && matchesSurface && matchesCategory
  })

  // Ordenar torneos
  const sortedTournaments = [...filteredTournaments].sort((a, b) => {
    let aValue: any, bValue: any
    
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
        aValue = a.category
        bValue = b.category
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

  // Obtener valores únicos para filtros (siempre de todos los torneos, no de los filtrados)
  const types = Array.from(new Set(allTournaments.map(t => t.type))).filter(Boolean).sort()
  const years = Array.from(new Set(allTournaments.map(t => t.year))).filter(Boolean).sort((a, b) => b - a)
  const surfaces = Array.from(new Set(allTournaments.map(t => t.surface))).filter(Boolean).sort()
  const categories = Array.from(new Set(allTournaments.map(t => t.category))).filter(Boolean).sort()

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

  // Iconos SVG ultra minimalistas para categorías
  // Open = Hombre (♂)
  const IconOpen = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="3"/>
      <path d="M12 5l-2 4h4l-2-4z" fill="currentColor"/>
      <line x1="12" y1="11" x2="12" y2="15"/>
    </svg>
  )

  // Women = Mujer (♀)
  const IconWomen = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden="true">
      <circle cx="12" cy="7" r="3"/>
      <line x1="12" y1="10" x2="12" y2="15"/>
      <line x1="9" y1="12.5" x2="15" y2="12.5"/>
    </svg>
  )

  // Mixed = Ambos (♂ y ♀)
  const IconMixed = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden="true">
      <circle cx="8" cy="7" r="2.5"/>
      <path d="M8 4.5l-1.5 3h3l-1.5-3z" fill="currentColor"/>
      <line x1="8" y1="9.5" x2="8" y2="12"/>
      <circle cx="16" cy="7" r="2.5"/>
      <line x1="16" y1="9.5" x2="16" y2="12"/>
      <line x1="14" y1="11" x2="18" y2="11"/>
    </svg>
  )

  // Función para obtener el icono combinado (superficie + categoría) que reemplaza al trofeo
  const getCombinedIcon = (surface: string, category: string) => {
    // Determinar color base según superficie (el color de fondo indica la superficie)
    const surfaceColor = surface === 'GRASS' ? 'text-green-600' : surface === 'BEACH' ? 'text-yellow-600' : 'text-primary-600'
    const bgColor = surface === 'GRASS' ? 'bg-green-100' : surface === 'BEACH' ? 'bg-yellow-100' : 'bg-primary-100'
    
    // Icono de categoría (centrado y más grande)
    const CategoryIconComponent = category === 'OPEN' ? IconOpen : category === 'WOMEN' ? IconWomen : category === 'MIXED' ? IconMixed : Trophy
    
    return (
      <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${bgColor}`} title={`${getSurfaceLabel(surface)} - ${getCategoryLabel(category)}`}>
        <div className={surfaceColor}>
          {category === 'OPEN' || category === 'WOMEN' || category === 'MIXED' ? (
            <CategoryIconComponent className="w-6 h-6" />
          ) : (
            <Trophy className="h-6 w-6" />
          )}
        </div>
      </div>
    )
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-slate-400" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-primary-600" />
      : <ArrowDown className="w-4 h-4 text-primary-600" />
  }

  const activeFiltersCount = [selectedType, selectedYear, selectedSurface, selectedCategory].filter(Boolean).length

  const clearFilters = () => {
    setSelectedType('')
    setSelectedYear('')
    setSelectedSurface('')
    setSelectedCategory('')
    setSearchTerm('')
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

      <FilterBar activeFiltersCount={activeFiltersCount} onClearFilters={clearFilters}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Búsqueda integrada */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-9 text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Tipo
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">Todos</option>
                {types.map(type => (
                  <option key={type} value={type}>{getTypeLabel(type)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Temporada
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">Todas</option>
                {years.map(year => (
                  <option key={year} value={year.toString()}>
                    {formatSeason(year)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Superficie
              </label>
              <select
                value={selectedSurface}
                onChange={(e) => setSelectedSurface(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">Todas</option>
                {surfaces.map(surface => (
                  <option key={surface} value={surface}>{getSurfaceLabel(surface)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Categoría
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">Todas</option>
                {categories.map(category => (
                  <option key={category} value={category}>{getCategoryLabel(category)}</option>
                ))}
              </select>
            </div>
          </div>
      </FilterBar>

      {/* Contador de resultados */}
      <div className="card mb-6 !p-0 overflow-hidden">
        <div className="px-4 py-3 bg-secondary-50 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            {sortedTournaments.length === filteredTournaments.length 
              ? `${sortedTournaments.length} torneo${sortedTournaments.length !== 1 ? 's' : ''} encontrado${sortedTournaments.length !== 1 ? 's' : ''}`
              : `${sortedTournaments.length} de ${filteredTournaments.length} torneos`
            }
          </p>
        </div>
      </div>

      {/* Tabla de torneos */}
      {isLoading ? (
        <TableSkeleton rows={8} columns={7} showLeadingAvatar />
      ) : sortedTournaments.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No se encontraron torneos"
          description={
            activeFiltersCount > 0 || searchTerm
              ? 'Intenta ajustar los filtros o la búsqueda para encontrar más resultados.'
              : 'Aún no hay torneos registrados en el sistema.'
          }
          action={activeFiltersCount > 0 ? { label: 'Limpiar filtros', onClick: clearFilters } : undefined}
          actionLink={!activeFiltersCount && !searchTerm ? { label: 'Ver torneos recientes', href: '/tournaments' } : undefined}
        />
      ) : (
        <DataTable caption="Listado de torneos" darkHeader={false}>
          <thead className="bg-secondary-50">
            <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Torneo</span>
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('year')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Temporada</span>
                      {getSortIcon('year')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Tipo</span>
                      {getSortIcon('type')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('surface')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Superficie</span>
                      {getSortIcon('surface')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Categoría</span>
                      {getSortIcon('category')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('region')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Región</span>
                      {getSortIcon('region')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {sortedTournaments.map((tournament) => (
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
                ))}
              </tbody>
        </DataTable>
      )}
    </PageContainer>
  )
}

export default TournamentsPage
