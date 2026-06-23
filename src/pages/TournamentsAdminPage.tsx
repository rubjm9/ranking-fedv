import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, 
  Calendar, 
  Trophy, 
  MapPin, 
  Search,
  Loader2,
  Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { tournamentsService, supabase } from '../services/apiService'
import ActionButtonGroup from '../components/ui/ActionButtonGroup'
import TableSkeleton from '@/components/ui/TableSkeleton'
import TableColumnFilter from '@/components/ui/TableColumnFilter'
import AdminPageHeader from '@/components/layout/AdminPageHeader'
import { generateSeasons } from '../utils/tournamentUtils'

const filterSelectClass =
  'h-7 w-full min-w-[5.5rem] rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400'

interface Tournament {
  id: string
  name: string
  type: string
  year: number
  surface: string
  category: string
  regionId?: string
  region?: any
  createdAt: string
  updatedAt: string
  hasResults?: boolean
}

type SortField = 'name' | 'type' | 'year' | 'surface' | 'category' | 'region'
type SortDirection = 'asc' | 'desc'

const TournamentsAdminPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedSurface, setSelectedSurface] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDeletePositionsModal, setShowDeletePositionsModal] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Obtener torneos desde Supabase
  const { data: tournamentsData, isLoading, error } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const result = await tournamentsService.getAll()
      return result
    }
  })

  // Obtener posiciones para determinar qué torneos tienen resultados
  const { data: positionsData } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('positions')
        .select('tournamentId')
      
      if (error) throw error
      return data
    }
  })

  // Mutación para eliminar torneo
  const deleteTournamentMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await tournamentsService.delete(id)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
      toast.success('Torneo eliminado exitosamente')
      setShowDeleteModal(false)
      setSelectedTournament(null)
    },
    onError: (error: any) => {
      console.error('Error al eliminar torneo:', error)
      if (error.message?.includes('409')) {
        setShowDeleteModal(false)
        setShowDeletePositionsModal(true)
      } else {
        toast.error('Error al eliminar el torneo')
      }
    }
  })

  // Mutación para eliminar posiciones de un torneo
  const deletePositionsMutation = useMutation({
    mutationFn: async (id: string) => {
      // Eliminar todas las posiciones del torneo
      const { data: positions } = await supabase
        .from('positions')
        .select('id')
        .eq('tournamentId', id)
      
      if (positions && positions.length > 0) {
        const { error } = await supabase
          .from('positions')
          .delete()
          .eq('tournamentId', id)
        
        if (error) throw error
      }
      
      return { success: true, message: 'Posiciones eliminadas exitosamente' }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
      toast.success(`Se eliminaron ${data.data.deletedPositions} posiciones del torneo`)
      setShowDeletePositionsModal(false)
      setSelectedTournament(null)
    },
    onError: (error: any) => {
      console.error('Error al eliminar posiciones:', error)
      toast.error('Error al eliminar las posiciones del torneo')
    }
  })

  const tournaments = tournamentsData?.data || []
  const positions = positionsData || []

  // Crear un Set de tournamentIds que tienen posiciones
  const tournamentsWithResults = new Set(positions.map((p: any) => p.tournamentId))

  // Agregar información de si tiene resultados a cada torneo
  const tournamentsWithStatus = tournaments.map((tournament: Tournament) => ({
    ...tournament,
    hasResults: tournamentsWithResults.has(tournament.id)
  }))

  const handleDelete = (tournament: Tournament) => {
    setSelectedTournament(tournament)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (selectedTournament) {
      deleteTournamentMutation.mutate(selectedTournament.id)
    }
  }

  const confirmDeletePositions = () => {
    if (selectedTournament) {
      deletePositionsMutation.mutate(selectedTournament.id)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortState = (field: SortField): 'inactive' | 'asc' | 'desc' => {
    if (sortField !== field) return 'inactive'
    return sortDirection
  }

  const stopPropagation = (event: React.SyntheticEvent) => {
    event.stopPropagation()
  }

  const hasActiveFilters =
    searchTerm.length > 0 ||
    selectedType !== 'all' ||
    selectedYear !== 'all' ||
    selectedSurface !== 'all' ||
    selectedCategory !== 'all'

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedType('all')
    setSelectedYear('all')
    setSelectedSurface('all')
    setSelectedCategory('all')
  }

  const formatSeason = (year: number) => {
    const nextYear = (year + 1).toString().slice(-2)
    return `${year}-${nextYear}`
  }

  const filteredAndSortedTournaments = tournamentsWithStatus
    .filter((tournament: Tournament) => {
      const matchesSearch = !searchTerm || tournament.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = selectedType === 'all' || tournament.type === selectedType
      const matchesYear = selectedYear === 'all' || tournament.year.toString() === selectedYear
      const matchesSurface = selectedSurface === 'all' || tournament.surface === selectedSurface
      const matchesCategory = selectedCategory === 'all' || tournament.category === selectedCategory
      return matchesSearch && matchesType && matchesYear && matchesSurface && matchesCategory
    })
    .sort((a: Tournament, b: Tournament) => {
      let aValue: any, bValue: any
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        case 'year':
          aValue = a.year
          bValue = b.year
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
  

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error al cargar los torneos</div>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <TableSkeleton rows={8} columns={7} showLeadingAvatar />
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Torneos"
        subtitle="Gestiona los torneos del ranking FEDV"
        actions={
          <button
            onClick={() => navigate('/admin/tournaments/new')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo torneo
          </button>
        }
      />


      {filteredAndSortedTournaments.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay torneos</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedType !== 'all' || selectedYear !== 'all' || selectedSurface !== 'all' || selectedCategory !== 'all'
                ? 'No se encontraron torneos con los filtros aplicados.' 
                : 'Aún no se han creado torneos en el sistema.'}
            </p>
            <button
              onClick={() => navigate('/admin/tournaments/new')}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Crear Primer Torneo</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {filteredAndSortedTournaments.length} torneo{filteredAndSortedTournaments.length !== 1 ? 's' : ''} encontrado{filteredAndSortedTournaments.length !== 1 ? 's' : ''}
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

          <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-secondary-50 border-b border-slate-200">
                <tr>
                  <TableColumnFilter
                    label="Torneo"
                    sortIcon={getSortState('name')}
                    onSort={() => handleSort('name')}
                    active={!!searchTerm}
                    className="sticky left-0 bg-secondary-50 z-10 border-r border-slate-200"
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
                    label="Tipo"
                    sortIcon={getSortState('type')}
                    onSort={() => handleSort('type')}
                    active={selectedType !== 'all'}
                  >
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      onClick={stopPropagation}
                      className={filterSelectClass}
                    >
                      <option value="all">Todos</option>
                      <option value="CE1">CE1 - 1ª División</option>
                      <option value="CE2">CE2 - 2ª División</option>
                      <option value="REGIONAL">Regional</option>
                    </select>
                  </TableColumnFilter>

                  <TableColumnFilter
                    label="Temporada"
                    sortIcon={getSortState('year')}
                    onSort={() => handleSort('year')}
                    active={selectedYear !== 'all'}
                  >
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      onClick={stopPropagation}
                      className={filterSelectClass}
                    >
                      <option value="all">Todas</option>
                      {generateSeasons().map((season) => (
                        <option key={season.value} value={season.startYear}>
                          {season.label}
                        </option>
                      ))}
                    </select>
                  </TableColumnFilter>

                  <TableColumnFilter
                    label="Superficie"
                    sortIcon={getSortState('surface')}
                    onSort={() => handleSort('surface')}
                    active={selectedSurface !== 'all'}
                  >
                    <select
                      value={selectedSurface}
                      onChange={(e) => setSelectedSurface(e.target.value)}
                      onClick={stopPropagation}
                      className={filterSelectClass}
                    >
                      <option value="all">Todas</option>
                      <option value="BEACH">Playa</option>
                      <option value="GRASS">Césped</option>
                      <option value="INDOOR">Indoor</option>
                    </select>
                  </TableColumnFilter>

                  <TableColumnFilter
                    label="Categoría"
                    sortIcon={getSortState('category')}
                    onSort={() => handleSort('category')}
                    active={selectedCategory !== 'all'}
                  >
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      onClick={stopPropagation}
                      className={filterSelectClass}
                    >
                      <option value="all">Todas</option>
                      <option value="OPEN">Open</option>
                      <option value="WOMEN">Women</option>
                      <option value="MIXED">Mixto</option>
                    </select>
                  </TableColumnFilter>

                  <TableColumnFilter
                    label="Región"
                    sortIcon={getSortState('region')}
                    onSort={() => handleSort('region')}
                  />

                  <TableColumnFilter label="Acciones" sortIcon="none" className="text-right" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredAndSortedTournaments.map((tournament: Tournament) => (
                  <tr key={tournament.id} className="hover:bg-gray-50 group">
                    <td className="sticky left-0 bg-white group-hover:bg-gray-50 px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            tournament.hasResults 
                              ? 'bg-green-100' 
                              : 'bg-blue-100'
                          }`}>
                            {tournament.hasResults ? (
                              <Trophy className="h-5 w-5 text-green-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{tournament.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tournament.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatSeason(tournament.year)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tournament.surface === 'GRASS' ? 'Césped' : 
                       tournament.surface === 'BEACH' ? 'Playa' : 
                       tournament.surface === 'INDOOR' ? 'Indoor' : tournament.surface}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tournament.category === 'OPEN' ? 'Open' : 
                       tournament.category === 'WOMEN' ? 'Women' : 
                       tournament.category === 'MIXED' ? 'Mixto' : tournament.category || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {tournament.type === 'REGIONAL' 
                            ? (tournament.region?.name || 'Sin región')
                            : 'Nacional'
                          }
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end">
                        <ActionButtonGroup
                          onView={() => window.open(`/tournaments/${tournament.id}`, '_blank')}
                          onEdit={() => navigate(`/admin/tournaments/${tournament.id}/edit`)}
                          onDelete={() => handleDelete(tournament)}
                          viewTooltip="Ver en página pública"
                          editTooltip="Editar torneo"
                          deleteTooltip="Eliminar torneo"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && selectedTournament && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirmar eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar el torneo "{selectedTournament.name}"? 
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-outline"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteTournamentMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteTournamentMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación de posiciones */}
      {showDeletePositionsModal && selectedTournament && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Eliminar posiciones del torneo
            </h3>
            <p className="text-gray-600 mb-6">
              El torneo "{selectedTournament.name}" tiene posiciones asociadas que impiden su eliminación. 
              ¿Quieres eliminar todas las posiciones del torneo para poder eliminarlo después?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeletePositionsModal(false)}
                className="btn-outline"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeletePositions}
                disabled={deletePositionsMutation.isPending}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {deletePositionsMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Eliminar posiciones'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TournamentsAdminPage
