import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Calendar, MapPin, Trophy, Users, Trash2, Plus, Eye, Clipboard, Copy } from 'lucide-react'
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
  coefficient: number
}

interface Team {
  id: string
  name: string
  region?: {
    id: string
    name: string
  }
}

interface Tournament {
  id: string
  name: string
  year: number
  type: string
  surface: string
  modality: string
  regionId?: string
  startDate: string
  endDate: string
  location: string
  createdAt: string
  updatedAt: string
}

const EditTournamentPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
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
  
  // Verificar si el torneo ya terminó (incluyendo el mismo día)
  const isTournamentFinished = () => {
    if (!formData.endDate) return false
    const endDate = new Date(formData.endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Resetear horas para comparar solo fechas
    endDate.setHours(0, 0, 0, 0) // Resetear horas para comparar solo fechas
    return endDate <= today
  }
  const [generatedName, setGeneratedName] = useState('')

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

  // Mutación para actualizar torneo
  const updateTournamentMutation = useMutation({
    mutationFn: (data: any) => tournamentsService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
      toast.success('Torneo actualizado exitosamente')
      navigate('/admin/tournaments')
    },
    onError: (error: any) => {
      console.error('Error al actualizar torneo:', error)
      toast.error('Error al actualizar el torneo')
    }
  })

  // Mutación para eliminar torneo
  const deleteTournamentMutation = useMutation({
    mutationFn: () => tournamentsService.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
      toast.success('Torneo eliminado exitosamente')
      navigate('/admin/tournaments')
    },
    onError: (error: any) => {
      console.error('Error al eliminar torneo:', error)
      toast.error('Error al eliminar el torneo')
    }
  })

  useEffect(() => {
    if (id) {
      loadTournament()
    }
  }, [id])

  const loadTournament = async () => {
    setIsLoading(true)
    try {
      const response = await tournamentsService.getById(id!)
      const tournament = response.data
      
      // Convertir año a temporada
      const seasonValue = `${tournament.year}/${(tournament.year + 1).toString().slice(-2)}`
      
      setFormData({
        type: tournament.type,
        season: seasonValue,
        surface: tournament.surface,
        modality: tournament.modality,
        regionId: tournament.regionId || '',
        startDate: tournament.startDate ? new Date(tournament.startDate).toISOString().split('T')[0] : '',
        endDate: tournament.endDate ? new Date(tournament.endDate).toISOString().split('T')[0] : '',
        location: tournament.location
      })
      
      setGeneratedName(tournament.name)
      
      // Cargar posiciones existentes si las hay
      if (tournament.positions && tournament.positions.length > 0) {
        const existingPositions = tournament.positions.map((pos: any) => ({
          position: pos.position,
          teamId: pos.teamId,
          points: pos.points
        }))
        setPositions(existingPositions)
      }
    } catch (error) {
      console.error('Error al cargar torneo:', error)
      toast.error('Error al cargar el torneo')
      navigate('/admin/tournaments')
    } finally {
      setIsLoading(false)
    }
  }

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

    setIsSaving(true)

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

      const result = await updateTournamentMutation.mutateAsync(tournamentData)

      // Si hay posiciones, actualizarlas también
      if (positions.length > 0) {
        const positionsWithTeams = positions.filter(p => p.teamId)
        await tournamentsService.updatePositions(id!, positionsWithTeams)
      } else {
        // Si no hay posiciones, eliminar las existentes
        await tournamentsService.updatePositions(id!, [])
      }
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
      await deleteTournamentMutation.mutateAsync()
    } catch (error) {
      console.error('Error al eliminar torneo:', error)
      toast.error('Error al eliminar el torneo')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleInputChange = (field: keyof TournamentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    validateField(field, value)
  }

  const updatePosition = (index: number, field: keyof PositionRow, value: string | number) => {
    setPositions(prev => {
      const updated = prev.map((pos, i) => {
        if (i === index) {
          const updatedPos = { ...pos, [field]: value }
          // Recalcular puntos si cambió la posición o el tipo de torneo
          if (field === 'position' && formData.type) {
            updatedPos.points = getPointsForPosition(Number(value), formData.type)
          }
          return updatedPos
        }
        return pos
      })
      
      // Si se seleccionó un equipo y es la última posición, agregar una nueva posición vacía
      if (field === 'teamId' && value && index === updated.length - 1) {
        const newPosition = updated.length + 1
        updated.push({
          position: newPosition,
          teamId: '',
          points: getPointsForPosition(newPosition, formData.type)
        })
      }
      
      return updated
    })
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

  const handleDuplicateTournament = () => {
    if (window.confirm('¿Estás seguro de que quieres duplicar este torneo? Se creará una copia con un nuevo nombre.')) {
      // Crear datos del torneo duplicado
      const duplicatedData = {
        ...formData,
        // Generar nuevo nombre agregando "Copia" al final
        name: `${generatedName} - Copia`
      }
      
      // Navegar a la página de nuevo torneo con los datos pre-rellenados
      const queryParams = new URLSearchParams({
        duplicate: 'true',
        type: duplicatedData.type,
        season: duplicatedData.season,
        surface: duplicatedData.surface,
        modality: duplicatedData.modality,
        regionId: duplicatedData.regionId || '',
        location: duplicatedData.location
      })
      
      navigate(`/admin/tournaments/new?${queryParams.toString()}`)
      toast.success('Torneo duplicado. Puedes editarlo antes de guardar.')
    }
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
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDuplicateTournament}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
            >
              <Copy className="h-4 w-4" />
              <span>Duplicar</span>
            </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar Torneo
          </button>
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

          {/* Positions Section - Solo si el torneo ya terminó */}
          {isTournamentFinished() && (
            <div className="border-t border-gray-200 pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">Posiciones del Torneo</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Configura las posiciones finales del torneo
                </p>
              </div>
            
            <div className="space-y-4">
              {positions.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-12 gap-4 mb-3 text-sm font-medium text-gray-700">
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
              
              {/* Botón agregar posición al final */}
              <div className="flex justify-center space-x-4">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Clipboard className="h-4 w-4" />
                  <span>Pegar listado</span>
                </button>
                <button
                  type="button"
                  onClick={addPosition}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Agregar Posición</span>
                </button>
              </div>
            </div>
          </div>
          )}

          {/* Mensaje cuando el torneo no ha terminado */}
          {!isTournamentFinished() && formData.endDate && (
            <div className="border-t border-gray-200 pt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Las posiciones del torneo estarán disponibles a partir del {new Date(formData.endDate).toLocaleDateString('es-ES')}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

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
              disabled={isSaving || updateTournamentMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSaving || updateTournamentMutation.isPending ? (
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl p-8 w-full max-w-md mx-auto">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-6">
              <Trash2 className="h-8 w-8 text-red-600" />
              </div>
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Eliminar Torneo
              </h3>
              <p className="text-gray-600 mb-4">
                ¿Estás seguro de que quieres eliminar este torneo?
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Trophy className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-800">{generatedName}</span>
                </div>
                <div className="text-sm text-red-700 space-y-1">
                  <p><strong>Tipo:</strong> {tournamentTypes.find(t => t.value === formData.type)?.label}</p>
                  <p><strong>Temporada:</strong> {formData.season}</p>
                  <p><strong>Ubicación:</strong> {formData.location}</p>
                  {positions.length > 0 && (
                    <p><strong>Posiciones:</strong> {positions.length} equipos</p>
                  )}
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold text-yellow-800">Advertencia</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Esta acción <strong>no se puede deshacer</strong>. Se eliminarán permanentemente:
                </p>
                <ul className="text-sm text-yellow-700 mt-2 text-left list-disc list-inside">
                  <li>El torneo y toda su información</li>
                  <li>Todas las posiciones y resultados</li>
                  <li>Los puntos de ranking asociados</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || deleteTournamentMutation.isPending}
                className="px-6 py-3 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isDeleting || deleteTournamentMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar Definitivamente
                  </>
                )}
                </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Paste Positions Modal */}
      <PastePositionsModal
        isOpen={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        onApply={handlePastePositions}
        teams={teams}
      />
    </div>
  )
}

export default EditTournamentPage
