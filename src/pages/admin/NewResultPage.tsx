import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, X } from 'lucide-react'
import { positionsService, teamsService, tournamentsService, CreatePositionData } from '@/services/apiService'
import { markRankingDirtyAfterEdit } from '@/services/rankingStateService'

const NewResultPage: React.FC = () => {
  const navigate = useNavigate()
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<CreatePositionData>({
    tournamentId: tournamentId || '',
    teamId: '',
    position: 1
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Obtener equipos disponibles
  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsService.getAll()
  })

  // Obtener torneos disponibles
  const { data: tournamentsData, isLoading: tournamentsLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => tournamentsService.getAll()
  })

  // Obtener posiciones existentes del torneo para validar
  const { data: existingPositions } = useQuery({
    queryKey: ['positions', formData.tournamentId],
    queryFn: () => positionsService.getByTournament(formData.tournamentId),
    enabled: !!formData.tournamentId
  })

  // Mutation para crear posición
  const createPositionMutation = useMutation({
    mutationFn: (data: CreatePositionData) => positionsService.create(data),
    onSuccess: () => {
      const tournament = tournamentsData?.data?.find((t: { id: string }) => t.id === formData.tournamentId)
      const affectsCoefficients = tournament?.type === 'CE1' || tournament?.type === 'CE2'
      void markRankingDirtyAfterEdit('Nuevo resultado registrado', { affectsCoefficients })
      queryClient.invalidateQueries({ queryKey: ['positions'] })
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
      queryClient.invalidateQueries({ queryKey: ['ranking-state'] })
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-pending'] })
      navigate(`/admin/tournaments/${formData.tournamentId}`)
    },
    onError: (error: any) => {
      console.error('Error al crear posición:', error)
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message })
      } else {
        setErrors({ general: 'Error al crear la posición' })
      }
    }
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'position' ? parseInt(value) || 1 : value
    }))
    // Limpiar errores al cambiar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.tournamentId) {
      newErrors.tournamentId = 'Selecciona un torneo'
    }

    if (!formData.teamId) {
      newErrors.teamId = 'Selecciona un equipo'
    }

    if (!formData.position || formData.position < 1) {
      newErrors.position = 'La posición debe ser mayor a 0'
    }

    // Verificar que el equipo no esté ya registrado en este torneo
    if (existingPositions?.data) {
      const teamAlreadyRegistered = existingPositions.data.some(
        pos => pos.teamId === formData.teamId
      )
      if (teamAlreadyRegistered) {
        newErrors.teamId = 'Este equipo ya está registrado en este torneo'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    createPositionMutation.mutate(formData)
  }

  const handleCancel = () => {
    navigate(`/admin/tournaments/${formData.tournamentId}`)
  }

  if (teamsLoading || tournamentsLoading) {
    return (
      <div className="min-h-screen bg-surface-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-content-muted">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCancel}
                className="flex items-center space-x-2 text-content-muted hover:text-content transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Volver</span>
              </button>
            </div>
            <h1 className="page-header-title">Agregar Resultado</h1>
          </div>
        </div>

        {/* Form */}
        <div className="bg-surface rounded-lg shadow-sm border border-line">
          <div className="px-6 py-4 border-b border-line">
            <h2 className="text-lg font-semibold text-content">Información del Resultado</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error general */}
            {errors.general && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-md p-4">
                <p className="text-red-800 dark:text-red-300">{errors.general}</p>
              </div>
            )}

            {/* Torneo */}
            <div>
              <label htmlFor="tournamentId" className="block text-sm font-medium text-content-muted mb-2">
                Torneo *
              </label>
              <select
                id="tournamentId"
                name="tournamentId"
                value={formData.tournamentId}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.tournamentId ? 'border-red-300' : 'border-line-strong'
                }`}
                disabled={!!tournamentId} // Si viene de un torneo específico, no permitir cambiar
              >
                <option value="">Selecciona un torneo</option>
                {tournamentsData?.data?.map((tournament) => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name} ({tournament.year})
                  </option>
                ))}
              </select>
              {errors.tournamentId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-300">{errors.tournamentId}</p>
              )}
            </div>

            {/* Equipo */}
            <div>
              <label htmlFor="teamId" className="block text-sm font-medium text-content-muted mb-2">
                Equipo *
              </label>
              <select
                id="teamId"
                name="teamId"
                value={formData.teamId}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.teamId ? 'border-red-300' : 'border-line-strong'
                }`}
              >
                <option value="">Selecciona un equipo</option>
                {teamsData?.data?.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.region?.name || 'Sin región'})
                  </option>
                ))}
              </select>
              {errors.teamId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-300">{errors.teamId}</p>
              )}
            </div>

            {/* Posición */}
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-content-muted mb-2">
                Posición Final *
              </label>
              <input
                type="number"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.position ? 'border-red-300' : 'border-line-strong'
                }`}
                placeholder="Ej: 1"
              />
              {errors.position && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-300">{errors.position}</p>
              )}
              <p className="mt-1 text-sm text-content-subtle">
                Ingresa la posición final del equipo en el torneo (1 = primer lugar)
              </p>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-line">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center space-x-2 px-4 py-2 border border-line-strong rounded-md text-content-muted hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <X className="h-4 w-4" />
                <span>Cancelar</span>
              </button>
              <button
                type="submit"
                disabled={createPositionMutation.isPending}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createPositionMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>
                  {createPositionMutation.isPending ? 'Guardando...' : 'Guardar Resultado'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default NewResultPage
