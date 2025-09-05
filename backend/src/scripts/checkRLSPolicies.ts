import { supabaseAdmin } from '../services/supabaseService';
import dotenv from 'dotenv';

dotenv.config();

async function checkRLSPolicies() {
  try {
    console.log('🔒 Verificando políticas RLS en Supabase...\n');

    // Verificar si RLS está habilitado en las tablas
    const tables = ['regions', 'teams', 'tournaments', 'positions', 'ranking_history', 'configurations', 'users', 'audit_logs'];

    for (const table of tables) {
      const { data, error } = await supabaseAdmin
        .from('information_schema.tables')
        .select('*')
        .eq('table_name', table)
        .eq('table_schema', 'public');

      if (error) {
        console.log(`❌ Error verificando tabla ${table}:`, error);
      } else {
        console.log(`✅ Tabla ${table} existe`);
      }
    }

    // Probar inserción en regions (debería fallar sin políticas)
    console.log('\n🧪 Probando inserción en regions...');
    const testRegion = {
      id: crypto.randomUUID(),
      name: 'Test Region',
      code: 'TEST',
      coefficient: 1.0,
      floor: 0.8,
      ceiling: 1.2,
      increment: 0.01,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('regions')
      .insert(testRegion);

    if (insertError) {
      console.log('❌ Error insertando región:', insertError.message);
      if (insertError.message.includes('RLS')) {
        console.log('⚠️  RLS está bloqueando la inserción - esto es normal si no hay políticas configuradas');
      }
    } else {
      console.log('✅ Inserción exitosa');
      
      // Limpiar datos de prueba
      const { error: deleteError } = await supabaseAdmin
        .from('regions')
        .delete()
        .eq('id', testRegion.id);
      
      if (deleteError) {
        console.log('⚠️  Error limpiando datos de prueba:', deleteError);
      } else {
        console.log('✅ Datos de prueba eliminados');
      }
    }

    console.log('\n📋 Recomendaciones:');
    console.log('1. Ve al SQL Editor de Supabase');
    console.log('2. Ejecuta el contenido de SUPABASE_RLS_POLICIES.sql');
    console.log('3. Esto configurará las políticas de seguridad necesarias');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

// Ejecutar verificación si se llama directamente
if (require.main === module) {
  checkRLSPolicies();
}

export default checkRLSPolicies;
