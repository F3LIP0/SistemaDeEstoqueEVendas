/**
 * Teste de Fluxo Completo: Login → Usuários → Produtos → Movimentações
 */
const API = 'http://localhost:3000/api';

async function req(method, endpoint, body, token) {
    const opts = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (token) opts.headers.Authorization = `Bearer ${token}`;
    if (body) opts.body = JSON.stringify(body);
    
    const res = await fetch(`${API}${endpoint}`, opts);
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
}

async function main() {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 TESTE DE FLUXO COMPLETO - Fluxa');
    console.log('='.repeat(70) + '\n');
    
    try {
        // 1. LOGIN ADMIN
        console.log('1️⃣  LOGIN DO ADMIN');
        console.log('-'.repeat(70));
        let r = await req('POST', '/login', { email: 'admin', senha: 'admin123' });
        if (!r.ok) throw new Error(`❌ Login admin falhou: ${r.data.mensagem}`);
        const adminToken = r.data.token;
        const admin = r.data.usuario;
        console.log(`✅ Login bem-sucedido`);
        console.log(`   Usuário: ${admin.username} (${admin.role_name})`);
        console.log(`   Role level: ${admin.role_level}\n`);
        
        // 2. CRIAR NOVO USUÁRIO
        console.log('2️⃣  CRIAR NOVO USUÁRIO');
        console.log('-'.repeat(70));
        const novoUser = {
            username: `user_${Date.now()}`,
            email: `test_${Date.now()}@example.com`,
            senha: 'senha123',
            full_name: 'Usuário Teste',
            role_name: 'MANAGER'
        };
        r = await req('POST', '/usuarios', novoUser, adminToken);
        if (!r.ok) throw new Error(`❌ Criar usuário falhou: ${r.data.mensagem}`);
        const novoUserId = r.data.id;
        console.log(`✅ Usuário criado com sucesso`);
        console.log(`   ID: ${novoUserId}`);
        console.log(`   Username: ${novoUser.username}`);
        console.log(`   Email: ${novoUser.email}\n`);
        
        // 3. LOGIN COM NOVO USUÁRIO
        console.log('3️⃣  LOGIN COM NOVO USUÁRIO');
        console.log('-'.repeat(70));
        r = await req('POST', '/login', { email: novoUser.email, senha: novoUser.senha });
        if (!r.ok) throw new Error(`❌ Login novo usuário falhou: ${r.data.mensagem}`);
        const novoUserToken = r.data.token;
        const novoUserData = r.data.usuario;
        console.log(`✅ Login bem-sucedido`);
        console.log(`   Usuário: ${novoUserData.username} (${novoUserData.role_name})`);
        console.log(`   Role level: ${novoUserData.role_level}\n`);
        
        // 4. LISTAR PRODUTOS
        console.log('4️⃣  LISTAR PRODUTOS');
        console.log('-'.repeat(70));
        r = await req('GET', '/produtos?limit=1');
        if (!r.ok) throw new Error(`❌ Listar produtos falhou`);
        const produtos = r.data.produtos || [];
        const produtoExistente = produtos[0];
        console.log(`✅ ${r.data.total} produtos encontrados`);
        if (produtoExistente) {
            console.log(`   ID: ${produtoExistente.product_id} | Nome: ${produtoExistente.product_name} | Estoque: ${produtoExistente.current_stock}\n`);
        }
        
        // 5. EDITAR PRODUTO
        console.log('5️⃣  EDITAR PRODUTO');
        console.log('-'.repeat(70));
        if (produtoExistente) {
            const updates = {
                product_name: `${produtoExistente.product_name} [Editado]`,
                selling_price: 200,
                minimum_stock: 5
            };
            r = await req('PUT', `/produtos/${produtoExistente.product_id}`, updates, novoUserToken);
            if (!r.ok) throw new Error(`❌ Editar produto falhou: ${r.data.mensagem}`);
            console.log(`✅ Produto atualizado com sucesso`);
            console.log(`   ID: ${produtoExistente.product_id}`);
            console.log(`   Novo nome: ${updates.product_name}`);
            console.log(`   Novo preço: R$ ${updates.selling_price}\n`);
        }
        
        // 6. CRIAR MOVIMENTAÇÕES
        console.log('6️⃣  CRIAR MOVIMENTAÇÕES');
        console.log('-'.repeat(70));
        if (produtoExistente) {
            // 6a. ENTRADA
            console.log('   📥 Entrada (IN):');
            let entrada = {
                product_id: produtoExistente.product_id,
                movement_type: 'IN',
                quantity: 10,
                notes: 'Teste entrada de estoque'
            };
            r = await req('POST', '/movimentacoes', entrada, novoUserToken);
            if (!r.ok) throw new Error(`❌ Entrada falhou: ${r.data.mensagem}`);
            const mov1 = r.data.movimentacao;
            console.log(`      ✅ Criada (ID: ${mov1.movement_id})`);
            console.log(`         Estoque: ${mov1.estoque_anterior} → ${mov1.estoque_novo}\n`);
            
            // 6b. SAÍDA
            console.log('   📤 Saída (OUT):');
            let saida = {
                product_id: produtoExistente.product_id,
                movement_type: 'OUT',
                quantity: 3,
                notes: 'Teste saída de estoque'
            };
            r = await req('POST', '/movimentacoes', saida, novoUserToken);
            if (!r.ok) throw new Error(`❌ Saída falhou: ${r.data.mensagem}`);
            const mov2 = r.data.movimentacao;
            console.log(`      ✅ Criada (ID: ${mov2.movement_id})`);
            console.log(`         Estoque: ${mov2.estoque_anterior} → ${mov2.estoque_novo}\n`);
            
            // 6c. AJUSTE
            console.log('   🔧 Ajuste (ADJUSTMENT):');
            let ajuste = {
                product_id: produtoExistente.product_id,
                movement_type: 'ADJUSTMENT',
                quantity: 2,
                notes: 'Teste ajuste de estoque'
            };
            r = await req('POST', '/movimentacoes', ajuste, novoUserToken);
            if (!r.ok) throw new Error(`❌ Ajuste falhou: ${r.data.mensagem}`);
            const mov3 = r.data.movimentacao;
            console.log(`      ✅ Criada (ID: ${mov3.movement_id})`);
            console.log(`         Estoque: ${mov3.estoque_anterior} → ${mov3.estoque_novo}\n`);
        }
        
        // 7. LISTAR MOVIMENTAÇÕES
        console.log('7️⃣  LISTAR MOVIMENTAÇÕES');
        console.log('-'.repeat(70));
        r = await req('GET', '/movimentacoes?limit=10', null, adminToken);
        if (!r.ok) throw new Error(`❌ Listar movimentações falhou`);
        const movs = r.data.movimentacoes || [];
        console.log(`✅ ${movs.length} movimentações encontradas\n`);
        
        // 8. ESTATÍSTICAS DO DASHBOARD
        console.log('8️⃣  ESTATÍSTICAS DO DASHBOARD');
        console.log('-'.repeat(70));
        r = await req('GET', '/dashboard/estatisticas', null, adminToken);
        if (!r.ok) throw new Error(`❌ Carregar estatísticas falhou`);
        const stats = r.data;
        console.log(`✅ Dados do dashboard carregados`);
        console.log(`   Vendas mês: R$ ${stats.vendas_mes?.toFixed(2) || '0.00'}`);
        console.log(`   Estoque baixo: ${stats.estoque_baixo || 0} produto(s)`);
        console.log(`   Pedidos hoje: ${stats.pedidos_hoje || 0}`);
        console.log(`   Lucro mês: R$ ${stats.lucro_mes?.toFixed(2) || '0.00'}\n`);
        
        // RESUMO FINAL
        console.log('='.repeat(70));
        console.log('✅ TODOS OS TESTES PASSARAM COM SUCESSO!');
        console.log('='.repeat(70));
        console.log('\n📋 RESUMO:');
        console.log(`  ✓ Login admin`);
        console.log(`  ✓ Criação de novo usuário (Manager)`);
        console.log(`  ✓ Login com novo usuário`);
        console.log(`  ✓ Listagem de produtos`);
        console.log(`  ✓ Edição de produto`);
        console.log(`  ✓ Movimentações (Entrada, Saída, Ajuste)`);
        console.log(`  ✓ Listagem de movimentações`);
        console.log(`  ✓ Estatísticas do dashboard\n`);
        
    } catch (erro) {
        console.error('\n❌ ERRO:', erro.message);
        console.error('\nDetalhes completos:');
        console.error(erro);
        process.exit(1);
    }
}

main();
