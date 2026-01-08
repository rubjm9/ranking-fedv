import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronUp, ChevronDown, ArrowUpDown, ExternalLink, Trophy } from 'lucide-react'
import Pagination from './Pagination'
import EmptyState from './EmptyState'

interface TournamentResult {
  id: string
  tournamentId: string
  name: string
  season: string
  type: string
  surface: string
  category: string
  position: number
  points: number
  date: string
}

interface TournamentTableProps {
  results: TournamentResult[]
  getCategoryLabel: (category: string) => string
  getTournamentTypeLabel: (type: string) => string
  getPositionColor: (position: number) => string
  getSurfaceIcon: (surface: string) => string
  getModalityIcon: (modality: string) => string
  viewMode?: 'table' | 'cards'
}

const TournamentTable: React.FC<TournamentTableProps> = ({
  results,
  getCategoryLabel,
  getTournamentTypeLabel,
  getPositionColor,
  getSurfaceIcon,
  getModalityIcon,
  viewMode: initialViewMode
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSeason, setSelectedSeason] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [sortField, setSortField] = useState<keyof TournamentResult>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(initialViewMode || 'table')

  // Obtener valores únicos para filtros
  const seasons = useMemo(() => Array.from(new Set(results.map(r => r.season))).sort().reverse(), [results])
  const categories = useMemo(() => Array.from(new Set(results.map(r => `${r.surface}_${r.category}`))), [results])
  const types = useMemo(() => Array.from(new Set(results.map(r => r.type))), [results])

  // Filtrar y ordenar resultados
  const filteredAndSortedResults = useMemo(() => {
    let filtered = results.filter(result => {
      const matchesSearch = result.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSeason = !selectedSeason || result.season === selectedSeason
      const matchesCategory = !selectedCategory || `${result.surface}_${result.category}` === selectedCategory
      const matchesType = !selectedType || result.type === selectedType
      
      return matchesSearch && matchesSeason && matchesCategory && matchesType
    })

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === 'date') {
        aValue = a.date ? new Date(a.date).getTime() : 0
        bValue = b.date ? new Date(b.date).getTime() : 0
      } else if (sortField === 'position' || sortField === 'points') {
        aValue = Number(aValue) || 0
        bValue = Number(bValue) || 0
      } else {
        aValue = String(aValue || '').toLowerCase()
        bValue = String(bValue || '').toLowerCase()
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })

    return filtered
  }, [results, searchTerm, selectedSeason, selectedCategory, selectedType, sortField, sortDirection])

  // Paginación
  const totalPages = Math.ceil(filteredAndSortedResults.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedResults = filteredAndSortedResults.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (field: keyof TournamentResult) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
    setCurrentPage(1)
  }

  const getSortIcon = (field: keyof TournamentResult) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600" />
      : <ChevronDown className="h-4 w-4 text-blue-600" />
  }

  const hasActiveFilters = searchTerm !== '' || selectedSeason !== '' || selectedCategory !== '' || selectedType !== ''

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedSeason('')
    setSelectedCategory('')
    setSelectedType('')
    setCurrentPage(1)
  }

  if (results.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No hay resultados de torneos"
        description="Este equipo aún no tiene resultados registrados en ningún torneo."
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros y controles */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar torneo..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtros */}
          <select
            value={selectedSeason}
            onChange={(e) => {
              setSelectedSeason(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las temporadas</option>
            {seasons.map(season => (
              <option key={season} value={season}>{season}</option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los tipos</option>
            {types.map(type => (
              <option key={type} value={type}>{getTournamentTypeLabel(type)}</option>
            ))}
          </select>
        </div>

        {/* Controles adicionales */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {filteredAndSortedResults.length} {filteredAndSortedResults.length === 1 ? 'resultado' : 'resultados'}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-2 text-blue-600 hover:text-blue-700 underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Vista de tabla */}
      {viewMode === 'table' ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Torneo</span>
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('season')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Temporada</span>
                      {getSortIcon('season')}
                    </div>
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('position')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Posición</span>
                      {getSortIcon('position')}
                    </div>
                  </th>
                  <th
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('points')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Puntos</span>
                      {getSortIcon('points')}
                    </div>
                  </th>
                  <th
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Fecha</span>
                      {getSortIcon('date')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedResults.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/tournaments/${result.tournamentId}`}
                        className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        <span>{result.name}</span>
                        <ExternalLink className="h-3 w-3 opacity-50" />
                      </Link>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{result.season}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-1">{getSurfaceIcon(result.surface)}</span>
                        <span className="mr-1">{getModalityIcon(result.category)}</span>
                        <span className="text-sm text-gray-500">
                          {getCategoryLabel(`${result.surface.toLowerCase()}_${result.category.toLowerCase()}`)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{getTournamentTypeLabel(result.type)}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPositionColor(result.position)}`}>
                        {result.position}º
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{result.points}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {result.date ? new Date(result.date).toLocaleDateString('es-ES') : 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredAndSortedResults.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          )}
        </>
      ) : (
        /* Vista de cards para móviles */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedResults.map((result) => (
            <Link
              key={result.id}
              to={`/tournaments/${result.tournamentId}`}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900 flex-1">{result.name}</h4>
                <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span>{getSurfaceIcon(result.surface)}</span>
                  <span>{getModalityIcon(result.category)}</span>
                  <span className="text-gray-600">{getCategoryLabel(`${result.surface.toLowerCase()}_${result.category.toLowerCase()}`)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPositionColor(result.position)}`}>
                    {result.position}º
                  </span>
                  <span className="text-gray-600">{result.points} puntos</span>
                </div>
                <div className="text-xs text-gray-500">
                  {result.season} • {result.date ? new Date(result.date).toLocaleDateString('es-ES') : 'N/A'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default TournamentTable






