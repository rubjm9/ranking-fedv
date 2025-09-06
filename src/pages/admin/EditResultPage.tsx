import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, X } from 'lucide-react'
import { positionsService, UpdatePositionData } from '@/services/apiService'

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
      queryClient.invalidateQueries({ queryKey: ['positions'] })
      queryClient.invalidateQueries({ queryKey: ['tournament', positionData?.data.tournamentId] })
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando resultado...</p>
        </div>
      </div>
    )
  }

  if (!positionData?.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Resultado no encontrado</p>
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

  const position = positionData.data

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCancel}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Volver</span>
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Resultado</h1>
          </div>
        </div>

        {/* Información del resultado actual */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Información Actual</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Equipo</p>
                <p className="text-lg font-semibold text-gray-900">
                  {position.team?.name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Torneo</p>
                <p className="text-lg font-semibold text-gray-900">
                  {position.tournament?.name} ({position.tournament?.year})
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Región</p>
                <p className="text-lg font-semibold text-gray-900">
                  {position.team?.region?.name || 'Sin región'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Puntos Actuales</p>
                <p className="text-lg font-semibold text-gray-900">
                  {position.points.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Editar Posición</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error general */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">{errors.general}</p>
              </div>
            )}

            {/* Posición */}
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
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
                  errors.position ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ej: 1"
              />
              {errors.position && (
                <p className="mt-1 text-sm text-red-600">{errors.position}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Ingresa la nueva posición final del equipo en el torneo (1 = primer lugar). 
                Los puntos se recalcularán automáticamente.
              </p>
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Información importante</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Los puntos se calculan automáticamente basándose en la posición y el coeficiente de la región</li>
                <li>• Al cambiar la posición, se actualizarán los puntos correspondientes</li>
                <li>• Esta acción puede afectar el ranking general de los equipos</li>
              </ul>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <X className="h-4 w-4" />
                <span>Cancelar</span>
              </button>
              <button
                type="submit"
                disabled={updatePositionMutation.isPending}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 border border-transparent rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
