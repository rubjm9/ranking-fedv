import api from './apiService'

export interface Team {
  id: string
  name: string
  regionId: string
  region?: Region
  email?: string
  logo?: string
  isFilial: boolean
  parentTeamId?: string
  parentTeam?: Team
  hasDifferentNames: boolean
  nameOpen?: string
  nameWomen?: string
  nameMixed?: string
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

export interface TeamsResponse {
  success: boolean
  data: Team[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  message: string
}

export interface TeamResponse {
  success: boolean
  data: Team
  message: string
}

const teamsService = {
  // Obtener todos los equipos con filtros
  getAll: async (params?: {
    regionId?: string
    search?: string
    sortBy?: string
    sortOrder?: string
    limit?: number
    offset?: number
  }): Promise<TeamsResponse> => {
    const queryParams = new URLSearchParams()
    
    if (params?.regionId) queryParams.append('regionId', params.regionId)
    if (params?.search) queryParams.append('search', params.search)
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())

    const response = await api.get(`/teams?${queryParams.toString()}`)
    return response.data
  },

  // Obtener equipo específico
  getById: async (id: string): Promise<TeamResponse> => {
    const response = await api.get(`/teams/${id}`)
    return response.data
  },

  // Crear nuevo equipo
  create: async (data: Partial<Team>): Promise<TeamResponse> => {
    const response = await api.post('/teams', data)
    return response.data
  },

  // Actualizar equipo
  update: async (id: string, data: Partial<Team>): Promise<TeamResponse> => {
    const response = await api.put(`/teams/${id}`, data)
    return response.data
  },

  // Eliminar equipo
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/teams/${id}`)
    return response.data
  }
}

export default teamsService
