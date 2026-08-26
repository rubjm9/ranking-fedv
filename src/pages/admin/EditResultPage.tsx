import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, X } from 'lucide-react'
import { positionsService, UpdatePositionData } from '@/services/apiService'
import { markRankingDirtyAfterEdit } from '@/services/rankingStateService'
import FormSkeleton from '@/components/ui/FormSkeleton'
import TableSkeleton from '@/components/ui/TableSkeleton'
import { formatPoints } from '@/utils/rankingCalculations'

const EditResultPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<UpdatePositionData>({
    position: 1
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Obtener datos de la posición
  const { data: positionData, isLoading: positionLoading } = useQuery({
    queryKey: ['position', id],
    queryFn: () => positionsService.getById(id!),
    enabled: !!id
  })

  // Actualizar formData cuando se cargan los datos
  React.useEffect(() => {
    if (positionData?.data) {
      setFormData({
        position: positionData.data.position
      })
    }
  }, [positionData])

  // Mutation para actualizar posición
  const updatePositionMutation = useMutation({
    mutationFn: (data: UpdatePositionData) => positionsService.update(id!, data),
    onSuccess: () => {
      const tournamentType = positionData?.data?.tournament?.type
      const affectsCoefficients = tournamentType === 'CE1' || tournamentType === 'CE2'
      void markRankingDirtyAfterEdit('Resultado actualizado', { affectsCoefficients })
      queryClient.invalidateQueries({ queryKey: ['positions'] })
      queryClient.invalidateQueries({ queryKey: ['tournament', positionData?.data.tournamentId] })
      queryClient.invalidateQueries({ queryKey: ['ranking-state'] })
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-pending'] })
      navigate(`/admin/tournaments/${positionData?.data.tournamentId}`)
    },
    onError: (error: any) => {
      console.error('Error al actualizar posición:', error)
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message })
      } else {
        setErrors({ general: 'Error al actualizar la posición' })
      }
    }
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value) || 1
    }))
    // Limpiar errores al cambiar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.position || formData.position < 1) {
      newErrors.position = 'La posición debe ser mayor a 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    updatePositionMutation.mutate(formData)
  }

  const handleCancel = () => {
    navigate(`/admin/tournaments/${positionData?.data.tournamentId}`)
  }

  if (positionLoading) {
    return (
      <div className="min-h-screen bg-surface-muted p-6 space-y-6 max-w-3xl mx-auto">
        <FormSkeleton fields={4} />
        <TableSkeleton rows={5} columns={4} showLeadingAvatar />
      </div>
    )
  }

  if (!positionData?.data) {
    return (
      <div className="min-h-screen bg-surface-muted flex items-center justify-center">
        <div className="text-center">
          <p className="text-content-muted">Resultado no encontrado</p>
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

  const position = positionData.data

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
            <h1 className="page-header-title">Editar Resultado</h1>
          </div>
        </div>

        {/* Información del resultado actual */}
        <div className="bg-surface rounded-lg shadow-sm border border-line mb-8">
          <div className="px-6 py-4 border-b border-line">
            <h2 className="text-lg font-semibold text-content">Información Actual</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-content-subtle">Equipo</p>
                <p className="text-lg font-semibold text-content">
                  {position.team?.name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-content-subtle">Campeonato</p>
                <p className="text-lg font-semibold text-content">
                  {position.tournament?.name} ({position.tournament?.year})
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-content-subtle">Región</p>
                <p className="text-lg font-semibold text-content">
                  {position.team?.region?.name || 'Sin región'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-content-subtle">Puntos Actuales</p>
                <p className="text-lg font-semibold text-content">
                  {formatPoints(position.points, 1)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-surface rounded-lg shadow-sm border border-line">
          <div className="px-6 py-4 border-b border-line">
            <h2 className="text-lg font-semibold text-content">Editar Posición</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error general */}
            {errors.general && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-md p-4">
                <p className="text-red-800 dark:text-red-300">{errors.general}</p>
              </div>
            )}

            {/* Posición */}
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-content-muted mb-2">
                Nueva Posición Final *
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
                Ingresa la nueva posición final del equipo en el campeonato (1 = primer lugar). 
                Los puntos se recalcularán automáticamente.
              </p>
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Información importante</h3>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>• Los puntos se calculan automáticamente basándose en la posición y el coeficiente de la región</li>
                <li>• Al cambiar la posición, se actualizarán los puntos correspondientes</li>
                <li>• Esta acción puede afectar el ranking general de los equipos</li>
              </ul>
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
                disabled={updatePositionMutation.isPending}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatePositionMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>
                  {updatePositionMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditResultPage
