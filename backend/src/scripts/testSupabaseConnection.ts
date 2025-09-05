import { supabaseAdmin } from '../services/supabaseService';
import dotenv from 'dotenv';

dotenv.config();

async function testSupabaseConnection() {
  try {
    console.log('🧪 Probando conexión con Supabase...\n');

    // Probar conexión básica
    console.log('1. Probando conexión básica...');
    const { data, error } = await supabaseAdmin
      .from('configurations')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Error de conexión:', error);
      return;
    }
    console.log('✅ Conexión establecida');

    // Probar inserción de datos
    console.log('\n2. Probando inserción de datos...');
    const testConfig = {
      id: crypto.randomUUID(),
      key: 'test_connection',
      value: 'success',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { error: insertError } = await supabaseAdmin
      .from('configurations')
      .insert(testConfig);

    if (insertError) {
      console.log('❌ Error insertando datos:', insertError);
    } else {
      console.log('✅ Inserción exitosa');
    }

    // Probar consulta de datos
    console.log('\n3. Probando consulta de datos...');
    const { data: configData, error: selectError } = await supabaseAdmin
      .from('configurations')
      .select('*')
      .eq('key', 'test_connection');

    if (selectError) {
      console.log('❌ Error consultando datos:', selectError);
    } else {
      console.log('✅ Consulta exitosa:', configData);
    }

    // Limpiar datos de prueba
    console.log('\n4. Limpiando datos de prueba...');
    const { error: deleteError } = await supabaseAdmin
      .from('configurations')
      .delete()
      .eq('key', 'test_connection');

    if (deleteError) {
      console.log('⚠️  Error limpiando datos de prueba:', deleteError);
    } else {
      console.log('✅ Datos de prueba eliminados');
    }

    console.log('\n🎉 Todas las pruebas pasaron! Supabase está configurado correctamente.');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  }
}

// Ejecutar pruebas si se llama directamente
if (require.main === module) {
  testSupabaseConnection();
}

export default testSupabaseConnection;
