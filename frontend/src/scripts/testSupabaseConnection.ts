import { supabase } from '../services/supabaseService';

async function testSupabaseConnection() {
  try {
    console.log('🧪 Probando conexión con Supabase desde el frontend...\n');

    // Probar conexión básica
    console.log('1. Probando conexión básica...');
    const { data, error } = await supabase
      .from('configurations')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Error de conexión:', error);
      return;
    }
    console.log('✅ Conexión establecida');

    // Probar autenticación
    console.log('\n2. Probando autenticación...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('❌ Error de autenticación:', authError);
    } else {
      console.log('✅ Autenticación funcionando:', authData.session ? 'Usuario logueado' : 'Sin sesión');
    }

    console.log('\n🎉 Pruebas del frontend completadas!');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  }
}

// Ejecutar pruebas si se llama directamente
if (typeof window !== 'undefined') {
  testSupabaseConnection();
}

export default testSupabaseConnection;
