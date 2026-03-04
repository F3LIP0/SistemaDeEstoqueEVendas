const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createAdminUser() {
  try {
    console.log('🔐 Gerando hash da senha...');
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    console.log('📊 Conectando ao Supabase...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('👤 Inserindo usuário admin...');
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          username: 'admin',
          email: 'admin@empresa.com',
          password_hash: passwordHash,
          role_id: 3, // ADMIN
          full_name: 'Administrador',
          is_active: true
        }
      ])
      .select();
    
    if (error) {
      if (error.message.includes('duplicate')) {
        console.log('✅ Usuário admin já existe!');
      } else {
        console.error('❌ Erro:', error.message);
      }
    } else {
      console.log('✅ Usuário admin criado com sucesso!');
      console.log('📋 Dados:', data);
    }
    
    console.log('\n🎉 Credenciais de acesso:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Email: admin@empresa.com\n');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

createAdminUser();
