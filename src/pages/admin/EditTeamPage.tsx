import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Users, MapPin, Mail, Image, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { teamsService, regionsService } from '@/services/apiService'
import TeamLogo from '@/components/ui/TeamLogo'

interface Region {
  id: string
  name: string
  code: string
}

interface Team {
  id: string
  name: string
  regionId: string
  location?: string
  email?: string
  logo?: string
  isFilial: boolean
  parentTeamId?: string
  hasDifferentNames: boolean
  nameOpen?: string
  nameWomen?: string
  nameMixed?: string
  createdAt: string
  updatedAt: string
  region?: {
    name: string
    coefficient: number
  }
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
    regionId: '',
    location: '',
    email: '',
    logo: '',
    isFilial: false,
    parentTeamId: '',
    hasDifferentNames: false,
    nameOpen: '',
    nameWomen: '',
    nameMixed: '',
    createdAt: '',
    updatedAt: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [regions, setRegions] = useState<Region[]>([])
  const [teams, setTeams] = useState<Team[]>([])

  useEffect(() => {
    if (id) {
      loadTeam()
      loadRegions()
      loadTeams()
    }
  }, [id])

  const loadRegions = async () => {
    try {
      const response = await regionsService.getAll()
      if (response.success) {
        setRegions(response.data)
      }
    } catch (error) {
      console.error('Error al cargar regiones:', error)
    }
  }

  const loadTeams = async () => {
    try {
      const response = await teamsService.getAll()
      if (response.success) {
        setTeams(response.data)
      }
    } catch (error) {
      console.error('Error al cargar equipos:', error)
    }
  }

  const loadTeam = async () => {
    if (!id) return
    
    setIsLoading(true)
    try {
      const response = await teamsService.getById(id)
      if (response.success) {
        console.log('Equipo cargado:', response.data)
        console.log('parentTeamId:', response.data.parentTeamId)
        setFormData(response.data)
      } else {
        throw new Error('No se pudo cargar el equipo')
      }
    } catch (error: any) {
      console.error('Error al cargar equipo:', error)
      toast.error(error.response?.data?.message || 'Error al cargar el equipo')
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
      await teamsService.update(formData.id, {
        name: formData.name,
        regionId: formData.regionId,
        location: formData.location,
        email: formData.email,
        logo: formData.logo,
        isFilial: formData.isFilial,
        parentTeamId: formData.parentTeamId,
        hasDifferentNames: formData.hasDifferentNames,
        nameOpen: formData.nameOpen,
        nameWomen: formData.nameWomen,
        nameMixed: formData.nameMixed
      })
      
      toast.success('Equipo actualizado exitosamente')
      navigate('/admin/teams')
    } catch (error: any) {
      console.error('Error al actualizar equipo:', error)
      toast.error('Error al actualizar el equipo')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      await teamsService.delete(formData.id)
      
      toast.success('Equipo eliminado exitosamente')
      navigate('/admin/teams')
    } catch (error: any) {
      console.error('Error al eliminar equipo:', error)
      toast.error(error.response?.data?.message || 'Error al eliminar el equipo')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Si se selecciona un club padre, auto-rellenar campos
      if (field === 'parentTeamId' && value && typeof value === 'string') {
        const parentTeam = teams.find(team => team.id === value)
        if (parentTeam) {
          newData.regionId = parentTeam.regionId
          newData.location = parentTeam.location || ''
          newData.email = parentTeam.email || ''
          newData.logo = parentTeam.logo || ''
        }
      }
      
      return newData
    })
    
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

  // Verificar que tenemos datos del equipo
  if (!formData.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No se encontró el equipo</p>
          <button 
            onClick={() => navigate('/admin/teams')}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Volver a equipos
          </button>
        </div>
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
              <p className="text-2xl font-bold text-gray-900">0</p>
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
              <p className="text-2xl font-bold text-gray-900">#0</p>
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
              <p className="text-2xl font-bold text-gray-900">0.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Team Type Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tipo de Equipo</h3>
            
            {/* Is Filial */}
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="isFilial"
                checked={formData.isFilial}
                onChange={(e) => handleInputChange('isFilial', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isFilial" className="ml-2 block text-sm text-gray-900">
                Es un equipo filial
              </label>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Marca esta opción si este equipo es una filial de otro equipo principal
            </p>

            {/* Parent Team Selection - Solo si es filial */}
            {formData.isFilial && (
              <div className="mb-4">
                <label htmlFor="parentTeamId" className="block text-sm font-medium text-gray-700 mb-2">
                  Club Principal *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="parentTeamId"
                    value={formData.parentTeamId || ''}
                    onChange={(e) => handleInputChange('parentTeamId', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.parentTeamId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar club principal</option>
                    {teams.filter(team => !team.isFilial && team.id !== formData.id).map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} {team.region?.name && `(${team.region.name})`}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.parentTeamId && (
                  <p className="mt-1 text-sm text-red-600">{errors.parentTeamId}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Selecciona el club principal del cual es filial este equipo
                </p>
              </div>
            )}
          </div>

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


              {/* Region - Solo si NO es filial */}
              {!formData.isFilial && (
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
              )}

              {/* Region Display - Solo si es filial */}
              {formData.isFilial && formData.regionId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Región (heredada del club principal)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={regions.find(r => r.id === formData.regionId)?.name || ''}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      disabled
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    La región se hereda automáticamente del club principal
                  </p>
                </div>
              )}

              {/* Location - Solo si NO es filial */}
              {!formData.isFilial && (
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="location"
                      value={formData.location || ''}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      placeholder="Ej: Madrid, Barcelona, Valencia..."
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Ciudad o localidad donde se encuentra el equipo
                  </p>
                </div>
              )}

              {/* Location Display - Solo si es filial */}
              {formData.isFilial && formData.location && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación (heredada del club principal)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.location}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      disabled
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    La ubicación se hereda automáticamente del club principal
                  </p>
                </div>
              )}

              {/* Email - Solo si NO es filial */}
              {!formData.isFilial && (
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
              )}

              {/* Email Display - Solo si es filial */}
              {formData.isFilial && formData.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de Contacto (heredado del club principal)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      disabled
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    El email se hereda automáticamente del club principal
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Logo - Solo si NO es filial */}
          {!formData.isFilial && (
            <div>
              <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-2">
                Logo del Equipo
              </label>
              
              {/* Preview del logo */}
              <div className="mb-4 flex items-center space-x-4">
                <TeamLogo 
                  name={formData.name || 'Equipo'} 
                  logo={formData.logo} 
                  size="lg"
                />
                <div>
                  <p className="text-sm text-gray-600">
                    Vista previa del logo
                  </p>
                  <p className="text-xs text-gray-500">
                    Si no hay logo, se mostrará un círculo con la inicial del equipo
                  </p>
                </div>
              </div>
              
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
          )}

          {/* Logo Display - Solo si es filial */}
          {formData.isFilial && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo del Equipo (heredado del club principal)
              </label>
              
              {/* Preview del logo heredado */}
              <div className="mb-4 flex items-center space-x-4">
                <TeamLogo 
                  name={formData.name || 'Equipo'} 
                  logo={formData.logo} 
                  size="lg"
                />
                <div>
                  <p className="text-sm text-gray-600">
                    Logo heredado del club principal
                  </p>
                  <p className="text-xs text-gray-500">
                    Este logo se hereda automáticamente del club principal
                  </p>
                </div>
              </div>
              
              {formData.logo && (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Image className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    value={formData.logo}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    disabled
                  />
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                El logo se hereda automáticamente del club principal
              </p>
            </div>
          )}

          {/* Team Configuration */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Configuración del Equipo</h3>
            
            {/* Has Different Names */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasDifferentNames"
                checked={formData.hasDifferentNames}
                onChange={(e) => handleInputChange('hasDifferentNames', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="hasDifferentNames" className="ml-2 block text-sm text-gray-900">
                Tiene nombres diferentes para cada modalidad
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Marca esta opción si el equipo usa nombres diferentes para Open, Femenino y Mixto
            </p>

            {/* Different Names Fields */}
            {formData.hasDifferentNames && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6 border-l-2 border-gray-200">
                <div>
                  <label htmlFor="nameMixed" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre para Mixto
                  </label>
                  <input
                    type="text"
                    id="nameMixed"
                    value={formData.nameMixed || ''}
                    onChange={(e) => handleInputChange('nameMixed', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Nombre específico para modalidad Mixto"
                  />
                </div>
                
                <div>
                  <label htmlFor="nameWomen" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre para Femenino
                  </label>
                  <input
                    type="text"
                    id="nameWomen"
                    value={formData.nameWomen || ''}
                    onChange={(e) => handleInputChange('nameWomen', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Nombre específico para modalidad Femenino"
                  />
                </div>
                
                <div>
                  <label htmlFor="nameOpen" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre para Open
                  </label>
                  <input
                    type="text"
                    id="nameOpen"
                    value={formData.nameOpen || ''}
                    onChange={(e) => handleInputChange('nameOpen', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Nombre específico para modalidad Open"
                  />
                </div>
              </div>
            )}
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
