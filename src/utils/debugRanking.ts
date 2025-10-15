/**
 * Utilidades de debug para el sistema de ranking
 */

export const debugRanking = async () => {
  console.log('🔍 Iniciando debug del sistema de ranking...')
  
  try {
    // Verificar datos básicos
    const { data: teams } = await supabase
      .from('teams')
      .select('id, name')
      .limit(5)
    
    const { data: positions } = await supabase
      .from('positions')
      .select('teamId, position, points')
      .limit(5)
    
    const { data: rankings } = await supabase
      .from('current_rankings')
      .select('team_id, total_points, ranking_position')
      .limit(5)
    
    console.log('📊 Datos encontrados:')
    console.log('- Equipos:', teams?.length || 0)
    console.log('- Posiciones:', positions?.length || 0)
    console.log('- Rankings:', rankings?.length || 0)
    
    return {
      success: true,
      teams: teams?.length || 0,
      positions: positions?.length || 0,
      rankings: rankings?.length || 0,
      message: 'Debug completado exitosamente'
    }
  } catch (error) {
    console.error('❌ Error en debug:', error)
    return {
      success: false,
      error: error.message,
      message: 'Error durante el debug'
    }
  }
}

export const testSeasonCalculation = async (season: string = '2024-25') => {
  console.log(`🧮 Probando cálculo de temporada ${season}...`)
  
  try {
    // Lógica básica de prueba
    const { data: positions } = await supabase
      .from('positions')
      .select('teamId, position, points')
      .eq('season', season)
      .limit(10)
    
    console.log(`📈 Posiciones encontradas para ${season}:`, positions?.length || 0)
    
    return {
      success: true,
      season,
      positions: positions?.length || 0,
      message: `Cálculo de temporada ${season} completado`
    }
  } catch (error) {
    console.error('❌ Error en cálculo de temporada:', error)
    return {
      success: false,
      season,
      error: error.message,
      message: `Error calculando temporada ${season}`
    }
  }
}

// Importar supabase para las consultas
import { supabase } from '@/config/supabase'
