import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, MapPin, Calculator } from 'lucide-react'
import toast from 'react-hot-toast'
import { regionsService } from '@/services/apiService'
import { useQueryClient } from '@tanstack/react-query'

const NewRegionPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    coefficient: 1.0,
    description: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de la región es requerido'
    }

    if (!formData.code.trim()) {
      newErrors.code = 'El código de la región es requerido'
    } else if (formData.code.length !== 3) {
      newErrors.code = 'El código debe tener exactamente 3 caracteres'
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

    setIsLoading(true)

    try {
      await regionsService.create({
        name: formData.name,
        code: formData.code,
        coefficient: formData.coefficient,
        description: formData.description
      })
      
      // Invalidar la caché de regiones para que se actualice la lista
      queryClient.invalidateQueries({ queryKey: ['regions'] })
      
      toast.success('Región creada exitosamente')
      navigate('/admin/regions')
    } catch (error: any) {
      console.error('Error al crear región:', error)
      toast.error(error.response?.data?.message || 'Error al crear la región')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Nueva Región</h1>
              <p className="text-gray-600">Registrar una nueva región en el sistema</p>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              {/* Region Code */}
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Código de la Región *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                    maxLength={3}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.code ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ej: MAD"
                  />
                </div>
                {errors.code && (
                  <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Código de 3 letras en mayúsculas
                </p>
              </div>
            </div>
          </div>

          {/* Coefficient */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración del Ranking</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    onChange={(e) => handleInputChange('coefficient', parseFloat(e.target.value) || 1.0)}
                    min="0.5"
                    max="2.0"
                    step="0.01"
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.coefficient ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.coefficient && (
                  <p className="mt-1 text-sm text-red-600">{errors.coefficient}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Multiplicador para ajustar la dificultad regional (0.5 - 2.0)
                </p>
              </div>

              <div className="flex items-center justify-center">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {formData.coefficient.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formData.coefficient < 1.0 ? 'Dificultad reducida' : 
                     formData.coefficient > 1.0 ? 'Dificultad aumentada' : 
                     'Dificultad estándar'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              placeholder="Descripción opcional de la región..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Información adicional sobre la región (opcional)
            </p>
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
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Crear Región
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewRegionPage
