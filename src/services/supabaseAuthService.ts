import { supabase } from './supabaseService'
import { User } from '@supabase/supabase-js'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  session: any
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export const supabaseAuthService = {
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      console.log('🔐 SupabaseAuthService: Intentando login con:', credentials.email)
      console.log('🔗 Supabase URL:', supabase.supabaseUrl)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      console.log('📋 Respuesta de Supabase:', { data, error })

      if (error) {
        console.error('❌ Error de Supabase:', error)
        return {
          success: false,
          error: error.message
        }
      }

      console.log('✅ Login exitoso en Supabase')
      return {
        success: true,
        data: {
          user: data.user!,
          session: data.session
        }
      }
    } catch (error: any) {
      console.error('❌ Error en login:', error)
      return {
        success: false,
        error: 'Error en el inicio de sesión'
      }
    }
  },

  async signUp(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: {
          user: data.user!,
          session: data.session
        }
      }
    } catch (error: any) {
      console.error('Error en registro:', error)
      return {
        success: false,
        error: 'Error en el registro'
      }
    }
  },

  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error en logout:', error)
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error)
      return null
    }
  },

  async getSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return session
    } catch (error) {
      console.error('Error obteniendo sesión:', error)
      return null
    }
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null)
    })
  },

  isAuthenticated(): boolean {
    const session = supabase.auth.getSession()
    return !!session
  }
}
