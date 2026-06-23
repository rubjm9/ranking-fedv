import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, ExternalLink, Trophy } from 'lucide-react'
import Pagination from './Pagination'
import EmptyState from './EmptyState'
import DataTable from './DataTable'
import TableColumnFilter from './TableColumnFilter'
import { formatPoints } from '@/utils/rankingCalculations'

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
  basePoints?: number
  coefficient?: number
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

type SortField = keyof Pick<
  TournamentResult,
  'name' | 'season' | 'type' | 'position' | 'points' | 'date'
> | 'categoryKey'

const filterSelectClass =
  'h-7 w-full min-w-[5.5rem] rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400'

const getCategoryKey = (result: TournamentResult) =>
  `${result.surface}_${result.category}`

const TournamentTable: React.FC<TournamentTableProps> = ({
  results,
  getCategoryLabel,
  getTournamentTypeLabel,
  getPositionColor,
  getSurfaceIcon,
  getModalityIcon,
  viewMode: initialViewMode,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSeason, setSelectedSeason] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [viewMode] = useState<'table' | 'cards'>(initialViewMode || 'table')

  const seasons = useMemo(
    () => Array.from(new Set(results.map((r) => r.season))).sort().reverse(),
    [results]
  )
  const categories = useMemo(
    () => Array.from(new Set(results.map((r) => getCategoryKey(r)))),
    [results]
  )
  const types = useMemo(
    () => Array.from(new Set(results.map((r) => r.type))),
    [results]
  )

  const filteredAndSortedResults = useMemo(() => {
    const filtered = results.filter((result) => {
      const matchesSearch = result.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSeason = !selectedSeason || result.season === selectedSeason
      const matchesCategory =
        !selectedCategory || getCategoryKey(result) === selectedCategory
      const matchesType = !selectedType || result.type === selectedType

      return matchesSearch && matchesSeason && matchesCategory && matchesType
    })

    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      if (sortField === 'date') {
        aValue = a.date ? new Date(a.date).getTime() : 0
        bValue = b.date ? new Date(b.date).getTime() : 0
      } else if (sortField === 'categoryKey') {
        aValue = getCategoryKey(a).toLowerCase()
        bValue = getCategoryKey(b).toLowerCase()
      } else if (sortField === 'position' || sortField === 'points') {
        aValue = Number(a[sortField]) || 0
        bValue = Number(b[sortField]) || 0
      } else {
        aValue = String(a[sortField as keyof TournamentResult] || '').toLowerCase()
        bValue = String(b[sortField as keyof TournamentResult] || '').toLowerCase()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [results, searchTerm, selectedSeason, selectedCategory, selectedType, sortField, sortDirection])

  const totalPages = Math.ceil(filteredAndSortedResults.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedResults = filteredAndSortedResults.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection(field === 'name' || field === 'season' ? 'asc' : 'desc')
    }
    setCurrentPage(1)
  }

  const getSortState = (field: SortField): 'inactive' | 'asc' | 'desc' => {
    if (sortField !== field) return 'inactive'
    return sortDirection
  }

  const stopPropagation = (event: React.SyntheticEvent) => {
    event.stopPropagation()
  }

  const hasActiveFilters =
    searchTerm !== '' || selectedSeason !== '' || selectedCategory !== '' || selectedType !== ''

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedSeason('')
    setSelectedCategory('')
    setSelectedType('')
    setCurrentPage(1)
  }

  const resetPage = () => setCurrentPage(1)

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
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {filteredAndSortedResults.length}{' '}
          {filteredAndSortedResults.length === 1 ? 'resultado' : 'resultados'}
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

      {viewMode === 'table' ? (
        <>
          <DataTable caption="Resultados en torneos" darkHeader={false}>
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
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        resetPage()
                      }}
                      onClick={stopPropagation}
                      className={`${filterSelectClass} pl-7`}
                    />
                  </div>
                </TableColumnFilter>

                <TableColumnFilter
                  label="Temporada"
                  sortIcon={getSortState('season')}
                  onSort={() => handleSort('season')}
                  active={!!selectedSeason}
                >
                  <select
                    value={selectedSeason}
                    onChange={(e) => {
                      setSelectedSeason(e.target.value)
                      resetPage()
                    }}
                    onClick={stopPropagation}
                    className={filterSelectClass}
                  >
                    <option value="">Todas</option>
                    {seasons.map((season) => (
                      <option key={season} value={season}>
                        {season}
                      </option>
                    ))}
                  </select>
                </TableColumnFilter>

                <TableColumnFilter
                  label="Categoría"
                  sortIcon={getSortState('categoryKey')}
                  onSort={() => handleSort('categoryKey')}
                  active={!!selectedCategory}
                >
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value)
                      resetPage()
                    }}
                    onClick={stopPropagation}
                    className={filterSelectClass}
                  >
                    <option value="">Todas</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {getCategoryLabel(cat)}
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
                    onChange={(e) => {
                      setSelectedType(e.target.value)
                      resetPage()
                    }}
                    onClick={stopPropagation}
                    className={filterSelectClass}
                  >
                    <option value="">Todos</option>
                    {types.map((type) => (
                      <option key={type} value={type}>
                        {getTournamentTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </TableColumnFilter>

                <TableColumnFilter
                  label="Posición"
                  sortIcon={getSortState('position')}
                  onSort={() => handleSort('position')}
                />

                <TableColumnFilter
                  label="Puntos"
                  sortIcon={getSortState('points')}
                  onSort={() => handleSort('points')}
                />

                <TableColumnFilter
                  label="Fecha"
                  sortIcon={getSortState('date')}
                  onSort={() => handleSort('date')}
                />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {paginatedResults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                    No hay resultados que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginatedResults.map((result) => (
                  <tr key={result.id} className="hover:bg-secondary-50 transition-colors duration-150">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/tournaments/${result.tournamentId}`}
                        className="flex items-center gap-2 text-sm font-medium text-slate-900 hover:text-primary-600 transition-colors"
                      >
                        <span>{result.name}</span>
                        <ExternalLink className="h-3 w-3 opacity-50" />
                      </Link>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">{result.season}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-1">{getSurfaceIcon(result.surface)}</span>
                        <span className="mr-1">{getModalityIcon(result.category)}</span>
                        <span className="text-sm text-slate-500">
                          {getCategoryLabel(
                            `${result.surface.toLowerCase()}_${result.category.toLowerCase()}`
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">
                        {getTournamentTypeLabel(result.type)}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPositionColor(result.position)}`}
                      >
                        {result.position}º
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {formatPoints(result.points)}
                      </div>
                      {result.type === 'REGIONAL' &&
                        result.coefficient !== undefined &&
                        result.coefficient !== 1 && (
                          <div className="text-xs text-slate-500">base {result.basePoints}</div>
                        )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">
                        {result.date ? new Date(result.date).toLocaleDateString('es-ES') : 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </DataTable>

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedResults.map((result) => (
            <Link
              key={result.id}
              to={`/tournaments/${result.tournamentId}`}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow border border-slate-200"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-900 flex-1">{result.name}</h4>
                <ExternalLink className="h-4 w-4 text-slate-400 flex-shrink-0 ml-2" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span>{getSurfaceIcon(result.surface)}</span>
                  <span>{getModalityIcon(result.category)}</span>
                  <span className="text-slate-600">
                    {getCategoryLabel(
                      `${result.surface.toLowerCase()}_${result.category.toLowerCase()}`
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPositionColor(result.position)}`}
                  >
                    {result.position}º
                  </span>
                  <div className="text-right">
                    <span className="text-slate-600">{formatPoints(result.points)} puntos</span>
                    {result.type === 'REGIONAL' &&
                      result.coefficient !== undefined &&
                      result.coefficient !== 1 && (
                        <div className="text-xs text-slate-400">base {result.basePoints}</div>
                      )}
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  {result.season} •{' '}
                  {result.date ? new Date(result.date).toLocaleDateString('es-ES') : 'N/A'}
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
