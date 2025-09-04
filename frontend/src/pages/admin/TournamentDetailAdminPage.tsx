import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Plus, 
  Download, 
  Upload, 
  Eye,
  Trophy,
  Users,
  Calendar,
  MapPin,
  Award
} from 'lucide-react'
import tournamentsService from '../../services/tournamentsService'
import positionsService, { Position } from '../../services/positionsService'
import teamsService from '../../services/teamsService'

const TournamentDetailAdminPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)

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

  // Obtener equipos para el formulario de nuevo resultado
  const { data: teamsData } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsService.getAll()
  })

  // Mutation para eliminar torneo
  const deleteTournamentMutation = useMutation({
    mutationFn: (tournamentId: string) => tournamentsService.delete(tournamentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['tournaments'])
      navigate('/admin/tournaments')
    }
  })

  // Mutation para eliminar posición
  const deletePositionMutation = useMutation({
    mutationFn: (positionId: string) => positionsService.delete(positionId),
    onSuccess: () => {
      queryClient.invalidateQueries(['positions'])
      queryClient.invalidateQueries(['tournament', id])
    }
  })

  if (tournamentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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

  const handleDeletePosition = (positionId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este resultado?')) {
      deletePositionMutation.mutate(positionId)
    }
  }

  const handleEditPosition = (position: Position) => {
    navigate(`/admin/results/${position.id}/edit`)
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2: return <Award className="h-5 w-5 text-gray-400" />
      case 3: return <Award className="h-5 w-5 text-amber-600" />
      default: return <span className="text-gray-500">{position}º</span>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/tournaments')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Volver a torneos</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/admin/tournaments/${id}/edit`)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Editar Torneo</span>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Eliminar Torneo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Información del torneo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">{tournament.name}</h1>
            <p className="text-gray-600 mt-1">Detalles del torneo</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Año</p>
                  <p className="text-lg font-semibold text-gray-900">{tournament.year}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Trophy className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Tipo</p>
                  <p className="text-lg font-semibold text-gray-900">{tournament.type}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Superficie</p>
                  <p className="text-lg font-semibold text-gray-900">{tournament.surface}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Modalidad</p>
                  <p className="text-lg font-semibold text-gray-900">{tournament.modality}</p>
                </div>
              </div>
            </div>

            {tournament.region && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Región</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {tournament.region.name} ({tournament.region.code})
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sección de Resultados */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Resultados del Torneo</h2>
                <p className="text-gray-600 mt-1">
                  {positions.length} equipos participaron
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate(`/admin/tournaments/${id}/results/new`)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Agregar Resultado</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>Importar</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                  <Download className="h-4 w-4" />
                  <span>Exportar</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {positionsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando resultados...</p>
              </div>
            ) : positions.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay resultados registrados</h3>
                <p className="text-gray-600 mb-4">
                  Aún no se han registrado resultados para este torneo.
                </p>
                <button
                  onClick={() => navigate(`/admin/tournaments/${id}/results/new`)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Agregar Primer Resultado</span>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {positions
                      .sort((a, b) => a.position - b.position)
                      .map((position) => (
                        <tr key={position.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {getPositionIcon(position.position)}
                              <span className="text-sm font-medium text-gray-900">
                                {position.position}º
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {position.team?.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {position.team?.region?.name || 'Sin región'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {position.points.toFixed(1)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditPosition(position)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePosition(position.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
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

        {/* Modal de confirmación de eliminación */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Confirmar eliminación
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  ¿Estás seguro de que quieres eliminar el torneo "{tournament.name}"? 
                  Esta acción no se puede deshacer y también eliminará todos los resultados asociados.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteTournament}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TournamentDetailAdminPage
