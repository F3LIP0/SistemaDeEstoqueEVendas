require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTable() {
    try {
        // Tentar inserir com campos mínimos
        console.log('Tentando inserir movimentação...');
        
        const { data, error } = await supabase
            .from('stock_movements')
            .insert([{
                product_id: 1,
                movement_type: 'ADJUSTMENT',
                quantity: 1,
                user_id: 2
            }])
            .select();
        
        if (error) {
            console.log('❌ Erro:', error);
        } else {
            console.log('✅ Sucesso!', data);
        }
    } catch (err) {
        console.log('❌ Exception:', err);
    }
}

checkTable();
