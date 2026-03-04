require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testar() {
    const { data: produto } = await supabase.from('products').select('product_id, current_stock').limit(1).single();
    
    const tipos = ['PURCHASE', 'SALE', 'ADJUSTMENT', 'TRANSFER', 'RETURN', 'OTHER', 'INVENTORY'];
    
    for (const tipo of tipos) {
        const mov = {
            product_id: produto.product_id,
            movement_type: 'ADJUSTMENT',
            quantity: 1,
            user_id: 2,
            reference_type: tipo,
            previous_stock: produto.current_stock,
            new_stock: produto.current_stock + 1
        };
        
        const { error } = await supabase.from('stock_movements').insert([mov]);
        if (!error) {
            console.log('✅', tipo, 'ACEITO');
            await supabase.from('stock_movements').delete().eq('reference_type', tipo);
        } else {
            console.log('❌', tipo, '- Rejeitado');
        }
    }
}

testar();
