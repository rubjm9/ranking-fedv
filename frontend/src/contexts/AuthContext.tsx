import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, LoginRequest, LoginResponse } from '@/types'
import { authService } from '@/services/authService'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Verificar token al cargar la aplicación
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        if (token) {
          const userData = await authService.verifyToken(token)
          setUser(userData)
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error)
        localStorage.removeItem('token')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await authService.login(credentials)
      
      if (response.success && response.data) {
        const { token, user: userData } = response.data
        localStorage.setItem('token', token)
        setUser(userData)
        toast.success('Inicio de sesión exitoso')
        return true
      } else {
        toast.error(response.error || 'Error en el inicio de sesión')
        return false
      }
    } catch (error) {
      console.error('Error en login:', error)
      toast.error('Error en el inicio de sesión')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    toast.success('Sesión cerrada')
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
