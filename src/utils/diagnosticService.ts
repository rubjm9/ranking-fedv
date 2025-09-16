import { supabase } from '@/services/supabaseService'

export const diagnosticService = {
  // Verificar conexión a Supabase
  async checkSupabaseConnection() {
    try {
      console.log('🔍 Verificando conexión a Supabase...')
      
      if (!supabase) {
        console.error('❌ Supabase no está inicializado')
        return { success: false, error: 'Supabase no inicializado' }
      }

      // Probar conexión básica
      const { data, error } = await supabase.from('teams').select('count').limit(1)
      
      if (error) {
        console.error('❌ Error de conexión a Supabase:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Conexión a Supabase exitosa')
      return { success: true, data: 'Conexión exitosa' }
    } catch (error: any) {
      console.error('❌ Error en diagnóstico:', error)
      return { success: false, error: error.message }
    }
  },

  // Verificar datos en las tablas principales
  async checkDataAvailability() {
    try {
      console.log('🔍 Verificando disponibilidad de datos...')
      
      const results = {
        teams: { count: 0, error: null },
        regions: { count: 0, error: null },
        tournaments: { count: 0, error: null },
        positions: { count: 0, error: null }
      }

      // Verificar equipos
      try {
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id', { count: 'exact' })
        
        if (teamsError) throw teamsError
        results.teams.count = teamsData?.length || 0
      } catch (error: any) {
        results.teams.error = error.message
      }

      // Verificar regiones
      try {
        const { data: regionsData, error: regionsError } = await supabase
          .from('regions')
          .select('id', { count: 'exact' })
        
        if (regionsError) throw regionsError
        results.regions.count = regionsData?.length || 0
      } catch (error: any) {
        results.regions.error = error.message
      }

      // Verificar torneos
      try {
        const { data: tournamentsData, error: tournamentsError } = await supabase
          .from('tournaments')
          .select('id', { count: 'exact' })
        
        if (tournamentsError) throw tournamentsError
        results.tournaments.count = tournamentsData?.length || 0
      } catch (error: any) {
        results.tournaments.error = error.message
      }

      // Verificar posiciones
      try {
        const { data: positionsData, error: positionsError } = await supabase
          .from('positions')
          .select('id', { count: 'exact' })
        
        if (positionsError) throw positionsError
        results.positions.count = positionsData?.length || 0
      } catch (error: any) {
        results.positions.error = error.message
      }

      console.log('📊 Resultados del diagnóstico:', results)
      return { success: true, data: results }
    } catch (error: any) {
      console.error('❌ Error en verificación de datos:', error)
      return { success: false, error: error.message }
    }
  },

  // Ejecutar diagnóstico completo
  async runFullDiagnostic() {
    console.log('🚀 Iniciando diagnóstico completo...')
    
    const connectionResult = await this.checkSupabaseConnection()
    if (!connectionResult.success) {
      return connectionResult
    }

    const dataResult = await this.checkDataAvailability()
    return dataResult
  }
}


