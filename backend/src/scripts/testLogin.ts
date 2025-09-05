import { supabaseAdmin } from '../services/supabaseService';
import dotenv from 'dotenv';

dotenv.config();

async function testLogin() {
  try {
    console.log('🔐 Probando login con Supabase...\n');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@fedv.es';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);

    // Probar login con Supabase Auth
    console.log('\n1. Probando login con Supabase Auth...');
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (error) {
      console.log('❌ Error en login:', error);
      
      // Si el usuario no existe, intentar crearlo
      if (error.message.includes('Invalid login credentials') || error.message.includes('email_not_confirmed')) {
        console.log('\n2. Usuario no existe o no confirmado. Creando usuario...');
        
        const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: {
            role: 'ADMIN'
          }
        });

        if (createError) {
          console.log('❌ Error creando usuario:', createError);
        } else {
          console.log('✅ Usuario creado exitosamente:', createData.user?.email);
          
          // Intentar login nuevamente
          console.log('\n3. Probando login con usuario recién creado...');
          const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
            email: adminEmail,
            password: adminPassword,
          });

          if (loginError) {
            console.log('❌ Error en login después de crear usuario:', loginError);
          } else {
            console.log('✅ Login exitoso:', loginData.user?.email);
          }
        }
      }
    } else {
      console.log('✅ Login exitoso:', data.user?.email);
      console.log('📋 Datos del usuario:', {
        id: data.user?.id,
        email: data.user?.email,
        role: data.user?.user_metadata?.role
      });
    }

    // Verificar usuarios existentes
    console.log('\n4. Verificando usuarios existentes...');
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Error listando usuarios:', usersError);
    } else {
      console.log(`📊 Total de usuarios: ${users.users.length}`);
      users.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.email_confirmed_at ? 'Confirmado' : 'No confirmado'})`);
      });
    }

  } catch (error) {
    console.error('❌ Error durante las pruebas de login:', error);
  }
}

// Ejecutar pruebas si se llama directamente
if (require.main === module) {
  testLogin();
}

export default testLogin;
