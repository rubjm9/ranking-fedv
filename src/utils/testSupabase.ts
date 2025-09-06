import { supabase } from '../services/supabaseService';

export async function testSupabaseConnection() {
  try {
    console.log('🧪 Probando conexión con Supabase desde el frontend...');

    // Probar conexión básica
    const { data, error } = await supabase
      .from('configurations')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error de conexión:', error);
      return false;
    }
    console.log('✅ Conexión establecida');

    // Probar autenticación
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Error de autenticación:', authError);
      return false;
    }
    console.log('✅ Autenticación funcionando');

    // Probar login
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@fedv.es',
      password: 'admin123'
    });

    if (loginError) {
      console.error('❌ Error en login:', loginError);
      return false;
    }
    console.log('✅ Login exitoso:', loginData.user?.email);
    
    return true;
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
    return false;
  }
}
