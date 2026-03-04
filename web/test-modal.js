const API_URL = 'http://localhost:3000/api';

async function testarMovimentacao() {
    console.log('🔄 Iniciando teste de movimentação...\n');
    
    try {
        // 1. Login
        console.log('1️⃣ Fazendo login...');
        const loginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });
        
        if (!loginRes.ok) {
            throw new Error('Erro no login');
        }
        
        const { token } = await loginRes.json();
        console.log('✅ Login realizado com sucesso!\n');
        
        // 2. Buscar produtos
        console.log('2️⃣ Buscando produtos...');
        const prodRes = await fetch(`${API_URL}/produtos?limit=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const prodDados = await prodRes.json();
        const produto = prodDados.produtos[0];
        console.log(`✅ Produto encontrado: ${produto.product_name} (ID: ${produto.product_id})`);
        console.log(`   Estoque atual: ${produto.current_stock}\n`);
        
        // 3. Criar movimentação de ENTRADA
        console.log('3️⃣ Criando movimentação de ENTRADA...');
        const movPayload = {
            product_id: produto.product_id,
            movement_type: 'IN',
            quantity: 10,
            notes: 'Teste de entrada via script'
        };
        
        console.log('   Payload:', JSON.stringify(movPayload, null, 2));
        
        const movRes = await fetch(`${API_URL}/movimentacoes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(movPayload)
        });
        
        console.log('   Status da resposta:', movRes.status);
        
        if (!movRes.ok) {
            const erro = await movRes.json();
            console.log('❌ Erro:', erro);
            throw new Error(JSON.stringify(erro));
        }
        
        const movResult = await movRes.json();
        console.log('✅ Movimentação criada com sucesso!');
        console.log('   Resposta:', JSON.stringify(movResult, null, 2));
        
        // 4. Listar movimentações
        console.log('\n4️⃣ Listando movimentações...');
        const listRes = await fetch(`${API_URL}/movimentacoes?limit=5`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const listDados = await listRes.json();
        console.log(`✅ ${listDados.total} movimentações encontradas`);
        console.log('   Últimas 5:');
        listDados.movimentacoes.slice(0, 5).forEach((m, i) => {
            console.log(`   ${i+1}. ${m.movement_type} - ${m.product_name} - Qtd: ${m.quantity}`);
        });
        
        console.log('\n🎉 Teste concluído com sucesso!');
        
    } catch (erro) {
        console.error('\n❌ Erro durante o teste:', erro.message);
        console.error(erro);
    }
}

testarMovimentacao();
