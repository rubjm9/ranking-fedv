import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Users, MapPin, Mail, Image, CheckSquare, Square } from 'lucide-react'
import toast from 'react-hot-toast'
import { regionsService, teamsService, Region, Team } from '@/services/apiService'

interface TeamFormData {
  name: string
  regionId: string
  email: string
  logo: string
  isFilial: boolean
  parentTeamId: string
  hasDifferentNames: boolean
  nameOpen: string
  nameWomen: string
  nameMixed: string
}

const NewTeamPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    regionId: '',
    email: '',
    logo: '',
    isFilial: false,
    parentTeamId: '',
    hasDifferentNames: false,
    nameOpen: '',
    nameWomen: '',
    nameMixed: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Cargar regiones desde la BD
  const { data: regionsData, isLoading: loadingRegions } = useQuery({
    queryKey: ['regions'],
    queryFn: () => regionsService.getAll(),
    staleTime: 5 * 60 * 1000 // 5 minutos
  })

  // Cargar equipos existentes para el dropdown de equipos filiales
  const { data: teamsData, isLoading: loadingTeams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsService.getAll(),
    staleTime: 5 * 60 * 1000 // 5 minutos
  })

  // Mutación para crear equipo
  const createTeamMutation = useMutation({
    mutationFn: (teamData: any) => teamsService.create(teamData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast.success('Equipo creado exitosamente')
      navigate('/admin/teams')
    },
    onError: (error: any) => {
      console.error('Error al crear equipo:', error)
      toast.error(error.response?.data?.message || 'Error al crear el equipo')
    }
  })

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

    if (formData.isFilial && !formData.parentTeamId) {
      newErrors.parentTeamId = 'Debes seleccionar el club al que pertenece'
    }

    if (formData.hasDifferentNames) {
      if (!formData.nameOpen.trim()) {
        newErrors.nameOpen = 'El nombre para Open es requerido'
      }
      if (!formData.nameWomen.trim()) {
        newErrors.nameWomen = 'El nombre para Women es requerido'
      }
      if (!formData.nameMixed.trim()) {
        newErrors.nameMixed = 'El nombre para Mixed es requerido'
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

    setIsLoading(true)

    try {
      const teamData = {
        name: formData.name,
        regionId: formData.regionId,
        email: formData.email || null,
        logo: formData.logo || null,
        isFilial: formData.isFilial,
        parentTeamId: formData.isFilial ? formData.parentTeamId : null,
        hasDifferentNames: formData.hasDifferentNames,
        nameOpen: formData.hasDifferentNames ? formData.nameOpen : null,
        nameWomen: formData.hasDifferentNames ? formData.nameWomen : null,
        nameMixed: formData.hasDifferentNames ? formData.nameMixed : null
      }

      await createTeamMutation.mutateAsync(teamData)
    } catch (error) {
      console.error('Error al crear equipo:', error)
      toast.error('Error al crear el equipo')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }))
    
    // Limpiar campos relacionados cuando se desmarca un checkbox
    if (field === 'isFilial' && !checked) {
      setFormData(prev => ({ ...prev, parentTeamId: '' }))
    }
    if (field === 'hasDifferentNames' && !checked) {
      setFormData(prev => ({ ...prev, nameOpen: '', nameWomen: '', nameMixed: '' }))
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (loadingRegions || loadingTeams) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Cargando datos...</span>
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
              <h1 className="text-2xl font-bold text-gray-900">Nuevo Equipo</h1>
              <p className="text-gray-600">Registrar un nuevo equipo en el sistema</p>
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
                    {regionsData?.data?.map((region: Region) => (
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
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="equipo@ejemplo.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Logo URL */}
              <div>
                <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-2">
                  URL del Logo
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
              </div>
            </div>
          </div>

          {/* Team Type */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tipo de Equipo</h3>
            
            <div className="space-y-4">
              {/* Is Filial Checkbox */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => handleCheckboxChange('isFilial', !formData.isFilial)}
                  className="flex items-center space-x-3 text-left"
                >
                  {formData.isFilial ? (
                    <CheckSquare className="h-5 w-5 text-primary-600" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    Equipo filial
                  </span>
                </button>
              </div>

              {/* Parent Team Selection */}
              {formData.isFilial && (
                <div className="ml-8">
                  <label htmlFor="parentTeamId" className="block text-sm font-medium text-gray-700 mb-2">
                    Selecciona el club al que pertenece *
                  </label>
                  <select
                    id="parentTeamId"
                    value={formData.parentTeamId}
                    onChange={(e) => handleInputChange('parentTeamId', e.target.value)}
                    className={`block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.parentTeamId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar club</option>
                    {teamsData?.data?.filter((team: Team) => !team.isFilial).map((team: Team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  {errors.parentTeamId && (
                    <p className="mt-1 text-sm text-red-600">{errors.parentTeamId}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Different Names */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Nombres Específicos</h3>
            
            <div className="space-y-4">
              {/* Has Different Names Checkbox */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => handleCheckboxChange('hasDifferentNames', !formData.hasDifferentNames)}
                  className="flex items-center space-x-3 text-left"
                >
                  {formData.hasDifferentNames ? (
                    <CheckSquare className="h-5 w-5 text-primary-600" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    Este equipo tiene nombres distintos open/women/mixto
                  </span>
                </button>
              </div>

              {/* Different Names Inputs */}
              {formData.hasDifferentNames && (
                <div className="ml-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="nameOpen" className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Open *
                    </label>
                    <input
                      type="text"
                      id="nameOpen"
                      value={formData.nameOpen}
                      onChange={(e) => handleInputChange('nameOpen', e.target.value)}
                      className={`block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                        errors.nameOpen ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Ej: Madrid Ultimate Open"
                    />
                    {errors.nameOpen && (
                      <p className="mt-1 text-sm text-red-600">{errors.nameOpen}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="nameWomen" className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Women *
                    </label>
                    <input
                      type="text"
                      id="nameWomen"
                      value={formData.nameWomen}
                      onChange={(e) => handleInputChange('nameWomen', e.target.value)}
                      className={`block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                        errors.nameWomen ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Ej: Madrid Ultimate Women"
                    />
                    {errors.nameWomen && (
                      <p className="mt-1 text-sm text-red-600">{errors.nameWomen}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="nameMixed" className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Mixed *
                    </label>
                    <input
                      type="text"
                      id="nameMixed"
                      value={formData.nameMixed}
                      onChange={(e) => handleInputChange('nameMixed', e.target.value)}
                      className={`block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                        errors.nameMixed ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Ej: Madrid Ultimate Mixed"
                    />
                    {errors.nameMixed && (
                      <p className="mt-1 text-sm text-red-600">{errors.nameMixed}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
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
              disabled={isLoading || createTeamMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading || createTeamMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Crear Equipo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewTeamPage
