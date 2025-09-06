import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Users, MapPin, Mail, Image, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Region {
  id: string
  name: string
  code: string
}

interface Team {
  id: string
  name: string
  club: string
  regionId: string
  email: string
  logo: string
  createdAt: string
  tournaments: number
  currentRank: number
  points: number
}

const EditTeamPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [formData, setFormData] = useState<Team>({
    id: '',
    name: '',
    club: '',
    regionId: '',
    email: '',
    logo: '',
    createdAt: '',
    tournaments: 0,
    currentRank: 0,
    points: 0
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Mock data - en producción vendría de la API
  const regions: Region[] = [
    { id: '1', name: 'Andalucía', code: 'AND' },
    { id: '2', name: 'Aragón', code: 'ARA' },
    { id: '3', name: 'Asturias', code: 'AST' },
    { id: '4', name: 'Baleares', code: 'BAL' },
    { id: '5', name: 'Canarias', code: 'CAN' },
    { id: '6', name: 'Cantabria', code: 'CAN' },
    { id: '7', name: 'Castilla-La Mancha', code: 'CLM' },
    { id: '8', name: 'Castilla y León', code: 'CYL' },
    { id: '9', name: 'Cataluña', code: 'CAT' },
    { id: '10', name: 'Extremadura', code: 'EXT' },
    { id: '11', name: 'Galicia', code: 'GAL' },
    { id: '12', name: 'La Rioja', code: 'RIO' },
    { id: '13', name: 'Madrid', code: 'MAD' },
    { id: '14', name: 'Murcia', code: 'MUR' },
    { id: '15', name: 'Navarra', code: 'NAV' },
    { id: '16', name: 'País Vasco', code: 'PV' },
    { id: '17', name: 'Valencia', code: 'VAL' }
  ]

  // Mock team data - en producción vendría de la API
  const mockTeam: Team = {
    id: '1',
    name: 'Madrid Ultimate Club',
    club: 'Madrid Ultimate Club',
    regionId: '13',
    email: 'info@madridultimate.com',
    logo: 'https://via.placeholder.com/40',
    createdAt: '2024-01-15',
    tournaments: 8,
    currentRank: 1,
    points: 1250.5
  }

  useEffect(() => {
    loadTeam()
  }, [id])

  const loadTeam = async () => {
    setIsLoading(true)
    try {
      // Mock API call - en producción sería una llamada real
      await new Promise(resolve => setTimeout(resolve, 500))
      setFormData(mockTeam)
    } catch (error) {
      console.error('Error al cargar equipo:', error)
      toast.error('Error al cargar el equipo')
      navigate('/admin/teams')
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del equipo es requerido'
    }

    if (!formData.regionId) {
      newErrors.regionId = 'La región es requerida'
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido'
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
      // Mock API call - en producción sería una llamada real
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Equipo actualizado exitosamente')
      navigate('/admin/teams')
    } catch (error) {
      console.error('Error al actualizar equipo:', error)
      toast.error('Error al actualizar el equipo')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      // Mock API call - en producción sería una llamada real
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Equipo eliminado exitosamente')
      navigate('/admin/teams')
    } catch (error) {
      console.error('Error al eliminar equipo:', error)
      toast.error('Error al eliminar el equipo')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Cargando equipo...</span>
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
              onClick={() => navigate('/admin/teams')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Editar Equipo</h1>
              <p className="text-gray-600">Modificar información del equipo</p>
            </div>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar Equipo
          </button>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Torneos Participados</p>
              <p className="text-2xl font-bold text-gray-900">{formData.tournaments}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ranking Actual</p>
              <p className="text-2xl font-bold text-gray-900">#{formData.currentRank}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Image className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Puntos Totales</p>
              <p className="text-2xl font-bold text-gray-900">{formData.points.toFixed(1)}</p>
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
              {/* Team Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Equipo *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Madrid Ultimate Club"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Club */}
              <div>
                <label htmlFor="club" className="block text-sm font-medium text-gray-700 mb-2">
                  Club
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="club"
                    value={formData.club}
                    onChange={(e) => handleInputChange('club', e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="Ej: Madrid Ultimate Club"
                  />
                </div>
              </div>

              {/* Region */}
              <div>
                <label htmlFor="regionId" className="block text-sm font-medium text-gray-700 mb-2">
                  Región *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="regionId"
                    value={formData.regionId}
                    onChange={(e) => handleInputChange('regionId', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.regionId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar región</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.regionId && (
                  <p className="mt-1 text-sm text-red-600">{errors.regionId}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email de Contacto
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="equipo@ejemplo.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Logo */}
          <div>
            <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-2">
              Logo del Equipo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Image className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="url"
                id="logo"
                value={formData.logo}
                onChange={(e) => handleInputChange('logo', e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="https://ejemplo.com/logo.png"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              URL de la imagen del logo (opcional)
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/admin/teams')}
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
                Eliminar Equipo
              </h3>
              <p className="text-sm text-gray-500 text-center mt-2">
                ¿Estás seguro de que quieres eliminar <strong>{formData.name}</strong>? 
                Esta acción no se puede deshacer.
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

export default EditTeamPage
