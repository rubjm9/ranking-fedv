import { supabaseAdmin } from '../services/supabaseService';
import dotenv from 'dotenv';

dotenv.config();

async function setupRLSPolicies() {
  try {
    console.log('🔒 Configurando políticas de seguridad (RLS)...\n');

    // Habilitar RLS en todas las tablas
    const tables = [
      'regions', 'teams', 'tournaments', 'positions', 
      'ranking_history', 'configurations', 'users', 'audit_logs'
    ];

    for (const table of tables) {
      const { error } = await supabaseAdmin.rpc('exec_sql', {
        sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
      });
      
      if (error) {
        console.log(`⚠️  RLS ya habilitado en ${table} o error:`, error.message);
      } else {
        console.log(`✅ RLS habilitado en ${table}`);
      }
    }

    // Políticas para lectura pública
    const publicReadPolicies = [
      'regions', 'teams', 'tournaments', 'positions', 
      'ranking_history', 'configurations'
    ];

    for (const table of publicReadPolicies) {
      const { error } = await supabaseAdmin.rpc('exec_sql', {
        sql: `CREATE POLICY IF NOT EXISTS "Allow public read access to ${table}" ON ${table} FOR SELECT USING (true);`
      });
      
      if (error) {
        console.log(`⚠️  Política de lectura pública ya existe en ${table} o error:`, error.message);
      } else {
        console.log(`✅ Política de lectura pública creada en ${table}`);
      }
    }

    // Políticas para administradores
    for (const table of tables) {
      const { error } = await supabaseAdmin.rpc('exec_sql', {
        sql: `CREATE POLICY IF NOT EXISTS "Allow admin full access to ${table}" ON ${table} FOR ALL USING (
          auth.jwt() ->> 'role' = 'ADMIN' OR 
          auth.jwt() ->> 'email' = 'admin@fedv.es'
        );`
      });
      
      if (error) {
        console.log(`⚠️  Política de administrador ya existe en ${table} o error:`, error.message);
      } else {
        console.log(`✅ Política de administrador creada en ${table}`);
      }
    }

    // Política para usuarios (solo lectura de sus propios datos)
    const { error: userPolicyError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `CREATE POLICY IF NOT EXISTS "Allow users to read own data" ON users FOR SELECT USING (
        auth.uid()::text = id
      );`
    });
    
    if (userPolicyError) {
      console.log(`⚠️  Política de usuario ya existe o error:`, userPolicyError.message);
    } else {
      console.log(`✅ Política de usuario creada`);
    }

    console.log('\n🎉 Políticas de seguridad configuradas!');
    console.log('📝 Nota: Si hay errores, es posible que las políticas ya existan.');

  } catch (error) {
    console.error('❌ Error durante la configuración de políticas:', error);
  }
}

// Ejecutar configuración si se llama directamente
if (require.main === module) {
  setupRLSPolicies();
}

export default setupRLSPolicies;
