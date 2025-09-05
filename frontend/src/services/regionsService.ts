import api from './apiService'

export interface Region {
  id: string
  name: string
  coefficient: number
  floor?: number
  ceiling?: number
  increment?: number
  createdAt: string
  updatedAt: string
}

export interface RegionsResponse {
  success: boolean
  data: Region[]
  message: string
}

const regionsService = {
  // Obtener todas las regiones
  getAll: async (): Promise<RegionsResponse> => {
    const response = await api.get('/regions')
    return response.data
  },

  // Obtener región específica
  getById: async (id: string): Promise<{ success: boolean; data: Region; message: string }> => {
    const response = await api.get(`/regions/${id}`)
    return response.data
  },

  // Crear nueva región
  create: async (data: Partial<Region>): Promise<{ success: boolean; data: Region; message: string }> => {
    const response = await api.post('/regions', data)
    return response.data
  },

  // Actualizar región
  update: async (id: string, data: Partial<Region>): Promise<{ success: boolean; data: Region; message: string }> => {
    const response = await api.put(`/regions/${id}`, data)
    return response.data
  },

  // Eliminar región
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/regions/${id}`)
    return response.data
  }
}

export default regionsService
