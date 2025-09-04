import api from './apiService'

export interface Position {
  id: string
  position: number
  points: number
  teamId: string
  tournamentId: string
  createdAt: string
  updatedAt: string
  team?: {
    id: string
    name: string
    region?: {
      id: string
      name: string
      code: string
      coefficient: number
    }
  }
  tournament?: {
    id: string
    name: string
    type: string
    year: number
    surface: string
    modality: string
  }
}

export interface CreatePositionData {
  tournamentId: string
  teamId: string
  position: number
}

export interface UpdatePositionData {
  position: number
}

export interface PositionsResponse {
  success: boolean
  data: Position[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  message: string
}

export interface PositionResponse {
  success: boolean
  data: Position
  message: string
}

const positionsService = {
  // Obtener todas las posiciones con filtros
  getAll: async (params?: {
    tournamentId?: string
    teamId?: string
    regionId?: string
    search?: string
    sortBy?: string
    sortOrder?: string
    limit?: number
    offset?: number
  }): Promise<PositionsResponse> => {
    const queryParams = new URLSearchParams()
    
    if (params?.tournamentId) queryParams.append('tournamentId', params.tournamentId)
    if (params?.teamId) queryParams.append('teamId', params.teamId)
    if (params?.regionId) queryParams.append('regionId', params.regionId)
    if (params?.search) queryParams.append('search', params.search)
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())

    const response = await api.get(`/positions?${queryParams.toString()}`)
    return response.data
  },

  // Obtener posición específica
  getById: async (id: string): Promise<PositionResponse> => {
    const response = await api.get(`/positions/${id}`)
    return response.data
  },

  // Crear nueva posición
  create: async (data: CreatePositionData): Promise<PositionResponse> => {
    const response = await api.post('/positions', data)
    return response.data
  },

  // Actualizar posición
  update: async (id: string, data: UpdatePositionData): Promise<PositionResponse> => {
    const response = await api.put(`/positions/${id}`, data)
    return response.data
  },

  // Eliminar posición
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/positions/${id}`)
    return response.data
  },

  // Obtener posiciones de un torneo específico
  getByTournament: async (tournamentId: string): Promise<PositionsResponse> => {
    return positionsService.getAll({ tournamentId })
  },

  // Obtener posiciones de un equipo específico
  getByTeam: async (teamId: string): Promise<PositionsResponse> => {
    return positionsService.getAll({ teamId })
  }
}

export default positionsService
