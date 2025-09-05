import { supabaseAdmin } from '../services/supabaseService';
import dotenv from 'dotenv';

dotenv.config();

async function setupSupabase() {
  try {
    console.log('🚀 Configurando Supabase...');

    // Verificar conexión
    const { data, error } = await supabaseAdmin.from('regions').select('count').limit(1);
    if (error) {
      console.error('❌ Error conectando a Supabase:', error);
      return;
    }
    console.log('✅ Conexión a Supabase establecida');

    // Crear usuario administrador por defecto
    console.log('👤 Creando usuario administrador...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@fedv.es';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        role: 'ADMIN'
      }
    });

    if (authError) {
      console.error('❌ Error creando usuario administrador:', authError);
    } else {
      console.log('✅ Usuario administrador creado:', adminEmail);
    }

    // Crear configuración inicial
    console.log('⚙️ Creando configuración inicial...');
    const initialConfigs = [
      { key: 'app_name', value: 'Ranking FEDV' },
      { key: 'app_version', value: '1.0.0' },
      { key: 'ranking_year', value: new Date().getFullYear().toString() },
      { key: 'default_coefficient', value: '1.0' },
      { key: 'default_floor', value: '0.8' },
      { key: 'default_ceiling', value: '1.2' },
      { key: 'default_increment', value: '0.01' }
    ];

    for (const config of initialConfigs) {
      const now = new Date().toISOString();
      const { error } = await supabaseAdmin
        .from('configurations')
        .upsert({
          id: crypto.randomUUID(),
          key: config.key,
          value: config.value,
          createdAt: now,
          updatedAt: now
        });
      
      if (error) {
        console.error(`❌ Error creando configuración ${config.key}:`, error);
      } else {
        console.log(`✅ Configuración creada: ${config.key}`);
      }
    }

    console.log('🎉 Configuración de Supabase completada!');
    console.log('📝 Próximos pasos:');
    console.log('   1. Ejecuta las migraciones: npm run db:migrate');
    console.log('   2. Migra datos existentes: npm run db:migrate-supabase');
    console.log('   3. Configura las políticas RLS en Supabase');

  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
  }
}

// Ejecutar configuración si se llama directamente
if (require.main === module) {
  setupSupabase();
}

export default setupSupabase;
