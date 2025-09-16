import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, 
  Calendar, 
  Upload, 
  Edit, 
  Trash2, 
  Eye, 
  Trophy, 
  MapPin, 
  Users,
  BarChart3,
  TrendingUp,
  Filter,
  Search,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { tournamentsService, supabase } from '@/services/apiService'
import ActionButtonGroup from '@/components/ui/ActionButtonGroup'

interface Tournament {
  id: string
  name: string
  type: string
  year: number
  surface: string
  modality: string
  regionId?: string
  region?: any
  createdAt: string
  updatedAt: string
}

const TournamentsAdminPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDeletePositionsModal, setShowDeletePositionsModal] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)

  // Obtener torneos desde Supabase
  const { data: tournamentsData, isLoading, error } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const result = await tournamentsService.getAll()
      return result
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

  const filteredTournaments = tournaments.filter((tournament: Tournament) => {
    const matchesSearch = !searchTerm || tournament.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || tournament.type === selectedType
    const matchesYear = selectedYear === 'all' || tournament.year.toString() === selectedYear
    return matchesSearch && matchesType && matchesYear
  })
  




  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'ongoing':
        return 'bg-blue-100 text-blue-800'
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado'
      case 'ongoing':
        return 'En curso'
      case 'upcoming':
        return 'Próximo'
      default:
        return 'Desconocido'
    }
  }

  if (error) {
    return (
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
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando torneos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Torneos</h1>
          <p className="text-gray-600">Gestiona los torneos del ranking FEDV</p>
        </div>
        <button
          onClick={() => navigate('/admin/tournaments/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo torneo
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar torneos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Todos los tipos</option>
          <option value="CE1">CE1 - 1ª División</option>
          <option value="CE2">CE2 - 2ª División</option>
          <option value="REGIONAL">Regional</option>
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Todos los años</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
        </select>
      </div>

      {/* Tabla */}
      {filteredTournaments.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay torneos</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedType !== 'all' || selectedYear !== 'all' 
                ? 'No se encontraron torneos con los filtros aplicados.' 
                : 'Aún no se han creado torneos en el sistema.'}
            </p>
            <button
              onClick={() => navigate('/admin/tournaments/new')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Crear Primer Torneo</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Torneo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Año
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Superficie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modalidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Región
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTournaments.map((tournament: Tournament) => (
                <tr key={tournament.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Trophy className="h-5 w-5 text-purple-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{tournament.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {tournament.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {tournament.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {tournament.surface === 'GRASS' ? 'Césped' : 
                     tournament.surface === 'BEACH' ? 'Playa' : 
                     tournament.surface === 'INDOOR' ? 'Indoor' : tournament.surface}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {tournament.modality === 'OPEN' ? 'Open' : 
                     tournament.modality === 'WOMEN' ? 'Women' : 
                     tournament.modality === 'MIXED' ? 'Mixto' : tournament.modality}
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
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
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
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
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
