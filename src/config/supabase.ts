// Configuración temporal de Supabase para diagnóstico
export const SUPABASE_CONFIG = {
  url: 'https://tseshbfijbarhjtayqmb.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzZXNoYmZpamJhcmhqdGF5cW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ4MDAsImV4cCI6MjA1MDU1MDgwMH0.placeholder_key'
}

// Función para verificar si las variables de entorno están configuradas
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (envUrl && envKey) {
    return {
      url: envUrl,
      anonKey: envKey,
      source: 'environment'
    }
  }

  // Fallback a configuración temporal
  return {
    url: SUPABASE_CONFIG.url,
    anonKey: SUPABASE_CONFIG.anonKey,
    source: 'fallback'
  }
}


