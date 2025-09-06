import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Calendar, MapPin, Trophy, Users, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Region {
  id: string
  name: string
  code: string
}

interface Tournament {
  id: string
  name: string
  year: number
  type: string
  surface: string
  modality: string
  regionId: string
  teams: number
  status: 'upcoming' | 'ongoing' | 'completed'
  startDate: string
  endDate: string
  createdAt: string
}

const EditTournamentPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [formData, setFormData] = useState<Tournament>({
    id: '',
    name: '',
    year: new Date().getFullYear(),
    type: '',
    surface: '',
    modality: '',
    regionId: '',
    teams: 0,
    status: 'upcoming',
    startDate: '',
    endDate: '',
    createdAt: ''
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

  const tournamentTypes = [
    { value: 'CE1', label: 'Campeonato España 1ª División' },
    { value: 'CE2', label: 'Campeonato España 2ª División' },
    { value: 'REGIONAL', label: 'Campeonato Regional' }
  ]

  const surfaces = [
    { value: 'GRASS', label: 'Césped' },
    { value: 'BEACH', label: 'Playa' },
    { value: 'INDOOR', label: 'Indoor' }
  ]

  const modalities = [
    { value: 'OPEN', label: 'Open' },
    { value: 'MIXED', label: 'Mixto' },
    { value: 'WOMEN', label: 'Women' }
  ]

  const statuses = [
    { value: 'upcoming', label: 'Próximo' },
    { value: 'ongoing', label: 'En curso' },
    { value: 'completed', label: 'Completado' }
  ]

  // Mock tournament data - en producción vendría de la API
  const mockTournament: Tournament = {
    id: '1',
    name: 'Campeonato España 1ª División 2024',
    year: 2024,
    type: 'CE1',
    surface: 'GRASS',
    modality: 'OPEN',
    regionId: '13',
    teams: 24,
    status: 'completed',
    startDate: '2024-06-15',
    endDate: '2024-06-17',
    createdAt: '2024-01-15'
  }

  useEffect(() => {
    loadTournament()
  }, [id])

  const loadTournament = async () => {
    setIsLoading(true)
    try {
      // Mock API call - en producción sería una llamada real
      await new Promise(resolve => setTimeout(resolve, 500))
      setFormData(mockTournament)
    } catch (error) {
      console.error('Error al cargar torneo:', error)
      toast.error('Error al cargar el torneo')
      navigate('/admin/tournaments')
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del torneo es requerido'
    }

    if (!formData.type) {
      newErrors.type = 'El tipo de torneo es requerido'
    }

    if (!formData.year || formData.year < 2020 || formData.year > 2030) {
      newErrors.year = 'El año debe estar entre 2020 y 2030'
    }

    if (!formData.surface) {
      newErrors.surface = 'La superficie es requerida'
    }

    if (!formData.modality) {
      newErrors.modality = 'La modalidad es requerida'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'La fecha de inicio es requerida'
    }

    if (!formData.endDate) {
      newErrors.endDate = 'La fecha de fin es requerida'
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
      
      toast.success('Torneo actualizado exitosamente')
      navigate('/admin/tournaments')
    } catch (error) {
      console.error('Error al actualizar torneo:', error)
      toast.error('Error al actualizar el torneo')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      // Mock API call - en producción sería una llamada real
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Torneo eliminado exitosamente')
      navigate('/admin/tournaments')
    } catch (error) {
      console.error('Error al eliminar torneo:', error)
      toast.error('Error al eliminar el torneo')
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

  const getTypeLabel = (type: string) => {
    const found = tournamentTypes.find(t => t.value === type)
    return found ? found.label : type
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'ongoing': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Cargando torneo...</span>
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
              onClick={() => navigate('/admin/tournaments')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Editar Torneo</h1>
              <p className="text-gray-600">Modificar información del torneo</p>
            </div>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar Torneo
          </button>
        </div>
      </div>

      {/* Tournament Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Trophy className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tipo</p>
              <p className="text-lg font-bold text-gray-900">{getTypeLabel(formData.type)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Equipos</p>
              <p className="text-2xl font-bold text-gray-900">{formData.teams}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Año</p>
              <p className="text-2xl font-bold text-gray-900">{formData.year}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <MapPin className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Estado</p>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(formData.status)}`}>
                {statuses.find(s => s.value === formData.status)?.label}
              </span>
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
              {/* Tournament Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Torneo *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Trophy className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Campeonato España 1ª División 2024"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Year */}
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                  Año *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="year"
                    value={formData.year}
                    onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                    min="2020"
                    max="2030"
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.year ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.year && (
                  <p className="mt-1 text-sm text-red-600">{errors.year}</p>
                )}
              </div>

              {/* Tournament Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Torneo *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Trophy className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.type ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar tipo</option>
                    {tournamentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type}</p>
                )}
              </div>

              {/* Region */}
              <div>
                <label htmlFor="regionId" className="block text-sm font-medium text-gray-700 mb-2">
                  Región
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="regionId"
                    value={formData.regionId}
                    onChange={(e) => handleInputChange('regionId', e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  >
                    <option value="">Seleccionar región (opcional)</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Tournament Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Detalles del Torneo</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Surface */}
              <div>
                <label htmlFor="surface" className="block text-sm font-medium text-gray-700 mb-2">
                  Superficie *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="surface"
                    value={formData.surface}
                    onChange={(e) => handleInputChange('surface', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.surface ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar superficie</option>
                    {surfaces.map((surface) => (
                      <option key={surface.value} value={surface.value}>
                        {surface.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.surface && (
                  <p className="mt-1 text-sm text-red-600">{errors.surface}</p>
                )}
              </div>

              {/* Modality */}
              <div>
                <label htmlFor="modality" className="block text-sm font-medium text-gray-700 mb-2">
                  Modalidad *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="modality"
                    value={formData.modality}
                    onChange={(e) => handleInputChange('modality', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.modality ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar modalidad</option>
                    {modalities.map((modality) => (
                      <option key={modality.value} value={modality.value}>
                        {modality.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.modality && (
                  <p className="mt-1 text-sm text-red-600">{errors.modality}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Estado *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  >
                    {statuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Teams */}
              <div>
                <label htmlFor="teams" className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Equipos
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="teams"
                    value={formData.teams}
                    onChange={(e) => handleInputChange('teams', parseInt(e.target.value))}
                    min="1"
                    max="50"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Fechas del Torneo</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Date */}
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Inicio *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="startDate"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.startDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Fin *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="endDate"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.endDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/admin/tournaments')}
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
                Eliminar Torneo
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

export default EditTournamentPage
