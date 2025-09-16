import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '@/config/supabase';

// Función para obtener el cliente de Supabase
const getSupabaseClient = () => {
  const config = getSupabaseConfig();
  
  try {
    const client = createClient(config.url, config.anonKey);
    return client;
  } catch (error) {
    console.error('❌ Error inicializando Supabase:', error);
    return null;
  }
};

// Cliente de Supabase para el frontend
const supabase = getSupabaseClient();

export { supabase };
export default supabase;
