import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  ExternalLink,
  Trophy,
  Award
} from 'lucide-react'
import { tournamentsService, positionsService, Position } from '@/services/apiService'
import { translateSurface, translateModality, translateTournamentType, getStatusLabel, getStatusColor } from '@/utils/translations'

const TournamentDetailAdminPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Obtener datos del torneo
  const { data: tournamentData, isLoading: tournamentLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentsService.getById(id!),
    enabled: !!id
  })

  // Obtener posiciones del torneo
  const { data: positionsData, isLoading: positionsLoading } = useQuery({
    queryKey: ['positions', 'tournament', id],
    queryFn: () => positionsService.getByTournament(id!),
    enabled: !!id
  })

  // Mutation para eliminar torneo
  const deleteTournamentMutation = useMutation({
    mutationFn: (tournamentId: string) => tournamentsService.delete(tournamentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
      navigate('/admin/tournaments')
    },
    onError: (error: any) => {
      console.error('Error al eliminar torneo:', error)
      alert('Error al eliminar el torneo: ' + error.message)
    }
  })

  if (tournamentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando torneo...</p>
        </div>
      </div>
    )
  }

  if (!tournamentData?.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Torneo no encontrado</p>
          <p className="text-sm text-gray-500 mt-2">ID: {id}</p>
          <button
            onClick={() => navigate('/admin/tournaments')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Volver a torneos
          </button>
        </div>
      </div>
    )
  }

  const tournament = tournamentData.data
  const positions = positionsData?.data || []

  const handleDeleteTournament = () => {
    if (id) {
      deleteTournamentMutation.mutate(id)
    }
  }

  const getPositionIcon = (position: number) => {
    if (position === 1) return <Award className="h-5 w-5 text-yellow-500" />
    if (position === 2) return <Award className="h-5 w-5 text-gray-400" />
    if (position === 3) return <Award className="h-5 w-5 text-orange-500" />
    return <Trophy className="h-4 w-4 text-gray-400" />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/tournaments')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver a torneos
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tournament.name}</h1>
              <p className="text-gray-600 mt-1">Detalles del torneo</p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => navigate(`/admin/tournaments/${id}/edit`)}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar torneo
              </button>
              
              <button
                onClick={() => navigate(`/tournaments/${id}`)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver público
              </button>
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </button>
            </div>
          </div>
        </div>

        {/* Tournament Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Información del torneo</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Año</label>
              <p className="text-gray-900">{tournament.year}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Tipo</label>
              <p className="text-gray-900">{translateTournamentType(tournament.type)}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Superficie</label>
              <p className="text-gray-900">{translateSurface(tournament.surface)}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Modalidad</label>
              <p className="text-gray-900">{translateModality(tournament.modality)}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Región</label>
              <p className="text-gray-900">{tournament.region?.name || 'Sin región'}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Estado</label>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tournament.is_finished)}`}>
                {getStatusLabel(tournament.is_finished)}
              </span>
            </div>
          </div>
        </div>

        {/* Tournament Results */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Resultados</h2>
              <p className="text-gray-600 mt-1">{positions.length} equipos participaron</p>
            </div>
            
            <button
              onClick={() => navigate(`/admin/tournaments/${id}/edit`)}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Gestionar resultados
            </button>
          </div>

          {positionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
              <span className="ml-3 text-gray-600">Cargando resultados...</span>
            </div>
          ) : positions.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay resultados</h3>
              <p className="text-gray-600 mb-4">Este torneo aún no tiene resultados registrados.</p>
              <button
                onClick={() => navigate(`/admin/tournaments/${id}/edit`)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Agregar resultados
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posición
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Región
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Puntos
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {positions.map((position) => (
                    <tr key={position.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getPositionIcon(position.position)}
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {position.position}°
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {position.teams?.name || 'Sin equipo'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {position.teams?.regions?.name || 'Sin región'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {position.points}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Eliminar torneo</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  ¿Estás seguro de que quieres eliminar este torneo? Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteTournament}
                  disabled={deleteTournamentMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleteTournamentMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TournamentDetailAdminPage


