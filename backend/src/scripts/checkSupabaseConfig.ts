import dotenv from 'dotenv';

dotenv.config();

function checkSupabaseConfig() {
  console.log('🔍 Verificando configuración de Supabase...\n');

  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL'
  ];

  let allConfigured = true;

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      console.log(`❌ ${varName}: NO CONFIGURADO`);
      allConfigured = false;
    } else if (value.includes('[YOUR-') || value.includes('[TU-')) {
      console.log(`⚠️  ${varName}: VALOR DE EJEMPLO (necesita ser reemplazado)`);
      allConfigured = false;
    } else {
      // Mostrar solo los primeros y últimos caracteres por seguridad
      const masked = value.length > 20 
        ? `${value.substring(0, 10)}...${value.substring(value.length - 10)}`
        : value;
      console.log(`✅ ${varName}: ${masked}`);
    }
  });

  console.log('\n📋 Configuración actual:');
  console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL}`);
  console.log(`SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Configurado' : '❌ No configurado'}`);

  if (!allConfigured) {
    console.log('\n❌ Configuración incompleta. Por favor:');
    console.log('1. Copia backend/supabase-config.example como backend/.env');
    console.log('2. Reemplaza los valores con los de tu proyecto Supabase');
    console.log('3. Asegúrate de usar la URL de la API (https://xxx.supabase.co) no la URL de la base de datos');
  } else {
    console.log('\n✅ Configuración completa!');
  }

  return allConfigured;
}

// Ejecutar verificación si se llama directamente
if (require.main === module) {
  checkSupabaseConfig();
}

export default checkSupabaseConfig;
