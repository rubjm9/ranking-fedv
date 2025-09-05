// Script de prueba para verificar la conexión con Supabase desde el frontend
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Verificando configuración del frontend...');
console.log('SUPABASE_URL:', supabaseUrl);
console.log('SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Configurado' : 'No configurado');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno no configuradas');
  process.exit(1);
}

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Probar conexión
async function testConnection() {
  try {
    console.log('\n🧪 Probando conexión con Supabase...');
    
    const { data, error } = await supabase
      .from('configurations')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error de conexión:', error);
    } else {
      console.log('✅ Conexión establecida');
    }

    // Probar autenticación
    console.log('\n🔐 Probando autenticación...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Error de autenticación:', authError);
    } else {
      console.log('✅ Autenticación funcionando');
    }

    // Probar login
    console.log('\n👤 Probando login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@fedv.es',
      password: 'admin123'
    });

    if (loginError) {
      console.error('❌ Error en login:', loginError);
    } else {
      console.log('✅ Login exitoso:', loginData.user?.email);
    }

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  }
}

testConnection();
