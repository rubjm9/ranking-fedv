import { supabaseAdmin } from '../services/supabaseService';
import dotenv from 'dotenv';

dotenv.config();

async function checkTableStructure() {
  try {
    console.log('🔍 Verificando estructura de tablas...\n');

    // Verificar estructura de la tabla configurations
    const { data, error } = await supabaseAdmin
      .from('configurations')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Error consultando configurations:', error);
    } else {
      console.log('✅ Estructura de configurations:', data);
    }

    // Verificar estructura de la tabla users
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.log('❌ Error consultando users:', usersError);
    } else {
      console.log('✅ Estructura de users:', usersData);
    }

    // Verificar estructura de la tabla regions
    const { data: regionsData, error: regionsError } = await supabaseAdmin
      .from('regions')
      .select('*')
      .limit(1);

    if (regionsError) {
      console.log('❌ Error consultando regions:', regionsError);
    } else {
      console.log('✅ Estructura de regions:', regionsData);
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

// Ejecutar verificación si se llama directamente
if (require.main === module) {
  checkTableStructure();
}

export default checkTableStructure;
