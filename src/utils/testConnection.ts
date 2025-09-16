import { supabase } from '@/services/supabaseService'

export const testSupabaseConnection = async () => {
  console.log('🧪 Probando conexión a Supabase...')
  
  if (!supabase) {
    console.error('❌ Supabase no está inicializado')
    return false
  }

  try {
    // Probar una consulta simple
    const { data, error } = await supabase
      .from('teams')
      .select('id, name')
      .limit(1)

    if (error) {
      console.error('❌ Error en consulta de prueba:', error)
      return false
    }

    console.log('✅ Conexión exitosa. Datos de prueba:', data)
    return true
  } catch (error) {
    console.error('❌ Error de conexión:', error)
    return false
  }
}

// Ejecutar prueba automáticamente
testSupabaseConnection()


