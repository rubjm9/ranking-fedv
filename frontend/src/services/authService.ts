import axios from 'axios'
import { ApiResponse, LoginRequest, LoginResponse, User } from '@/types'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || ''

// Configurar axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para añadir token a las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Axios error:', error)
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authService = {
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      console.log('Enviando credenciales:', credentials)
      console.log('Tipo de email:', typeof credentials.email)
      console.log('Tipo de password:', typeof credentials.password)
      const body = JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
      console.log('Body JSON:', body)
      console.log('Body JSON type:', typeof body)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body
      })
      
      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      
      return data
    } catch (error: any) {
      console.error('Error en login:', error)
      return {
        success: false,
        error: 'Error en el inicio de sesión'
      }
    }
  },

  async verifyToken(token: string): Promise<User> {
    try {
      const response = await api.post('/api/auth/verify', { token })
      return response.data.data.user
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error verificando token')
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout')
    } catch (error) {
      console.error('Error en logout:', error)
    }
  },

  getToken(): string | null {
    return localStorage.getItem('token')
  },

  setToken(token: string): void {
    localStorage.setItem('token', token)
  },

  removeToken(): void {
    localStorage.removeItem('token')
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token')
  }
}
