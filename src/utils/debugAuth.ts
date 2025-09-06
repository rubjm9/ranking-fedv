import { supabase } from '../services/supabaseService';

export async function debugAuth() {
  console.log('🔍 Debug de autenticación...');
  
  // Verificar configuración
  console.log('📋 Configuración Supabase:');
  console.log('  URL:', supabase.supabaseUrl);
  console.log('  Anon Key:', supabase.supabaseKey ? 'Configurado' : 'No configurado');
  
  // Verificar sesión actual
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  console.log('🔐 Sesión actual:', { sessionData, sessionError });
  
  // Verificar usuario actual
  const { data: userData, error: userError } = await supabase.auth.getUser();
  console.log('👤 Usuario actual:', { userData, userError });
  
  // Verificar estado de autenticación
  const { data: authData } = await supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔄 Cambio de estado:', event, session?.user?.email);
  });
  
  return {
    session: sessionData.session,
    user: userData.user,
    hasSession: !!sessionData.session,
    hasUser: !!userData.user
  };
}
