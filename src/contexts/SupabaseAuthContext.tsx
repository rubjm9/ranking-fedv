import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { authService, supabase } from '@/services/apiService'
import toast from 'react-hot-toast'

interface LoginRequest {
  email: string
  password: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<boolean>
  signUp: (credentials: LoginRequest) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  debugAuth: () => Promise<void>
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

  // Verificar autenticación al cargar la aplicación
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Verificando autenticación al cargar...')
        const response = await authService.getCurrentUser()
        console.log('👤 Usuario actual:', response.data)
        setUser(response.data)
      } catch (error) {
        console.error('❌ Error verificando autenticación:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Cambio en estado de autenticación:', session?.user ? 'Usuario logueado' : 'Usuario deslogueado')
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      setIsLoading(true)
      console.log('🔐 Intentando login con:', credentials.email)
      
      const response = await authService.login(credentials.email, credentials.password)
      console.log('📋 Respuesta del login:', response)
      
      if (response.success && response.data) {
        setUser(response.data.user)
        toast.success('Inicio de sesión exitoso')
        return true
      } else {
        console.error('❌ Error en login:', response.error)
        toast.error(response.error || 'Error en el inicio de sesión')
        return false
      }
    } catch (error) {
      console.error('❌ Error en login:', error)
      toast.error('Error en el inicio de sesión')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await authService.login(credentials.email, credentials.password)
      
      if (response.success && response.data) {
        setUser(response.data.user)
        toast.success('Registro exitoso')
        return true
      } else {
        toast.error(response.error || 'Error en el registro')
        return false
      }
    } catch (error) {
      console.error('Error en registro:', error)
      toast.error('Error en el registro')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      setUser(null)
      toast.success('Sesión cerrada')
    } catch (error) {
      console.error('Error en logout:', error)
      toast.error('Error al cerrar sesión')
    }
  }

  const debugAuth = async () => {
    console.log('🔍 Debug de autenticación...');
    console.log('👤 Usuario en estado:', user);
    console.log('⏳ Cargando:', isLoading);
    console.log('🔐 Autenticado:', !!user);
    
    const { data: sessionData, error: sessionError } = await supabaseAuthService.getSession();
    console.log('📋 Sesión de Supabase:', { sessionData, sessionError });
    
    const currentUser = await supabaseAuthService.getCurrentUser();
    console.log('👤 Usuario actual de Supabase:', currentUser);
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    signUp,
    logout,
    isAuthenticated: !!user,
    debugAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
