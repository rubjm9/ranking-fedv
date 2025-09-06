import { supabase } from './supabaseService'
import { mockRegionsService, mockTeamsService, mockTournamentsService } from './mockService'

// Servicio principal que usa Supabase con fallback a datos mock
// Si Supabase no está disponible, usa datos mock automáticamente

// Tipos de datos
export interface Team {
  id: string
  name: string
  regionId: string
  location?: string
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
  description?: string
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
      // Primero obtener las regiones
      let query = supabase
        .from('regions')
        .select('*')
        .order('name')

      if (params?.search) {
        query = query.ilike('name', `%${params.search}%`)
      }

      const { data: regions, error } = await query
      
      if (error) {
        console.warn('Supabase error, usando datos mock:', error.message)
        return await mockRegionsService.getAll()
      }

      if (!regions || regions.length === 0) {
        return { success: true, data: [], message: 'No hay regiones' }
      }

      // Obtener conteos reales para cada región
      const regionsWithCounts = await Promise.all(
        regions.map(async (region) => {
          // Contar equipos
          const { count: teamCount } = await supabase
            .from('teams')
            .select('*', { count: 'exact', head: true })
            .eq('regionId', region.id)

          // Contar torneos
          const { count: tournamentCount } = await supabase
            .from('tournaments')
            .select('*', { count: 'exact', head: true })
            .eq('regionId', region.id)

          return {
            ...region,
            _count: {
              teams: teamCount || 0,
              tournaments: tournamentCount || 0
            }
          }
        })
      )
      
      return { success: true, data: regionsWithCounts, message: 'Regiones obtenidas exitosamente' }
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
          region:regions(name, coefficient)
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
        console.warn('Supabase error en teams.getAll:', error.message)
        console.warn('Error details:', error)
        return await mockTeamsService.getAll()
      }
      
      console.log('Teams data from Supabase:', data)
      console.log('First team region data:', data?.[0]?.region)
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
        region:regions(name, coefficient),
        positions(
          *,
          tournaments(name, year, type)
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
          region:regions(name)
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
        region:regions(name),
        positions(
          *,
          teams(name, region:regions(name))
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
  },

  // Eliminar todas las posiciones de un torneo
  deletePositions: async (tournamentId: string) => {
    const { error } = await supabase
      .from('positions')
      .delete()
      .eq('tournamentId', tournamentId)
    
    if (error) throw error
    return { success: true, message: 'Posiciones eliminadas exitosamente' }
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
        teams(name, regions(name)),
        tournaments(name, year, type)
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
  // Exportar equipos
  exportTeams: async (options: { format: 'csv' | 'excel' | 'json' } = { format: 'csv' }) => {
    const { data: teams, error } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        regionId,
        location,
        email,
        logo,
        isFilial,
        parentTeamId,
        hasDifferentNames,
        nameOpen,
        nameWomen,
        nameMixed,
        createdAt,
        updatedAt,
        region:regions(name)
      `)
      .order('name')

    if (error) throw error

    // Transformar datos para exportación
    const exportData = teams.map(team => ({
      id: team.id,
      nombre: team.name,
      region: team.region?.name || 'Sin región',
      ubicacion: team.location || '',
      email: team.email || '',
      logo: team.logo || '',
      es_filial: team.isFilial ? 'Sí' : 'No',
      club_principal: team.parentTeamId || '',
      nombres_diferentes: team.hasDifferentNames ? 'Sí' : 'No',
      nombre_open: team.nameOpen || '',
      nombre_women: team.nameWomen || '',
      nombre_mixed: team.nameMixed || '',
      fecha_creacion: new Date(team.createdAt).toLocaleDateString('es-ES'),
      fecha_actualizacion: new Date(team.updatedAt).toLocaleDateString('es-ES')
    }))

    return exportData
  },

  // Exportar regiones
  exportRegions: async (options: { format: 'csv' | 'excel' | 'json' } = { format: 'csv' }) => {
    const { data: regions, error } = await supabase
      .from('regions')
      .select('*')
      .order('name')

    if (error) throw error

    // Transformar datos para exportación
    const exportData = regions.map(region => ({
      id: region.id,
      nombre: region.name,
      descripcion: region.description || '',
      coeficiente: region.coefficient || 1.0,
      fecha_creacion: new Date(region.createdAt).toLocaleDateString('es-ES'),
      fecha_actualizacion: new Date(region.updatedAt).toLocaleDateString('es-ES')
    }))

    return exportData
  },

  // Exportar torneos
  exportTournaments: async (options: { format: 'csv' | 'excel' | 'json' } = { format: 'csv' }) => {
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select(`
        id,
        name,
        type,
        year,
        season,
        surface,
        modality,
        regionId,
        startDate,
        endDate,
        location,
        createdAt,
        updatedAt,
        region:regions(name)
      `)
      .order('year', { ascending: false })

    if (error) throw error

    // Transformar datos para exportación
    const exportData = tournaments.map(tournament => ({
      id: tournament.id,
      nombre: tournament.name,
      tipo: tournament.type,
      año: tournament.year,
      temporada: tournament.season || '',
      superficie: tournament.surface === 'GRASS' ? 'Césped' : 
                  tournament.surface === 'BEACH' ? 'Playa' : 
                  tournament.surface === 'INDOOR' ? 'Indoor' : tournament.surface,
      modalidad: tournament.modality === 'OPEN' ? 'Open' : 
                 tournament.modality === 'WOMEN' ? 'Women' : 
                 tournament.modality === 'MIXED' ? 'Mixto' : tournament.modality,
      region: tournament.type === 'REGIONAL' ? (tournament.region?.name || 'Sin región') : 'Nacional',
      fecha_inicio: tournament.startDate ? new Date(tournament.startDate).toLocaleDateString('es-ES') : '',
      fecha_fin: tournament.endDate ? new Date(tournament.endDate).toLocaleDateString('es-ES') : '',
      ubicacion: tournament.location || '',
      fecha_creacion: new Date(tournament.createdAt).toLocaleDateString('es-ES'),
      fecha_actualizacion: new Date(tournament.updatedAt).toLocaleDateString('es-ES')
    }))

    return exportData
  },

  // Exportar posiciones/resultados
  exportPositions: async (options: { format: 'csv' | 'excel' | 'json' } = { format: 'csv' }) => {
    const { data: positions, error } = await supabase
      .from('positions')
      .select(`
        id,
        position,
        points,
        createdAt,
        tournament:tournaments(name, year, type),
        team:teams(name, region:regions(name))
      `)
      .order('tournament.year', { ascending: false })

    if (error) throw error

    // Transformar datos para exportación
    const exportData = positions.map(pos => ({
      id: pos.id,
      torneo: pos.tournament?.name || 'Sin torneo',
      año: pos.tournament?.year || '',
      tipo_torneo: pos.tournament?.type || '',
      equipo: pos.team?.name || 'Sin equipo',
      region_equipo: pos.team?.region?.name || 'Sin región',
      posicion: pos.position,
      puntos: pos.points,
      fecha_creacion: new Date(pos.createdAt).toLocaleDateString('es-ES')
    }))

    return exportData
  },

  // Exportar todos los datos
  exportAll: async (options: { format: 'csv' | 'excel' | 'json' } = { format: 'csv' }) => {
    const [teams, regions, tournaments, positions] = await Promise.all([
      importExportService.exportTeams(options),
      importExportService.exportRegions(options),
      importExportService.exportTournaments(options),
      importExportService.exportPositions(options)
    ])

    return {
      equipos: teams,
      regiones: regions,
      torneos: tournaments,
      posiciones: positions,
      metadata: {
        fecha_exportacion: new Date().toISOString(),
        total_equipos: teams.length,
        total_regiones: regions.length,
        total_torneos: tournaments.length,
        total_posiciones: positions.length
      }
    }
  },

  // Importar datos
  import: async (files: File[], options: any) => {
    try {
      if (files.length === 0) {
        throw new Error('No se proporcionaron archivos')
      }

      const file = files[0]
      const content = await file.text()
      const lines = content.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        throw new Error('El archivo debe tener al menos una fila de encabezados y una fila de datos')
      }

      // Función para parsear CSV correctamente
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = []
        let current = ''
        let inQuotes = false
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        
        result.push(current.trim())
        return result
      }

      const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').trim())
      const dataRows = lines.slice(1).map(line => {
        const values = parseCSVLine(line).map(v => v.replace(/"/g, '').trim())
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        return row
      })

      console.log('Headers:', headers)
      console.log('Primera fila de datos:', dataRows[0])

      // Mapear campos del CSV a campos de la base de datos
      const mappedData = dataRows.map(row => {
        const mapped: any = {}
        
        // Mapear nombre (name -> nombre)
        mapped.name = row.name || row.nombre || row.nombres || ''
        
        // Mapear región (buscar por ID o nombre)
        if (row.region) {
          mapped.regionId = row.region // Asumimos que es el ID, si es nombre necesitamos buscar
        }
        
        // Mapear ubicación
        mapped.location = row.ubicacion || row.location || ''
        
        // Mapear email
        mapped.email = row.email || ''
        
        // Mapear logo
        mapped.logo = row.logo || ''
        
        // Mapear es_filial
        mapped.isFilial = row.es_filial === 'Sí' || row.es_filial === 'Si' || row.es_filial === 'Yes' || row.es_filial === 'true'
        
        // Mapear club_principal (necesitaríamos buscar el ID)
        if (row.club_principal) {
          mapped.parentTeamId = row.club_principal // Asumimos que es el ID
        }
        
        // Mapear nombres diferentes
        mapped.hasDifferentNames = row.nombres_diferentes === 'Sí' || row.nombres_diferentes === 'Si' || row.nombres_diferentes === 'Yes' || row.nombres_diferentes === 'true'
        
        // Mapear nombres específicos
        mapped.nameOpen = row.nombre_open || ''
        mapped.nameWomen = row.nombre_women || ''
        mapped.nameMixed = row.nombre_mixed || ''
        
        return mapped
      }).filter(row => row.name) // Solo filas con nombre

      console.log('Datos mapeados:', mappedData)

      // Separar equipos principales y filiales
      const equiposPrincipales = mappedData.filter(team => !team.isFilial)
      const equiposFiliales = mappedData.filter(team => team.isFilial)
      
      console.log('Equipos principales:', equiposPrincipales.length)
      console.log('Equipos filiales:', equiposFiliales.length)

      // Crear equipos en la base de datos
      const results = []
      const createdTeams = new Map() // Para mapear nombres a IDs

      // 1. PRIMERO: Crear equipos principales
      for (const teamData of equiposPrincipales) {
        try {
          // Si regionId es un nombre, necesitamos buscar el ID real
          let regionId = teamData.regionId
          if (teamData.regionId && isNaN(Number(teamData.regionId))) {
            // Es un nombre, buscar la región
            const { data: regions } = await supabase
              .from('regions')
              .select('id')
              .eq('name', teamData.regionId)
              .single()
            
            if (regions) {
              regionId = regions.id
            }
          }

          const { data, error } = await supabase
            .from('teams')
            .insert({
              name: teamData.name,
              regionId: regionId || null,
              location: teamData.location,
              email: teamData.email,
              logo: teamData.logo,
              isFilial: teamData.isFilial,
              parentTeamId: null, // Los principales no tienen padre
              hasDifferentNames: teamData.hasDifferentNames,
              nameOpen: teamData.nameOpen,
              nameWomen: teamData.nameWomen,
              nameMixed: teamData.nameMixed
            })
            .select()

          if (error) {
            console.error('Error al crear equipo principal:', teamData.name, error)
            results.push({ success: false, team: teamData.name, error: error.message })
          } else {
            console.log('Equipo principal creado:', data)
            // Guardar el ID para los filiales
            createdTeams.set(teamData.name, data[0].id)
            results.push({ success: true, team: teamData.name, data })
          }
        } catch (error: any) {
          console.error('Error al procesar equipo principal:', teamData.name, error)
          results.push({ success: false, team: teamData.name, error: error.message })
        }
      }

      // 2. SEGUNDO: Crear equipos filiales
      for (const teamData of equiposFiliales) {
        try {
          // Si regionId es un nombre, necesitamos buscar el ID real
          let regionId = teamData.regionId
          if (teamData.regionId && isNaN(Number(teamData.regionId))) {
            // Es un nombre, buscar la región
            const { data: regions } = await supabase
              .from('regions')
              .select('id')
              .eq('name', teamData.regionId)
              .single()
            
            if (regions) {
              regionId = regions.id
            }
          }

          // Buscar el ID del equipo padre
          let parentTeamId = null
          if (teamData.parentTeamId) {
            // Si parentTeamId es un nombre, buscar el ID
            if (isNaN(Number(teamData.parentTeamId))) {
              parentTeamId = createdTeams.get(teamData.parentTeamId)
            } else {
              parentTeamId = teamData.parentTeamId
            }
          }

          if (teamData.parentTeamId && !parentTeamId) {
            console.warn(`No se encontró el equipo padre "${teamData.parentTeamId}" para "${teamData.name}"`)
            results.push({ 
              success: false, 
              team: teamData.name, 
              error: `Equipo padre "${teamData.parentTeamId}" no encontrado` 
            })
            continue
          }

          const { data, error } = await supabase
            .from('teams')
            .insert({
              name: teamData.name,
              regionId: regionId || null,
              location: teamData.location,
              email: teamData.email,
              logo: teamData.logo,
              isFilial: teamData.isFilial,
              parentTeamId: parentTeamId,
              hasDifferentNames: teamData.hasDifferentNames,
              nameOpen: teamData.nameOpen,
              nameWomen: teamData.nameWomen,
              nameMixed: teamData.nameMixed
            })
            .select()

          if (error) {
            console.error('Error al crear equipo filial:', teamData.name, error)
            results.push({ success: false, team: teamData.name, error: error.message })
          } else {
            console.log('Equipo filial creado:', data)
            results.push({ success: true, team: teamData.name, data })
          }
        } catch (error: any) {
          console.error('Error al procesar equipo filial:', teamData.name, error)
          results.push({ success: false, team: teamData.name, error: error.message })
        }
      }

      const successCount = results.filter(r => r.success).length
      const errorCount = results.filter(r => !r.success).length

      return {
        success: true,
        message: `Importación completada: ${successCount} equipos creados, ${errorCount} errores`,
        results,
        summary: {
          total: mappedData.length,
          success: successCount,
          errors: errorCount
        }
      }

    } catch (error: any) {
      console.error('Error en importación:', error)
      return {
        success: false,
        message: error.message || 'Error al importar datos',
        results: [],
        summary: { total: 0, success: 0, errors: 1 }
      }
    }
  },

  // Validar archivo de importación
  validateFile: async (file: File) => {
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      
      // Validar tipo de archivo
      if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
        return {
          success: false,
          message: 'Tipo de archivo no válido. Solo se permiten archivos CSV y Excel.',
          errors: ['Tipo de archivo no soportado'],
          warnings: []
        }
      }

      // Validar tamaño (máximo 10MB)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        return {
          success: false,
          message: 'El archivo es demasiado grande. Máximo 10MB permitido.',
          errors: ['Archivo demasiado grande'],
          warnings: []
        }
      }

      // Leer contenido del archivo
      const content = await file.text()
      
      // Validaciones básicas para CSV
      if (fileExtension === 'csv') {
        const lines = content.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          return {
            success: false,
            message: 'El archivo CSV debe tener al menos una fila de encabezados y una fila de datos.',
            errors: ['Archivo CSV incompleto'],
            warnings: []
          }
        }

        // Función para parsear CSV correctamente (maneja comas dentro de campos)
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = []
          let current = ''
          let inQuotes = false
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i]
            
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim())
              current = ''
            } else {
              current += char
            }
          }
          
          result.push(current.trim())
          return result
        }

        const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').trim().toLowerCase())
        
        console.log('Headers encontrados:', headers) // Debug
        
        // Validar que tenga al menos algunos campos básicos
        const requiredFields = ['nombre', 'name', 'nombres', 'team', 'equipo']
        const hasRequiredField = requiredFields.some(field => 
          headers.some(header => header.toLowerCase().includes(field.toLowerCase()))
        )

        console.log('¿Tiene campo requerido?', hasRequiredField) // Debug

        if (!hasRequiredField) {
          return {
            success: false,
            message: `El archivo CSV debe contener al menos un campo de nombre. Campos encontrados: ${headers.join(', ')}`,
            errors: ['Falta campo de nombre'],
            warnings: []
          }
        }

        // Simular datos de ejemplo para preview
        const mockData = lines.slice(1, Math.min(4, lines.length)).map(line => {
          const values = parseCSVLine(line).map(v => v.replace(/"/g, '').trim())
          const row: any = {}
          headers.forEach((header, index) => {
            row[header] = values[index] || ''
          })
          return row
        })

        return {
          success: true,
          message: 'Archivo válido',
          errors: [],
          warnings: [],
          teams: mockData,
          tournaments: [],
          results: [],
          headers: headers // Agregar headers para la vista previa
        }
      }

      // Para archivos Excel, validación básica
      return {
        success: true,
        message: 'Archivo Excel válido',
        errors: [],
        warnings: ['Validación completa de Excel requiere procesamiento adicional'],
        teams: [],
        tournaments: [],
        results: []
      }

    } catch (error) {
      console.error('Error al validar archivo:', error)
      return {
        success: false,
        message: 'Error al procesar el archivo',
        errors: ['Error de procesamiento'],
        warnings: []
      }
    }
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
