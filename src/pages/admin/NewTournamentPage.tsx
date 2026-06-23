import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Calendar, MapPin, Trophy, Users, Plus, Trash2, Clipboard } from 'lucide-react'
import subseasonDetectionService from '@/services/subseasonDetectionService'
import { markRankingDirtyAfterEdit } from '@/services/rankingStateService'
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
  getOffsetForTournament,
  DEFAULT_DIVISION_SIZE,
  DIVISION_SIZE_MIN,
  DIVISION_SIZE_MAX,
  DIVISION_SIZE_PRESETS,
  clampDivisionSize,
  getEffectiveDivisionSize,
  validateTournamentDates,
  getYearFromSeason,
  formatTournamentCombinationLabel,
  type TournamentFormData,
  type PositionRow
} from '@/utils/tournamentUtils'
import { tournamentsService, teamsService, regionsService, DuplicateTournamentError } from '@/services/apiService'

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
    category: '',
    regionId: '',
    startDate: '',
    endDate: '',
    location: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [positions, setPositions] = useState<PositionRow[]>([])
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [generatedName, setGeneratedName] = useState('')
  const [focusNextPosition, setFocusNextPosition] = useState(false)
  const duplicateToastShownRef = useRef(false)

  // Cargar datos de duplicación si existen (toast una sola vez aunque el efecto se ejecute dos veces p. ej. Strict Mode)
  useEffect(() => {
    const isDuplicate = searchParams.get('duplicate') === 'true'
    if (!isDuplicate) {
      duplicateToastShownRef.current = false
      return
    }
    const duplicateData: TournamentFormData = {
      type: searchParams.get('type') || '',
      season: searchParams.get('season') || '',
      surface: searchParams.get('surface') || '',
      category: searchParams.get('category') || '',
      regionId: searchParams.get('regionId') || '',
      startDate: '',
      endDate: '',
      location: searchParams.get('location') || ''
    }
    setFormData(duplicateData)
    if (!duplicateToastShownRef.current) {
      duplicateToastShownRef.current = true
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

  // CE1 de la misma modalidad para asociar un CE2 (define el offset de la curva)
  const { data: ce1Data } = useQuery({
    queryKey: ['ce1-by-modality', formData.season, formData.surface, formData.category],
    queryFn: () => tournamentsService.getCE1ByModality(
      getYearFromSeason(formData.season),
      formData.surface,
      formData.category
    ),
    enabled: formData.type === 'CE2' && !!formData.season && !!formData.surface && !!formData.category
  })
  const ce1Options = ce1Data?.data || []

  const resolveParentDivisionSize = (parent?: { divisionSize?: number | null; positionCount?: number }) =>
    getEffectiveDivisionSize(parent?.divisionSize, parent?.positionCount)

  // Offset en la curva nacional (0 para CE1/REGIONAL; tamaño de la 1ª para CE2)
  const offset = useMemo(
    () => getOffsetForTournament(formData.type, formData.divisionSize),
    [formData.type, formData.divisionSize]
  )

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

  const categories = [
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
      formData.category,
      formData.season
    )
    setGeneratedName(name)
  }, [formData.type, formData.regionId, formData.surface, formData.category, formData.season, regions])

  // Generar posiciones por defecto cuando cambie el tipo de torneo
  useEffect(() => {
    if (formData.type) {
      setPositions(generateDefaultPositions(formData.type, offset))
    }
  }, [formData.type])

  // Recalcular puntos de las posiciones cuando cambie el offset (p. ej. al asociar la 1ª)
  useEffect(() => {
    setPositions(prev => prev.map(pos => ({
      ...pos,
      points: getPointsForPosition(pos.position, formData.type, offset)
    })))
  }, [offset])

  // CE2: sincronizar offset con el CE1 asociado cuando carguen las opciones o cambie la selección
  useEffect(() => {
    if (formData.type !== 'CE2' || !formData.parentTournamentId) return
    const parent = ce1Options.find((t: { id: string }) => t.id === formData.parentTournamentId)
    if (!parent) return
    const effectiveSize = resolveParentDivisionSize(parent)
    setFormData((prev) =>
      prev.divisionSize === effectiveSize ? prev : { ...prev, divisionSize: effectiveSize }
    )
  }, [formData.type, formData.parentTournamentId, ce1Options])

  const showDuplicateTournamentAlert = (existingId: string) => {
    const selectedRegion = regions.find((r: Region) => r.id === formData.regionId)
    const combinationLabel = formatTournamentCombinationLabel({
      type: formData.type,
      surface: formData.surface,
      category: formData.category,
      season: formData.season,
      regionName: selectedRegion?.name,
    })

    toast(
      (t) => (
        <div className="text-sm">
          <p className="font-medium">Torneo ya existente</p>
          <p className="mt-1">
            Ya hay un torneo con esta combinación ({combinationLabel}). Puedes añadir los resultados editándolo.
          </p>
          <button
            type="button"
            className="mt-2 text-blue-600 underline font-medium"
            onClick={() => {
              toast.dismiss(t.id)
              navigate(`/admin/tournaments/${existingId}/edit`)
            }}
          >
            Ir al torneo existente
          </button>
        </div>
      ),
      { duration: 10000, icon: '⚠️' }
    )
  }

  // Mutación para crear torneo
  const createTournamentMutation = useMutation({
    mutationFn: async (data: any) => {
      return tournamentsService.create(data)
    },
    onSuccess: async (_, variables) => {
      const affectsCoefficients = variables.type === 'CE1' || variables.type === 'CE2'
      void markRankingDirtyAfterEdit('Torneo creado', { affectsCoefficients })
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
      queryClient.invalidateQueries({ queryKey: ['ranking-state'] })
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-pending'] })
      // Verificar si hay subtemporadas/temporadas completadas (semiautomático)
      if (variables.season) {
        try {
          await subseasonDetectionService.runFullCheck(variables.season)
          queryClient.invalidateQueries({ queryKey: ['admin-notifications-pending'] })
        } catch (error) {
          console.warn('Error verificando subtemporadas:', error)
        }
      }
      
      navigate('/admin/tournaments')
    },
    onError: (error: unknown) => {
      if (error instanceof DuplicateTournamentError) return
      console.error('Error al crear torneo:', error)
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

    if (!formData.category) {
      newErrors.category = 'La categoría es requerida'
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

    if (
      (formData.type === 'CE1' || formData.type === 'CE2') &&
      (formData.divisionSize == null ||
        formData.divisionSize < DIVISION_SIZE_MIN ||
        formData.divisionSize > DIVISION_SIZE_MAX)
    ) {
      newErrors.divisionSize = `El tamaño de división debe estar entre ${DIVISION_SIZE_MIN} y ${DIVISION_SIZE_MAX}`
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
        
      case 'category':
        if (!value) {
          newErrors.category = 'La categoría es requerida'
        } else {
          delete newErrors.category
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
      case 'endDate': {
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
      }
        
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
        category: formData.category,
        regionId: formData.regionId || null,
        divisionSize: formData.divisionSize ?? null,
        parentTournamentId: formData.parentTournamentId ?? null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        location: formData.location
      }

      const result = await createTournamentMutation.mutateAsync(tournamentData)

      // Si hay posiciones, crearlas también (el cierre de subtemporadas se hace desde Admin > Subtemporadas)
      if (positions.length > 0) {
        const positionsWithTeams = positions.filter(p => p.teamId)
        await tournamentsService.updatePositions(result.data.id, positionsWithTeams)
      }
      toast.success('Torneo creado exitosamente')
    } catch (error) {
      if (error instanceof DuplicateTournamentError) {
        showDuplicateTournamentAlert(error.existing.id)
        return
      }
      console.error('Error al crear torneo:', error)
      toast.error('Error al crear el torneo')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof TournamentFormData, value: string) => {
    setFormData(prev => {
      const next: TournamentFormData = { ...prev, [field]: value }
      if (field === 'type') {
        // CE1/CE2 usan el tamaño de división estándar; REGIONAL no aplica
        next.divisionSize = value === 'CE1' || value === 'CE2' ? DEFAULT_DIVISION_SIZE : undefined
        next.parentTournamentId = undefined
      }
      return next
    })
    validateField(field, value)
  }

  // Asociar un CE2 a su CE1: el offset = tamaño efectivo de la 1ª elegida
  const handleParentChange = (parentId: string) => {
    const parent = ce1Options.find((t: { id: string }) => t.id === parentId)
    setFormData(prev => ({
      ...prev,
      parentTournamentId: parentId || undefined,
      divisionSize: parentId ? resolveParentDivisionSize(parent) : DEFAULT_DIVISION_SIZE
    }))
  }

  const updatePosition = (index: number, field: keyof PositionRow, value: string | number) => {
    setPositions(prev => {
      const updatedPositions = prev.map((pos, i) => {
        if (i === index) {
          const updated = { ...pos, [field]: value }
          // Recalcular puntos si cambió la posición o el tipo de torneo
          if (field === 'position' && formData.type) {
            updated.points = getPointsForPosition(Number(value), formData.type, offset)
          }
          return updated
        }
        return pos
      })

      return updatedPositions
    })
  }

  const handleTeamSelected = (index: number, teamId: string, viaKeyboard: boolean) => {
    updatePosition(index, 'teamId', teamId)
    
    // Si fue seleccionado por teclado, enfocar el siguiente puesto disponible
    if (viaKeyboard) {
      const nextIndex = index + 1
      
      // Auto-generar siguiente posición si es necesario (especialmente para el puesto 3)
      if (index === 2 && positions.length === 3) {
        addPosition()
        setTimeout(() => {
          // Buscar el elemento del puesto 4 que acabamos de crear
          const newTeamSelector = document.querySelector(`[data-position="4"]`) as HTMLElement
          if (newTeamSelector) {
            newTeamSelector.click()
          }
        }, 200)
      } else if (nextIndex < positions.length) {
        // Enfocar el siguiente puesto existente
        setTimeout(() => {
          const nextPosition = positions[nextIndex]
          const nextTeamSelector = document.querySelector(`[data-position="${nextPosition.position}"]`) as HTMLElement
          if (nextTeamSelector) {
            nextTeamSelector.click()
          }
        }, 100)
      } else {
        // Si no hay siguiente puesto, agregar uno nuevo
        addPosition()
        setTimeout(() => {
          const newPosition = positions.length + 1
          const newTeamSelector = document.querySelector(`[data-position="${newPosition}"]`) as HTMLElement
          if (newTeamSelector) {
            newTeamSelector.click()
          }
        }, 200)
      }
    }
  }

  const addPosition = () => {
    const newPosition = positions.length + 1
    setPositions(prev => [...prev, {
      position: newPosition,
      teamId: '',
      points: getPointsForPosition(newPosition, formData.type, offset)
    }])
  }

  const removePosition = (index: number) => {
    setPositions(prev => {
      const updated = prev.filter((_, i) => i !== index)
      // Reordenar posiciones
      return updated.map((pos, i) => ({
        ...pos,
        position: i + 1,
        points: getPointsForPosition(i + 1, formData.type, offset)
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
        points: getPointsForPosition(index + 1, formData.type, offset)
      }
    })

    // Reemplazar todas las posiciones existentes
    setPositions(newPositions)
    // Toast mostrado por PastePositionsModal al aplicar
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
          points: getPointsForPosition(index + 1, formData.type, offset)
        }))
      })
    }
  }

  // Componente SortableItem
  const SortableItem = ({ position, index, shouldFocus }: { position: PositionRow; index: number; shouldFocus?: boolean }) => {
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

    // Manejar el enfoque automático
    useEffect(() => {
      if (shouldFocus) {
        // Pequeño delay para asegurar que el DOM se haya actualizado
        setTimeout(() => {
          const teamSelector = document.querySelector(`[data-position="${position.position}"]`) as HTMLElement
          if (teamSelector) {
            teamSelector.click()
          }
        }, 100)
        setFocusNextPosition(false)
      }
    }, [shouldFocus, position.position])

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
          <div data-position={position.position}>
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
              onTeamSelected={(teamId, viaKeyboard) => handleTeamSelected(index, teamId, viaKeyboard)}
              placeholder="Seleccionar equipo"
            />
          </div>
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
                <h1 className="page-header-title">Nuevo torneo</h1>
                <p className="text-gray-600 mt-1">Crear un nuevo torneo en el sistema</p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${formData.type ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div className={`w-2 h-2 rounded-full ${formData.season && formData.surface && formData.category ? 'bg-green-500' : 'bg-gray-300'}`}></div>
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

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.category ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              {/* Tamaño de división (CE1) u offset (CE2) */}
              {(formData.type === 'CE1' || formData.type === 'CE2') && (
                <div>
                  <label htmlFor="divisionSize" className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.type === 'CE2' ? 'Offset en curva (equipos en 1ª)' : 'Tamaño de división'}
                  </label>
                  {formData.type === 'CE2' && formData.parentTournamentId ? (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Users className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="divisionSize"
                        readOnly
                        value={formData.divisionSize ?? ''}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                      />
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Users className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          id="divisionSize"
                          min={DIVISION_SIZE_MIN}
                          max={DIVISION_SIZE_MAX}
                          value={formData.divisionSize ?? ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            divisionSize: e.target.value ? Number(e.target.value) : undefined
                          }))}
                          onBlur={() => {
                            if (formData.divisionSize != null) {
                              setFormData(prev => ({
                                ...prev,
                                divisionSize: clampDivisionSize(prev.divisionSize!)
                              }))
                            }
                          }}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        />
                      </div>
                      <select
                        aria-label="Valores habituales de tamaño de división"
                        value={
                          formData.divisionSize != null &&
                          DIVISION_SIZE_PRESETS.some((size) => size === formData.divisionSize)
                            ? formData.divisionSize
                            : ''
                        }
                        onChange={(e) => {
                          const value = Number(e.target.value)
                          if (value) {
                            setFormData(prev => ({ ...prev, divisionSize: value }))
                          }
                        }}
                        className="w-28 py-3 px-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-sm"
                      >
                        <option value="" disabled>
                          Valores
                        </option>
                        {DIVISION_SIZE_PRESETS.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.type === 'CE2' && formData.parentTournamentId
                      ? 'Calculado automáticamente desde el CE1 asociado. La 2ª continúa la curva en el puesto siguiente.'
                      : formData.type === 'CE2'
                        ? `Selecciona el CE1 asociado o indica manualmente el offset (entre ${DIVISION_SIZE_MIN} y ${DIVISION_SIZE_MAX}).`
                        : `Nº total de equipos en la 1ª división (no el nº de resultados introducidos). Entre ${DIVISION_SIZE_MIN} y ${DIVISION_SIZE_MAX}.`}
                  </p>
                  {errors.divisionSize && (
                    <p className="mt-1 text-sm text-red-600">{errors.divisionSize}</p>
                  )}
                </div>
              )}

              {/* Campeonato de 1ª asociado (solo CE2) */}
              {formData.type === 'CE2' && (
                <div>
                  <label htmlFor="parentTournamentId" className="block text-sm font-medium text-gray-700 mb-2">
                    Campeonato de 1ª asociado
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Trophy className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="parentTournamentId"
                      value={formData.parentTournamentId ?? ''}
                      onChange={(e) => handleParentChange(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    >
                      <option value="">Seleccionar 1ª división</option>
                      {ce1Options.map((t: { id: string; name: string; divisionSize?: number | null; positionCount?: number }) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({resolveParentDivisionSize(t)} equipos)
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {ce1Options.length === 0
                      ? 'No hay CE1 de esta modalidad/temporada; se usará el tamaño indicado arriba.'
                      : 'Define dónde continúa la 2ª en la curva nacional.'}
                  </p>
                </div>
              )}
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
                    className="btn-primary flex items-center gap-2"
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
                          <SortableItem 
                            key={`position-${position.position}`} 
                            position={position} 
                            index={index} 
                            shouldFocus={focusNextPosition && index === 3}
                          />
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
              className="btn-outline px-6 py-3 shadow-sm hover:shadow-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || createTournamentMutation.isPending}
              className="btn-primary px-6 py-3 flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
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
