import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Calendar, MapPin, Trophy, Users, Plus, Trash2, Clipboard } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import toast from 'react-hot-toast'
import TeamSelector from '@/components/forms/TeamSelector'
import PastePositionsModal from '@/components/forms/PastePositionsModal'
import LocationAutocomplete from '@/components/forms/LocationAutocomplete'
import {
  generateSeasons,
  generateTournamentName,
  getPointsForPosition,
  generateDefaultPositions,
  validateTournamentDates,
  getYearFromSeason,
  type TournamentFormData,
  type PositionRow
} from '@/utils/tournamentUtils'
import { tournamentsService, teamsService, regionsService } from '@/services/apiService'

interface Region {
  id: string
  name: string
  code: string
}

const NewTournamentPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<TournamentFormData>({
    type: '',
    season: '',
    surface: '',
    modality: '',
    regionId: '',
    startDate: '',
    endDate: '',
    location: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [positions, setPositions] = useState<PositionRow[]>([])
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [generatedName, setGeneratedName] = useState('')

  // Cargar datos de duplicación si existen
  useEffect(() => {
    const isDuplicate = searchParams.get('duplicate') === 'true'
    if (isDuplicate) {
      const duplicateData: TournamentFormData = {
        type: searchParams.get('type') || '',
        season: searchParams.get('season') || '',
        surface: searchParams.get('surface') || '',
        modality: searchParams.get('modality') || '',
        regionId: searchParams.get('regionId') || '',
        startDate: '',
        endDate: '',
        location: searchParams.get('location') || ''
      }
      setFormData(duplicateData)
      toast.success('Datos del torneo cargados. Puedes editarlos antes de guardar.')
    }
  }, [searchParams])

  // Obtener datos desde la API
  const { data: regionsData } = useQuery({
    queryKey: ['regions'],
    queryFn: () => regionsService.getAll()
  })

  const { data: teamsData } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsService.getAll()
  })

  const regions = regionsData?.data || []
  const teams = teamsData?.data || []
  const seasons = generateSeasons()

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
    { value: 'WOMEN', label: 'Women' },
    { value: 'MIXED', label: 'Mixto' }
  ]

  // Generar nombre automático cuando cambien los campos relevantes
  useEffect(() => {
    const selectedRegion = regions.find((r: Region) => r.id === formData.regionId)
    const name = generateTournamentName(
      formData.type,
      selectedRegion?.name,
      formData.surface,
      formData.modality,
      formData.season
    )
    setGeneratedName(name)
  }, [formData.type, formData.regionId, formData.surface, formData.modality, formData.season, regions])

  // Generar posiciones por defecto cuando cambie el tipo de torneo
  useEffect(() => {
    if (formData.type) {
      setPositions(generateDefaultPositions(formData.type))
    }
  }, [formData.type])

  // Mutación para crear torneo
  const createTournamentMutation = useMutation({
    mutationFn: async (data: any) => {
      return tournamentsService.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
      toast.success('Torneo creado exitosamente')
      navigate('/admin/tournaments')
    },
    onError: (error: any) => {
      console.error('Error al crear torneo:', error)
      toast.error('Error al crear el torneo')
    }
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.type) {
      newErrors.type = 'El tipo de torneo es requerido'
    }

    if (!formData.season) {
      newErrors.season = 'La temporada es requerida'
    }

    if (!formData.surface) {
      newErrors.surface = 'La superficie es requerida'
    }

    if (!formData.modality) {
      newErrors.modality = 'La modalidad es requerida'
    }

    if (formData.type === 'REGIONAL' && !formData.regionId) {
      newErrors.regionId = 'La región es requerida para torneos regionales'
    }

    const dateError = validateTournamentDates(formData.startDate, formData.endDate)
    if (dateError) {
      newErrors.startDate = dateError
    }

    if (!formData.location.trim()) {
      newErrors.location = 'La ubicación es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Validación en tiempo real
  const validateField = (field: keyof TournamentFormData, value: string) => {
    const newErrors = { ...errors }
    
    switch (field) {
      case 'type':
        if (!value) {
          newErrors.type = 'El tipo de torneo es requerido'
        } else {
          delete newErrors.type
        }
        break
        
      case 'season':
        if (!value) {
          newErrors.season = 'La temporada es requerida'
        } else {
          delete newErrors.season
        }
        break
        
      case 'surface':
        if (!value) {
          newErrors.surface = 'La superficie es requerida'
        } else {
          delete newErrors.surface
        }
        break
        
      case 'modality':
        if (!value) {
          newErrors.modality = 'La modalidad es requerida'
        } else {
          delete newErrors.modality
        }
        break
        
      case 'regionId':
        if (formData.type === 'REGIONAL' && !value) {
          newErrors.regionId = 'La región es requerida para torneos regionales'
        } else {
          delete newErrors.regionId
        }
        break
        
      case 'startDate':
      case 'endDate':
        const dateError = validateTournamentDates(
          field === 'startDate' ? value : formData.startDate,
          field === 'endDate' ? value : formData.endDate
        )
        if (dateError) {
          newErrors.startDate = dateError
        } else {
          delete newErrors.startDate
        }
        break
        
      case 'location':
        if (!value.trim()) {
          newErrors.location = 'La ubicación es requerida'
        } else {
          delete newErrors.location
        }
        break
    }
    
    setErrors(newErrors)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const tournamentData = {
        name: generatedName,
        type: formData.type,
        year: getYearFromSeason(formData.season),
        surface: formData.surface,
        modality: formData.modality,
        regionId: formData.regionId || null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        location: formData.location
      }

      const result = await createTournamentMutation.mutateAsync(tournamentData)

      // Si hay posiciones, crearlas también
      if (positions.length > 0) {
        const positionsWithTeams = positions.filter(p => p.teamId)
        if (positionsWithTeams.length > 0) {
          await tournamentsService.addPositions(result.data.id, positionsWithTeams)
        }
      }
    } catch (error) {
      console.error('Error al crear torneo:', error)
      toast.error('Error al crear el torneo')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof TournamentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    validateField(field, value)
  }

  const updatePosition = (index: number, field: keyof PositionRow, value: string | number) => {
    setPositions(prev => prev.map((pos, i) => {
      if (i === index) {
        const updated = { ...pos, [field]: value }
        // Recalcular puntos si cambió la posición o el tipo de torneo
        if (field === 'position' && formData.type) {
          updated.points = getPointsForPosition(Number(value), formData.type)
        }
        return updated
      }
      return pos
    }))
  }

  const addPosition = () => {
    const newPosition = positions.length + 1
    setPositions(prev => [...prev, {
      position: newPosition,
      teamId: '',
      points: getPointsForPosition(newPosition, formData.type)
    }])
  }

  const removePosition = (index: number) => {
    setPositions(prev => {
      const updated = prev.filter((_, i) => i !== index)
      // Reordenar posiciones
      return updated.map((pos, i) => ({
        ...pos,
        position: i + 1,
        points: getPointsForPosition(i + 1, formData.type)
      }))
    })
  }

  const handlePastePositions = (teamNames: string[]) => {
    // Crear mapa de nombres de equipos a IDs
    const teamNameToId = new Map(teams.map(team => [team.name.toLowerCase(), team.id]))
    
    // Convertir nombres de equipos a posiciones
    const newPositions: PositionRow[] = teamNames.map((teamName, index) => {
      const teamId = teamNameToId.get(teamName.toLowerCase()) || ''
      return {
        position: index + 1,
        teamId: teamId,
        points: getPointsForPosition(index + 1, formData.type)
      }
    })

    // Reemplazar todas las posiciones existentes
    setPositions(newPositions)
    
    toast.success(`${teamNames.length} posiciones aplicadas correctamente`)
  }

  // Sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Manejar drag and drop
  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      setPositions((items) => {
        const oldIndex = items.findIndex((item) => `position-${item.position}` === active.id)
        const newIndex = items.findIndex((item) => `position-${item.position}` === over.id)

        const newPositions = arrayMove(items, oldIndex, newIndex)
        
        // Actualizar números de posición y puntos
        return newPositions.map((pos, index) => ({
          ...pos,
          position: index + 1,
          points: getPointsForPosition(index + 1, formData.type)
        }))
      })
    }
  }

  // Componente SortableItem
  const SortableItem = ({ position, index }: { position: PositionRow; index: number }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: `position-${position.position}` })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`grid grid-cols-12 gap-4 items-center py-2 border-b border-gray-200 last:border-b-0 ${
          isDragging ? 'bg-blue-50 shadow-md' : ''
        }`}
      >
        <div className="col-span-1 flex items-center justify-center">
          <div 
            {...attributes} 
            {...listeners}
            className="text-gray-400 hover:text-gray-600 cursor-grab"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
            </svg>
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-sm font-medium text-gray-900">
            {position.position}º
          </div>
        </div>
        <div className="col-span-6">
          <TeamSelector
            teams={teams.filter(team => {
              // Filtrar equipos ya seleccionados
              const notSelected = !positions.some((pos, i) => i !== index && pos.teamId === team.id)
              
              // Para torneos regionales, solo mostrar equipos de esa región
              if (formData.type === 'REGIONAL' && formData.regionId) {
                return notSelected && team.regionId === formData.regionId
              }
              
              // Para torneos nacionales, mostrar todos los equipos
              return notSelected
            })}
            value={position.teamId}
            onChange={(teamId) => updatePosition(index, 'teamId', teamId)}
            placeholder="Seleccionar equipo"
          />
        </div>
        <div className="col-span-2">
          <div className="text-sm font-medium text-gray-900">
            {position.points}
          </div>
        </div>
        <div className="col-span-1">
          <button
            type="button"
            onClick={() => removePosition(index)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin/tournaments')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all duration-200 shadow-sm"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Nuevo torneo</h1>
                <p className="text-gray-600 mt-1">Crear un nuevo torneo en el sistema</p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${formData.type ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div className={`w-2 h-2 rounded-full ${formData.season && formData.surface && formData.modality ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div className={`w-2 h-2 rounded-full ${formData.startDate && formData.endDate && formData.location ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div className={`w-2 h-2 rounded-full ${positions.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              </div>
              <span className="text-sm text-gray-500">Progreso</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Generated Name Preview */}
          {generatedName && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Nombre del torneo:</h3>
              <p className="text-lg font-semibold text-blue-800">{generatedName}</p>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              {/* Season */}
              <div>
                <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-2">
                  Temporada *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="season"
                    value={formData.season}
                    onChange={(e) => handleInputChange('season', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.season ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar temporada</option>
                    {seasons.map((season) => (
                      <option key={season.value} value={season.value}>
                        {season.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.season && (
                  <p className="mt-1 text-sm text-red-600">{errors.season}</p>
                )}
              </div>

              {/* Region (only for Regional tournaments) */}
              {formData.type === 'REGIONAL' && (
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
                      {regions.map((region: Region) => (
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
            </div>
          </div>

          {/* Tournament Dates and Location */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Fechas y Ubicación</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Start Date */}
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de inicio *
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
                  Fecha de fin *
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

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación *
                </label>
                <LocationAutocomplete
                  value={formData.location}
                  onChange={(value) => handleInputChange('location', value)}
                  placeholder="Ej: Madrid, España"
                  error={errors.location}
                />
              </div>
            </div>
          </div>

          {/* Positions Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Posiciones del Torneo</h3>
            
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                  Usa los botones para agregar posiciones individualmente o pegar un listado completo
                </p>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowPasteModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Clipboard className="h-4 w-4" />
                    <span>Pegar listado</span>
                  </button>
                  <button
                    type="button"
                    onClick={addPosition}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Agregar Posición</span>
                  </button>
                </div>
                </div>

                {positions.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="grid grid-cols-12 gap-4 mb-4 text-sm font-semibold text-gray-700 bg-gray-50 rounded-lg p-3">
                      <div className="col-span-1">Orden</div>
                      <div className="col-span-2">Posición</div>
                      <div className="col-span-6">Equipo</div>
                      <div className="col-span-2">Puntos</div>
                      <div className="col-span-1">Acciones</div>
                    </div>
                    
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={positions.map(pos => `position-${pos.position}`)}
                        strategy={verticalListSortingStrategy}
                      >
                        {positions.map((position, index) => (
                          <SortableItem key={`position-${position.position}`} position={position} index={index} />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                )}
              </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-8">
            <button
              type="button"
              onClick={() => navigate('/admin/tournaments')}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || createTournamentMutation.isPending}
              className="px-6 py-3 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm hover:shadow-md"
            >
              {isLoading || createTournamentMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Crear Torneo
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Paste Positions Modal */}
      <PastePositionsModal
        isOpen={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        onApply={handlePastePositions}
        teams={teams}
      />
      </div>
    </div>
  )
}

export default NewTournamentPage
