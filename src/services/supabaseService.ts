import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cliente de Supabase para el frontend
let supabase: any = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Cliente de Supabase inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando Supabase:', error);
    supabase = null;
  }
} else {
  console.warn('⚠️ Variables de entorno de Supabase no configuradas');
}

export { supabase };
export default supabase;
