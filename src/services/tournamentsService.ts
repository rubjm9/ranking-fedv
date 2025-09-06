import api from './apiService'

export interface Tournament {
  id: string
  name: string
  type: string
  year: number
  surface: string
  modality: string
  regionId?: string
  region?: Region
  createdAt: string
  updatedAt: string
}

export interface Region {
  id: string
  name: string
  code: string
  coefficient: number
  description?: string
  floor?: number
  ceiling?: number
  increment?: number
  createdAt: string
  updatedAt: string
  _count?: {
    teams: number
    tournaments: number
  }
}

export interface TournamentsResponse {
  success: boolean
  data: Tournament[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  message: string
}

export interface TournamentResponse {
  success: boolean
  data: Tournament
  message: string
}

const tournamentsService = {
  // Obtener todos los torneos con filtros
  getAll: async (params?: {
    regionId?: string
    search?: string
    sortBy?: string
    sortOrder?: string
    limit?: number
    offset?: number
  }): Promise<TournamentsResponse> => {
    const queryParams = new URLSearchParams()
    
    if (params?.regionId) queryParams.append('regionId', params.regionId)
    if (params?.search) queryParams.append('search', params.search)
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())

    const response = await api.get(`/tournaments?${queryParams.toString()}`)
    return response.data
  },

  // Obtener torneo específico
  getById: async (id: string): Promise<TournamentResponse> => {
    const response = await api.get(`/tournaments/${id}`)
    return response.data
  },

  // Crear nuevo torneo
  create: async (data: Partial<Tournament>): Promise<TournamentResponse> => {
    const response = await api.post('/tournaments', data)
    return response.data
  },

  // Actualizar torneo
  update: async (id: string, data: Partial<Tournament>): Promise<TournamentResponse> => {
    const response = await api.put(`/tournaments/${id}`, data)
    return response.data
  },

  // Eliminar torneo
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/tournaments/${id}`)
    return response.data
  }
}

export default tournamentsService
