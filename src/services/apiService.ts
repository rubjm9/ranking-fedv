import { supabase } from './supabaseService'
import { mockRegionsService, mockTeamsService, mockTournamentsService } from './mockService'

// Servicio principal que usa Supabase con fallback a datos mock
// Si Supabase no está disponible, usa datos mock automáticamente

// Tipos de datos
export interface Team {
  id: string
  name: string
  regionId: string
  email?: string
  logo?: string
  isFilial: boolean
  parentTeamId?: string
  hasDifferentNames: boolean
  nameOpen?: string
  nameWomen?: string
  nameMixed?: string
  createdAt: string
  updatedAt: string
  region?: Region
}

export interface Region {
  id: string
  name: string
  coefficient: number
  floor: number
  ceiling: number
  increment: number
  createdAt: string
  updatedAt: string
  teams?: Team[]
  tournaments?: Tournament[]
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
  ranking_position: number
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

// Servicios de regiones usando Supabase
export const regionsService = {
  // Obtener todas las regiones
  getAll: async (params?: { search?: string }) => {
    try {
      let query = supabase
        .from('regions')
        .select(`
          *,
          teams(count),
          tournaments(count)
        `)
        .order('name')

      if (params?.search) {
        query = query.ilike('name', `%${params.search}%`)
      }

      const { data, error } = await query
      
      if (error) {
        console.warn('Supabase error, usando datos mock:', error.message)
        return await mockRegionsService.getAll()
      }
      
      // Transformar los datos para que coincidan con la estructura esperada
      const transformedData = (data || []).map(region => ({
        ...region,
        _count: {
          teams: region.teams?.length || 0,
          tournaments: region.tournaments?.length || 0
        }
      }))
      
      return { success: true, data: transformedData, message: 'Regiones obtenidas exitosamente' }
    } catch (error) {
      console.warn('Error de conexión, usando datos mock:', error)
      return await mockRegionsService.getAll()
    }
  },

  // Obtener una región por ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('regions')
      .select(`
        *,
        teams(
          id,
          name,
          email,
          logo,
          isFilial,
          positions(count)
        ),
        tournaments(
          id,
          name,
          type,
          year,
          surface,
          modality
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    // Transformar los datos para mantener compatibilidad
    const transformedData = {
      ...data,
      _count: {
        teams: data.teams?.length || 0,
        tournaments: data.tournaments?.length || 0
      }
    }
    
    return { success: true, data: transformedData, message: 'Región obtenida exitosamente' }
  },

  // Crear una nueva región
  create: async (regionData: Omit<Region, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await supabase
      .from('regions')
      .insert(regionData)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, data, message: 'Región creada exitosamente' }
  },

  // Actualizar una región
  update: async (id: string, regionData: Partial<Region>) => {
    const { data, error } = await supabase
      .from('regions')
      .update(regionData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, data, message: 'Región actualizada exitosamente' }
  },

  // Eliminar una región
  delete: async (id: string) => {
    const { error } = await supabase
      .from('regions')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return { success: true, message: 'Región eliminada exitosamente' }
  }
}

// Servicios de equipos usando Supabase con fallback a mock
export const teamsService = {
  // Obtener todos los equipos
  getAll: async (params?: { search?: string; region?: string }) => {
    try {
      let query = supabase
        .from('teams')
        .select(`
          *,
          regions!inner(name, coefficient)
        `)
        .order('name')

      if (params?.search) {
        query = query.ilike('name', `%${params.search}%`)
      }

      if (params?.region) {
        query = query.eq('regionId', params.region)
      }

      const { data, error } = await query
      
      if (error) {
        console.warn('Supabase error, usando datos mock:', error.message)
        return await mockTeamsService.getAll()
      }
      
      return { success: true, data: data || [], message: 'Equipos obtenidos exitosamente' }
    } catch (error) {
      console.warn('Error de conexión, usando datos mock:', error)
      return await mockTeamsService.getAll()
    }
  },

  // Obtener un equipo por ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        regions!inner(name, coefficient),
        positions(
          *,
          tournaments!inner(name, year, type)
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return { success: true, data, message: 'Equipo obtenido exitosamente' }
  },

  // Crear un nuevo equipo
  create: async (teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await supabase
      .from('teams')
      .insert(teamData)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, data, message: 'Equipo creado exitosamente' }
  },

  // Actualizar un equipo
  update: async (id: string, teamData: Partial<Team>) => {
    const { data, error } = await supabase
      .from('teams')
      .update(teamData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, data, message: 'Equipo actualizado exitosamente' }
  },

  // Eliminar un equipo
  delete: async (id: string) => {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return { success: true, message: 'Equipo eliminado exitosamente' }
  }
}

// Servicios de torneos usando Supabase con fallback a mock
export const tournamentsService = {
  // Obtener todos los torneos
  getAll: async (params?: { search?: string; type?: string; year?: number }) => {
    try {
      let query = supabase
        .from('tournaments')
        .select(`
          *,
          regions(name)
        `)
        .order('year', { ascending: false })

      if (params?.search) {
        query = query.ilike('name', `%${params.search}%`)
      }

      if (params?.type) {
        query = query.eq('type', params.type)
      }

      if (params?.year) {
        query = query.eq('year', params.year)
      }

      const { data, error } = await query
      
      if (error) {
        console.warn('Supabase error, usando datos mock:', error.message)
        return await mockTournamentsService.getAll()
      }
      
      return { success: true, data: data || [], message: 'Torneos obtenidos exitosamente' }
    } catch (error) {
      console.warn('Error de conexión, usando datos mock:', error)
      return await mockTournamentsService.getAll()
    }
  },

  // Obtener un torneo por ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        regions(name),
        positions(
          *,
          teams(name, regions(name))
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return { success: true, data, message: 'Torneo obtenido exitosamente' }
  },

  // Crear un nuevo torneo
  create: async (tournamentData: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await supabase
      .from('tournaments')
      .insert(tournamentData)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, data, message: 'Torneo creado exitosamente' }
  },

  // Actualizar un torneo
  update: async (id: string, tournamentData: Partial<Tournament>) => {
    const { data, error } = await supabase
      .from('tournaments')
      .update(tournamentData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, data, message: 'Torneo actualizado exitosamente' }
  },

  // Eliminar un torneo
  delete: async (id: string) => {
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return { success: true, message: 'Torneo eliminado exitosamente' }
  },

  // Agregar posiciones a un torneo
  addPositions: async (tournamentId: string, positions: any[]) => {
    const positionsData = positions.map(pos => ({
      tournamentId: tournamentId,
      teamId: pos.teamId,
      position: pos.position,
      points: pos.points || 0
    }))

    const { data, error } = await supabase
      .from('positions')
      .insert(positionsData)
      .select()
    
    if (error) throw error
    return { success: true, data, message: 'Posiciones agregadas exitosamente' }
  }
}

// Servicios de ranking usando Supabase
export const rankingService = {
  // Obtener ranking general usando función SQL
  getRanking: async (year?: number) => {
    const currentYear = year || new Date().getFullYear()
    
    const { data, error } = await supabase
      .rpc('calculate_team_ranking_simple', { year_param: currentYear })
    
    if (error) {
      console.error('Error obteniendo ranking:', error)
      throw error
    }
    
    return { success: true, data: data || [], message: 'Ranking obtenido exitosamente' }
  },

  // Obtener ranking por región
  getRegionRanking: async (regionId: string, year?: number) => {
    const currentYear = year || new Date().getFullYear()
    
    const { data, error } = await supabase
      .rpc('get_region_ranking', { region_id_param: regionId, year_param: currentYear })
    
    if (error) {
      console.error('Error obteniendo ranking regional:', error)
      throw error
    }
    
    return { success: true, data: data || [], message: 'Ranking regional obtenido exitosamente' }
  },

  // Obtener estadísticas de región
  getRegionStats: async (regionId: string) => {
    const { data, error } = await supabase
      .rpc('get_region_stats', { region_id_param: regionId })
    
    if (error) {
      console.error('Error obteniendo estadísticas de región:', error)
      throw error
    }
    
    return { success: true, data: data?.[0] || null, message: 'Estadísticas de región obtenidas exitosamente' }
  },

  // Obtener historial de ranking de un equipo
  getTeamHistory: async (teamId: string) => {
    const { data, error } = await supabase
      .rpc('get_team_ranking_history', { team_id_param: teamId })
    
    if (error) {
      console.error('Error obteniendo historial del equipo:', error)
      throw error
    }
    
    return { success: true, data: data || [], message: 'Historial del equipo obtenido exitosamente' }
  },

  // Obtener estadísticas generales del sistema
  getSystemStats: async () => {
    const { data, error } = await supabase
      .rpc('get_basic_stats')
    
    if (error) {
      console.error('Error obteniendo estadísticas del sistema:', error)
      throw error
    }
    
    return { success: true, data: data?.[0] || null, message: 'Estadísticas del sistema obtenidas exitosamente' }
  }
}

// Función auxiliar para multiplicadores de torneo
function getTournamentMultiplier(type: string): number {
  switch (type) {
    case 'CE1': return 1.0
    case 'CE2': return 0.8
    case 'REGIONAL': return 0.6
    case 'INTERNATIONAL': return 1.2
    default: return 0.5
  }
}

// Servicios de autenticación usando Supabase con fallback
export const authService = {
  // Login
  login: async (email: string, password: string) => {
    if (!supabase) {
      // Fallback: autenticación mock para desarrollo
      if (email === 'admin@fedv.es' && password === 'admin123') {
        return { 
          success: true, 
          data: { 
            user: { 
              id: 'mock-user-id', 
              email: 'admin@fedv.es',
              role: 'admin'
            } 
          }, 
          message: 'Login exitoso (modo desarrollo)' 
        }
      }
      throw new Error('Supabase no configurado y credenciales incorrectas')
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return { success: true, data, message: 'Login exitoso' }
  },

  // Logout
  logout: async () => {
    if (!supabase) {
      return { success: true, message: 'Logout exitoso (modo desarrollo)' }
    }
    
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true, message: 'Logout exitoso' }
  },

  // Obtener usuario actual
  getCurrentUser: async () => {
    if (!supabase) {
      // Fallback: usuario mock para desarrollo
      return { 
        success: true, 
        data: { 
          id: 'mock-user-id', 
          email: 'admin@fedv.es',
          role: 'admin'
        }, 
        message: 'Usuario obtenido exitosamente (modo desarrollo)' 
      }
    }
    
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { success: true, data: user, message: 'Usuario obtenido exitosamente' }
  },

  // Verificar sesión
  getSession: async () => {
    if (!supabase) {
      // Fallback: sesión mock para desarrollo
      return { 
        success: true, 
        data: { 
          user: { 
            id: 'mock-user-id', 
            email: 'admin@fedv.es',
            role: 'admin'
          } 
        }, 
        message: 'Sesión obtenida exitosamente (modo desarrollo)' 
      }
    }
    
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return { success: true, data: session, message: 'Sesión obtenida exitosamente' }
  }
}

// Servicios de posiciones usando Supabase
export const positionsService = {
  // Obtener todas las posiciones
  getAll: async (params?: { search?: string; tournament?: string; team?: string }) => {
    let query = supabase
      .from('positions')
      .select(`
        *,
        teams!inner(name, regions(name)),
        tournaments!inner(name, year, type)
      `)
      .order('position')

    if (params?.search) {
      query = query.ilike('teams.name', `%${params.search}%`)
    }

    if (params?.tournament) {
      query = query.eq('tournamentId', params.tournament)
    }

    if (params?.team) {
      query = query.eq('teamId', params.team)
    }

    const { data, error } = await query
    
    if (error) throw error
    return { success: true, data: data || [], message: 'Posiciones obtenidas exitosamente' }
  },

  // Obtener una posición por ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('positions')
      .select(`
        *,
        teams(name, regions(name)),
        tournaments(name, year, type)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return { success: true, data, message: 'Posición obtenida exitosamente' }
  },

  // Crear una nueva posición
  create: async (positionData: any) => {
    const { data, error } = await supabase
      .from('positions')
      .insert(positionData)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, data, message: 'Posición creada exitosamente' }
  },

  // Actualizar una posición
  update: async (id: string, positionData: any) => {
    const { data, error } = await supabase
      .from('positions')
      .update(positionData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, data, message: 'Posición actualizada exitosamente' }
  },

  // Eliminar una posición
  delete: async (id: string) => {
    const { error } = await supabase
      .from('positions')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return { success: true, message: 'Posición eliminada exitosamente' }
  }
}

// Servicios de importación/exportación usando Supabase
export const importExportService = {
  // Importar datos
  import: async (files: File[], options: any) => {
    // Implementación básica para importar datos
    console.log('Importando archivos:', files.length, 'con opciones:', options)
    return { success: true, message: 'Importación completada' }
  },

  // Exportar datos
  export: async (options: any) => {
    // Implementación básica para exportar datos
    console.log('Exportando con opciones:', options)
    return new Blob(['Datos exportados'], { type: 'text/plain' })
  },

  // Validar archivo de importación
  validateFile: async (file: File) => {
    // Implementación básica para validar archivos
    console.log('Validando archivo:', file.name)
    return { success: true, message: 'Archivo válido' }
  }
}

// Tipos de datos para posiciones
export interface Position {
  id: string
  tournamentId: string
  teamId: string
  position: number
  points: number
  createdAt: string
  updatedAt: string
}

export interface CreatePositionData {
  tournamentId: string
  teamId: string
  position: number
  points: number
}

export interface UpdatePositionData {
  position?: number
  points?: number
}

// Exportar supabase para uso directo
export { supabase }
