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
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { tournamentsService, positionsService, Position } from '@/services/apiService'
import { markRankingDirtyAfterEdit } from '@/services/rankingStateService'
import { translateSurface, translateModality, translateTournamentType, getStatusLabel, getStatusColor } from '@/utils/translations'
import DetailHeaderSkeleton from '@/components/ui/DetailHeaderSkeleton'
import StatsGridSkeleton from '@/components/ui/StatsGridSkeleton'
import TableSkeleton from '@/components/ui/TableSkeleton'

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
      void markRankingDirtyAfterEdit('Campeonato eliminado', { affectsCoefficients: true })
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
      queryClient.invalidateQueries({ queryKey: ['ranking-state'] })
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-pending'] })
      navigate('/admin/tournaments')
    },
    onError: (error: any) => {
      console.error('Error al eliminar campeonato:', error)
      alert('Error al eliminar el campeonato: ' + error.message)
    }
  })

  if (tournamentLoading) {
    return (
      <div className="min-h-screen bg-surface-muted p-6 space-y-6">
        <DetailHeaderSkeleton variant="default" />
        <StatsGridSkeleton />
        <TableSkeleton rows={10} columns={5} showLeadingAvatar />
      </div>
    )
  }

  if (!tournamentData?.data) {
    return (
      <div className="min-h-screen bg-surface-muted flex items-center justify-center">
        <div className="text-center">
          <p className="text-content-muted">Campeonato no encontrado</p>
          <p className="text-sm text-content-subtle mt-2">ID: {id}</p>
          <button
            onClick={() => navigate('/admin/tournaments')}
            className="mt-4 text-blue-600 dark:text-blue-300 hover:text-blue-800"
          >
            Volver a campeonatos
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
    if (position === 2) return <Award className="h-5 w-5 text-content-subtle" />
    if (position === 3) return <Award className="h-5 w-5 text-orange-500" />
    return <Trophy className="h-4 w-4 text-content-subtle" />
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/tournaments')}
            className="flex items-center text-content-muted hover:text-content mb-6"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver a campeonatos
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="page-header-title">{tournament.name}</h1>
              <p className="text-content-muted mt-1">Detalles del campeonato</p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => navigate(`/admin/tournaments/${id}/edit`)}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar campeonato
              </button>
              
              <button
                onClick={() => navigate(`/campeonatos/${id}`)}
                className="btn-primary flex items-center"
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
        <div className="bg-surface rounded-lg shadow-sm border border-line p-6 mb-8">
          <h2 className="text-lg font-semibold text-content mb-6">Información del campeonato</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <span className="block text-sm font-medium text-content-muted">Año</span>
              <p className="text-content">{tournament.year}</p>
            </div>
            
            <div className="space-y-2">
              <span className="block text-sm font-medium text-content-muted">Tipo</span>
              <p className="text-content">{translateTournamentType(tournament.type)}</p>
            </div>
            
            <div className="space-y-2">
              <span className="block text-sm font-medium text-content-muted">Superficie</span>
              <p className="text-content">{translateSurface(tournament.surface)}</p>
            </div>
            
            <div className="space-y-2">
              <span className="block text-sm font-medium text-content-muted">Categoría</span>
              <p className="text-content">{translateModality(tournament.category)}</p>
            </div>
            
            <div className="space-y-2">
              <span className="block text-sm font-medium text-content-muted">Región</span>
              <p className="text-content">{tournament.region?.name || 'Sin región'}</p>
            </div>
            
            <div className="space-y-2">
              <span className="block text-sm font-medium text-content-muted">Estado</span>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tournament.is_finished)}`}>
                {getStatusLabel(tournament.is_finished)}
              </span>
            </div>
          </div>
        </div>

        {/* Tournament Results */}
        <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-content">Resultados</h2>
              <p className="text-content-muted mt-1">{positions.length} equipos participaron</p>
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
            <TableSkeleton rows={8} columns={5} showLeadingAvatar />
          ) : positions.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-content-subtle mx-auto mb-4" />
              <h3 className="text-lg font-medium text-content mb-2">No hay resultados</h3>
              <p className="text-content-muted mb-4">Este campeonato aún no tiene resultados registrados.</p>
              <button
                onClick={() => navigate(`/admin/tournaments/${id}/edit`)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Agregar resultados
              </button>
            </div>
          ) : (
            <div className="data-table-wrapper">
              <table className="min-w-full divide-y divide-line">
                <thead className="bg-surface-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-content-subtle uppercase tracking-wider">
                      Posición
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-content-subtle uppercase tracking-wider">
                      Equipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-content-subtle uppercase tracking-wider">
                      Región
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-content-subtle uppercase tracking-wider">
                      Puntos
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-line">
                  {positions.map((position) => (
                    <tr key={position.id} className="hover:bg-surface-muted">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getPositionIcon(position.position)}
                          <span className="ml-2 text-sm font-medium text-content">
                            {position.position}°
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-content">
                          {position.teams?.name || 'Sin equipo'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-content">
                          {position.teams?.regions?.name || 'Sin región'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-content">
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
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteTournament}
        title="Eliminar campeonato"
        isPending={deleteTournamentMutation.isPending}
      >
        ¿Estás seguro de que quieres eliminar este campeonato? Esta acción no se puede deshacer.
      </ConfirmDialog>
    </div>
  )
}

export default TournamentDetailAdminPage
