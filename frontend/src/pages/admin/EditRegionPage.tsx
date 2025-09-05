import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, MapPin, Calculator, Users, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { regionsService } from '@/services/apiService'
import { Region } from '@/types'

// Interfaz extendida para el admin con propiedades adicionales
interface RegionWithDetails extends Region {
  description?: string;
  _count?: {
    teams: number;
    tournaments: number;
  };
}

const EditRegionPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [formData, setFormData] = useState<RegionWithDetails>({
    id: '',
    name: '',
    coefficient: 1.0,
    description: '',
    floor: 0.8,
    ceiling: 1.2,
    increment: 0.01,
    createdAt: '',
    updatedAt: '',
    teams: [],
    tournaments: [],
    _count: {
      teams: 0,
      tournaments: 0
    }
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (id) {
      loadRegion()
    }
  }, [id])

  const loadRegion = async () => {
    if (!id) return
    
    setIsLoading(true)
    try {
      const response = await regionsService.getById(id)
      const regionData = response.data
      
      // Asegurar que coefficient sea un número válido
      const coefficient = typeof regionData.coefficient === 'number' ? regionData.coefficient : 1.0
      
      setFormData({
        ...regionData,
        coefficient,
        description: regionData.description || '',
        floor: regionData.floor || 0.8,
        ceiling: regionData.ceiling || 1.2,
        increment: regionData.increment || 0.01,
        teams: regionData.teams || [],
        tournaments: regionData.tournaments || [],
        _count: regionData._count || { teams: 0, tournaments: 0 }
      })
    } catch (error: any) {
      console.error('Error al cargar región:', error)
      toast.error(error.response?.data?.message || 'Error al cargar la región')
      navigate('/admin/regions')
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de la región es requerido'
    }


    if (formData.coefficient < 0.5 || formData.coefficient > 2.0) {
      newErrors.coefficient = 'El coeficiente debe estar entre 0.5 y 2.0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSaving(true)

    try {
      await regionsService.update(formData.id, {
        name: formData.name,
        coefficient: formData.coefficient,
        description: formData.description
      })
      
      toast.success('Región actualizada exitosamente')
      navigate('/admin/regions')
    } catch (error: any) {
      console.error('Error al actualizar región:', error)
      toast.error(error.response?.data?.message || 'Error al actualizar la región')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      await regionsService.delete(formData.id)
      
      toast.success('Región eliminada exitosamente')
      navigate('/admin/regions')
    } catch (error: any) {
      console.error('Error al eliminar región:', error)
      toast.error(error.response?.data?.message || 'Error al eliminar la región')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const getCoefficientColor = (coefficient: number | undefined) => {
    if (typeof coefficient !== 'number') return 'text-gray-600'
    if (coefficient >= 1.5) return 'text-green-600'
    if (coefficient >= 1.0) return 'text-blue-600'
    if (coefficient >= 0.8) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Cargando región...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin/regions')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Editar Región</h1>
              <p className="text-gray-600">Modificar información de la región</p>
            </div>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar Región
          </button>
        </div>
      </div>

      {/* Region Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Equipos</p>
              <p className="text-2xl font-bold text-gray-900">{formData._count?.teams || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Torneos</p>
              <p className="text-2xl font-bold text-gray-900">{formData._count?.tournaments || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calculator className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Coeficiente</p>
              <p className={`text-2xl font-bold ${getCoefficientColor(formData.coefficient)}`}>
                {typeof formData.coefficient === 'number' ? formData.coefficient.toFixed(2) : '1.00'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calculator className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Promedio Puntos</p>
              <p className="text-2xl font-bold text-gray-900">
                {formData._count?.teams > 0 ? 'N/A' : '0.0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
            
            <div className="grid grid-cols-1 gap-6">
              {/* Region Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Región *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Madrid"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

            </div>
          </div>

          {/* Coefficient */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración del Ranking</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coefficient */}
              <div>
                <label htmlFor="coefficient" className="block text-sm font-medium text-gray-700 mb-2">
                  Coeficiente Regional *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calculator className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="coefficient"
                    value={formData.coefficient}
                    onChange={(e) => handleInputChange('coefficient', parseFloat(e.target.value))}
                    step="0.1"
                    min="0.5"
                    max="2.0"
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.coefficient ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.coefficient && (
                  <p className="mt-1 text-sm text-red-600">{errors.coefficient}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Multiplicador para los puntos de los equipos de esta región (0.5 - 2.0)
                </p>
              </div>

              {/* Coefficient Visual Indicator */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Indicador Visual
                </label>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-600 mr-2">Valor:</span>
                    <span className={`text-lg font-bold ${getCoefficientColor(formData.coefficient)}`}>
                      {typeof formData.coefficient === 'number' ? formData.coefficient.toFixed(2) : '1.00'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-600 mr-2">Nivel:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      formData.coefficient >= 1.5 ? 'bg-green-100 text-green-800' :
                      formData.coefficient >= 1.0 ? 'bg-blue-100 text-blue-800' :
                      formData.coefficient >= 0.8 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {formData.coefficient >= 1.5 ? 'Alto' :
                       formData.coefficient >= 1.0 ? 'Medio' :
                       formData.coefficient >= 0.8 ? 'Bajo' : 'Muy Bajo'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Descripción</h3>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción de la Región
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="Descripción opcional de la región, características especiales, etc."
              />
              <p className="mt-1 text-sm text-gray-500">
                Información adicional sobre la región (opcional)
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/admin/regions')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mt-4">
                Eliminar Región
              </h3>
              <p className="text-sm text-gray-500 text-center mt-2">
                ¿Estás seguro de que quieres eliminar <strong>{formData.name}</strong>? 
                Esta acción no se puede deshacer y afectará a todos los equipos de esta región.
              </p>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EditRegionPage
