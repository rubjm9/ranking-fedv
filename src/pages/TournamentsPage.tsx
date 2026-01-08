import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Trophy, MapPin, Filter, Search, Loader2, ArrowUpDown, ArrowUp, ArrowDown, X, Eye, Waves, Sprout } from 'lucide-react'
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
    const surfaceColor = surface === 'GRASS' ? 'text-green-600' : surface === 'BEACH' ? 'text-yellow-600' : 'text-blue-600'
    const bgColor = surface === 'GRASS' ? 'bg-green-100' : surface === 'BEACH' ? 'bg-yellow-100' : 'bg-blue-100'
    
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
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Torneos</h1>
        <p className="text-gray-600">
          Explora y filtra todos los torneos del Ranking FEDV
        </p>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        {/* Panel de filtros */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <h2 className="text-sm font-medium text-gray-700">Filtros</h2>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Búsqueda integrada */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tipo
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                {types.map(type => (
                  <option key={type} value={type}>{getTypeLabel(type)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Temporada
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Superficie
              </label>
              <select
                value={selectedSurface}
                onChange={(e) => setSelectedSurface(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas</option>
                {surfaces.map(surface => (
                  <option key={surface} value={surface}>{getSurfaceLabel(surface)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Categoría
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas</option>
                {categories.map(category => (
                  <option key={category} value={category}>{getCategoryLabel(category)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            {sortedTournaments.length === filteredTournaments.length 
              ? `${sortedTournaments.length} torneo${sortedTournaments.length !== 1 ? 's' : ''} encontrado${sortedTournaments.length !== 1 ? 's' : ''}`
              : `${sortedTournaments.length} de ${filteredTournaments.length} torneos`
            }
          </p>
        </div>
      </div>

      {/* Tabla de torneos */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-sm border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : sortedTournaments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron torneos</h3>
          <p className="text-gray-600 mb-4">
            {activeFiltersCount > 0 || searchTerm
              ? 'Intenta ajustar los filtros o la búsqueda para encontrar más resultados.'
              : 'Aún no hay torneos registrados en el sistema.'}
          </p>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Torneo</span>
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('year')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Temporada</span>
                      {getSortIcon('year')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Tipo</span>
                      {getSortIcon('type')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('surface')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Superficie</span>
                      {getSortIcon('surface')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Categoría</span>
                      {getSortIcon('category')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('region')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Región</span>
                      {getSortIcon('region')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedTournaments.map((tournament) => (
                  <tr 
                    key={tournament.id} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getCombinedIcon(tournament.surface, tournament.category)}
                        <div className="ml-3">
                          <Link
                            to={`/tournaments/${tournament.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {tournament.name}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        {formatSeason(tournament.year)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tournament.type === 'CE1' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : tournament.type === 'CE2'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {getTypeLabel(tournament.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getSurfaceLabel(tournament.surface)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tournament.category ? getCategoryLabel(tournament.category) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tournament.region ? (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                          {tournament.region.name}
                        </div>
                      ) : (
                        <span className="text-gray-400">Nacional</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        to={`/tournaments/${tournament.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default TournamentsPage
