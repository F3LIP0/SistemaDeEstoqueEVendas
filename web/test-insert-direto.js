require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testarInsert() {
    console.log('\n🔍 Testando inserção de movimentação...\n');
    
    // Primeiro, buscar um produto
    const { data: produtos } = await supabase
        .from('products')
        .select('product_id, product_name, current_stock')
        .limit(1);
    
    if (!produtos || produtos.length === 0) {
        console.log('❌ Nenhum produto encontrado');
        return;
    }
    
    const produto = produtos[0];
    console.log('✅ Produto encontrado:', produto);
    
    // Tentar inserir movimentação
    console.log('\n📝 Tentando inserir com campos obrigatórios...');
    
    const movData = {
        product_id: produto.product_id,
        movement_type: 'IN',
        quantity: 10,
        user_id: 2,
        reference_type: 'PURCHASE_ORDER',
        reference_id: 123,
        notes: 'Teste de inserção direta',
        movement_date: new Date().toISOString(),
        previous_stock: produto.current_stock,
        new_stock: produto.current_stock + 10
    };
    
    console.log('Dados a inserir:', JSON.stringify(movData, null, 2));
    
    const { data, error } = await supabase
        .from('stock_movements')
        .insert([movData])
        .select();
    
    if (error) {
        console.log('\n❌ ERRO:', error);
        console.log('\nDetalhes:');
        console.log('  Code:', error.code);
        console.log('  Message:', error.message);
        console.log('  Details:', error.details);
    } else {
        console.log('\n✅ SUCESSO! Movimentação criada:', data);
    }
}

testarInsert();
