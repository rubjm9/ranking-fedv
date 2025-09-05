import axios from 'axios'
import { supabase } from './supabaseService'

// Configuración base de axios
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar token de Supabase
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`
      }
    } catch (error) {
      console.error('Error obteniendo token de Supabase:', error)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Cerrar sesión en Supabase
      await supabase.auth.signOut()
      // Redirigir a la página de login correcta
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

// Tipos de datos
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
  teams?: any[]
  tournaments?: any[]
}

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

export interface RankingEntry {
  id: string
  teamId: string
  teamName: string
  region: string
  points: number
  position: number
  change: number
  tournaments: number
  lastUpdate: string
}

export interface Configuration {
  id: string
  key: string
  value: string
  description?: string
  updatedAt: string
}

// Servicios de equipos
export const teamsService = {
  // Obtener todos los equipos
  getAll: async (params?: { search?: string; region?: string }) => {
    const response = await api.get('/api/teams', { params })
    return response.data
  },

  // Obtener un equipo por ID
  getById: async (id: string) => {
    const response = await api.get(`/api/teams/${id}`)
    return response.data
  },

  // Crear un nuevo equipo
  create: async (teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post('/api/teams', teamData)
    return response.data
  },

  // Actualizar un equipo
  update: async (id: string, teamData: Partial<Team>) => {
    const response = await api.put(`/api/teams/${id}`, teamData)
    return response.data
  },

  // Eliminar un equipo
  delete: async (id: string) => {
    const response = await api.delete(`/api/teams/${id}`)
    return response.data
  }
}

// Servicios de regiones
export const regionsService = {
  // Obtener todas las regiones
  getAll: async (params?: { search?: string }) => {
    const response = await api.get('/api/regions', { params })
    return response.data
  },

  // Obtener una región por ID
  getById: async (id: string) => {
    const response = await api.get(`/api/regions/${id}`)
    return response.data
  },

  // Crear una nueva región
  create: async (regionData: Omit<Region, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post('/api/regions', regionData)
    return response.data
  },

  // Actualizar una región
  update: async (id: string, regionData: Partial<Region>) => {
    const response = await api.put(`/api/regions/${id}`, regionData)
    return response.data
  },

  // Eliminar una región
  delete: async (id: string) => {
    const response = await api.delete(`/api/regions/${id}`)
    return response.data
  },

  // Recalcular coeficientes
  recalculateCoefficients: async () => {
    const response = await api.post('/api/regions/recalculate-coefficients')
    return response.data
  }
}

// Servicios de torneos
export const tournamentsService = {
  // Obtener todos los torneos
  getAll: async (params?: { search?: string; type?: string; year?: number }) => {
    const response = await api.get('/api/tournaments', { params })
    return response.data
  },

  // Obtener un torneo por ID
  getById: async (id: string) => {
    const response = await api.get(`/api/tournaments/${id}`)
    return response.data
  },

  // Crear un nuevo torneo
  create: async (tournamentData: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post('/api/tournaments', tournamentData)
    return response.data
  },

  // Actualizar un torneo
  update: async (id: string, tournamentData: Partial<Tournament>) => {
    const response = await api.put(`/api/tournaments/${id}`, tournamentData)
    return response.data
  },

  // Eliminar un torneo
  delete: async (id: string) => {
    const response = await api.delete(`/api/tournaments/${id}`)
    return response.data
  }
}

// Servicios de ranking
export const rankingService = {
  // Obtener ranking actual
  getCurrent: async (params?: { region?: string; limit?: number }) => {
    const response = await api.get('/api/ranking/current', { params })
    return response.data
  },

  // Obtener historial de ranking
  getHistory: async (params?: { teamId?: string; startDate?: string; endDate?: string }) => {
    const response = await api.get('/api/ranking/history', { params })
    return response.data
  },

  // Recalcular ranking
  recalculate: async () => {
    const response = await api.post('/api/ranking/recalculate')
    return response.data
  },

  // Exportar ranking
  export: async (format: 'excel' | 'csv' | 'json', options?: any) => {
    const response = await api.post('/api/ranking/export', { format, options }, {
      responseType: 'blob'
    })
    return response.data
  }
}

// Servicios de configuración
export const configurationService = {
  // Obtener toda la configuración
  getAll: async () => {
    const response = await api.get('/api/configuration')
    return response.data
  },

  // Obtener configuración por clave
  getByKey: async (key: string) => {
    const response = await api.get(`/api/configuration/${key}`)
    return response.data
  },

  // Actualizar configuración
  update: async (key: string, value: string) => {
    const response = await api.put(`/api/configuration/${key}`, { value })
    return response.data
  },

  // Restablecer configuración por defecto
  reset: async () => {
    const response = await api.post('/api/configuration/reset')
    return response.data
  }
}

// Servicios de importación/exportación
export const importExportService = {
  // Importar datos
  import: async (files: File[], options: any) => {
    const formData = new FormData()
    files.forEach((file, index) => {
      formData.append(`files`, file)
    })
    formData.append('options', JSON.stringify(options))
    
    const response = await api.post('/api/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Exportar datos
  export: async (options: any) => {
    const response = await api.post('/api/export', options, {
      responseType: 'blob'
    })
    return response.data
  },

  // Validar archivo de importación
  validateFile: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post('/api/import/validate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }
}

// Servicios de estadísticas
export const statsService = {
  // Obtener estadísticas generales
  getGeneral: async () => {
    const response = await api.get('/api/stats/general')
    return response.data
  },

  // Obtener estadísticas de equipo
  getTeamStats: async (teamId: string) => {
    const response = await api.get(`/api/stats/teams/${teamId}`)
    return response.data
  },

  // Obtener estadísticas de región
  getRegionStats: async (regionId: string) => {
    const response = await api.get(`/api/stats/regions/${regionId}`)
    return response.data
  },

  // Obtener estadísticas de torneo
  getTournamentStats: async (tournamentId: string) => {
    const response = await api.get(`/api/stats/tournaments/${tournamentId}`)
    return response.data
  }
}

export default api
