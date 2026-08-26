import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, MapPin, Calculator, Users, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { regionsService } from '@/services/apiService'
import { Region } from '@/types'
import FormSkeleton from '@/components/ui/FormSkeleton'
import { formatCoefficient } from '@/utils/rankingCalculations'

// Interfaz extendida para el admin con propiedades adicionales
interface RegionWithDetails extends Region {
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
    if (typeof coefficient !== 'number') return 'text-content-muted'
    if (coefficient >= 1.5) return 'text-green-600 dark:text-green-300'
    if (coefficient >= 1.0) return 'text-blue-600 dark:text-blue-300'
    if (coefficient >= 0.8) return 'text-yellow-600 dark:text-yellow-300'
    return 'text-red-600 dark:text-red-300'
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <FormSkeleton fields={6} />
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
              className="mr-4 p-2 text-content-subtle hover:text-content-muted hover:bg-surface-muted rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="page-header-title">Editar Región</h1>
              <p className="text-content-muted">Modificar información de la región</p>
            </div>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-300 bg-surface border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar Región
          </button>
        </div>
      </div>

      {/* Region Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-950/50 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-content-muted">Equipos</p>
              <p className="page-header-title">{formData._count?.teams || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-950/50 rounded-lg">
              <MapPin className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-content-muted">Campeonatos</p>
              <p className="page-header-title">{formData._count?.tournaments || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-950/50 rounded-lg">
              <Calculator className="h-6 w-6 text-purple-600 dark:text-purple-300" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-content-muted">Coeficiente</p>
              <p className={`text-2xl font-bold ${getCoefficientColor(formData.coefficient)}`}>
                {formatCoefficient(typeof formData.coefficient === 'number' ? formData.coefficient : 1)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-950/50 rounded-lg">
              <Calculator className="h-6 w-6 text-orange-600 dark:text-orange-300" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-content-muted">Promedio Puntos</p>
              <p className="page-header-title">
                {formData._count?.teams > 0 ? 'N/A' : '0.0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-surface rounded-lg shadow-sm border border-line">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-content mb-4">Información Básica</h3>
            
            <div className="grid grid-cols-1 gap-6">
              {/* Region Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-content-muted mb-2">
                  Nombre de la Región *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-content-subtle" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.name ? 'border-red-300 bg-red-50 dark:bg-red-950/40' : 'border-line-strong'
                    }`}
                    placeholder="Ej: Madrid"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-300">{errors.name}</p>
                )}
              </div>

            </div>
          </div>

          {/* Coefficient */}
          <div>
            <h3 className="text-lg font-medium text-content mb-4">Configuración del Ranking</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coefficient */}
              <div>
                <label htmlFor="coefficient" className="block text-sm font-medium text-content-muted mb-2">
                  Coeficiente Regional *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calculator className="h-5 w-5 text-content-subtle" />
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
                      errors.coefficient ? 'border-red-300 bg-red-50 dark:bg-red-950/40' : 'border-line-strong'
                    }`}
                  />
                </div>
                {errors.coefficient && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-300">{errors.coefficient}</p>
                )}
                <p className="mt-1 text-sm text-content-subtle">
                  Multiplicador para los puntos de los equipos de esta región (0.5 - 2.0)
                </p>
              </div>

              {/* Coefficient Visual Indicator */}
              <div>
                <span className="block text-sm font-medium text-content-muted mb-2">
                  Indicador Visual
                </span>
                <div className="flex items-center space-x-4 p-4 bg-surface-muted rounded-lg">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-content-muted mr-2">Valor:</span>
                    <span className={`text-lg font-bold ${getCoefficientColor(formData.coefficient)}`}>
                      {formatCoefficient(typeof formData.coefficient === 'number' ? formData.coefficient : 1)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-content-muted mr-2">Nivel:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      formData.coefficient >= 1.5 ? 'bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300' :
                      formData.coefficient >= 1.0 ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300' :
                      formData.coefficient >= 0.8 ? 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-300' :
                      'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300'
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
            <h3 className="text-lg font-medium text-content mb-4">Descripción</h3>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-content-muted mb-2">
                Descripción de la Región
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="block w-full px-3 py-3 border border-line-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="Descripción opcional de la región, características especiales, etc."
              />
              <p className="mt-1 text-sm text-content-subtle">
                Información adicional sobre la región (opcional)
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-line">
            <button
              type="button"
              onClick={() => navigate('/admin/regions')}
              className="btn-outline"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
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
      <ConfirmDialog
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Eliminar región"
        isPending={isDeleting}
      >
        ¿Estás seguro de que quieres eliminar <strong>{formData.name}</strong>? Esta acción no se
        puede deshacer y afectará a todos los equipos de esta región.
      </ConfirmDialog>
    </div>
  )
}

export default EditRegionPage
