require('dotenv').config();
const http = require('http');

const adminCredentials = { username: 'admin', senha: 'admin123' };
let token = null;
let tempProductId = null;

function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (token) options.headers.Authorization = `Bearer ${token}`;

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function test() {
    console.log('\n🧪 TESTE COMPLETO - SISTEMA DE MOVIMENTAÇÕES DE ESTOQUE\n');
    console.log('='.repeat(70) + '\n');

    try {
        console.log('1️⃣  Autenticando...');
        const loginRes = await makeRequest('POST', '/api/login', adminCredentials);
        if (loginRes.status !== 200) {
            console.log('❌ Falha no login:', loginRes.body);
            return;
        }
        token = loginRes.body.token;
        console.log('✅ Autenticado com sucesso!\n');

        console.log('2️⃣  Criando produto temporário para teste...');
        const tempProductPayload = {
            sku: `MOV-${Date.now()}`,
            product_name: `Produto Mov Teste ${Date.now()}`,
            unit_id: 1,
            cost_price: 10,
            selling_price: 20,
            minimum_stock: 5,
            maximum_stock: 500
        };
        const tempProductRes = await makeRequest('POST', '/api/produtos', tempProductPayload);
        if (tempProductRes.status !== 201) {
            console.log('❌ Falha ao criar produto temporário:', tempProductRes.body);
            return;
        }
        tempProductId = tempProductRes.body.id;
        console.log(`✅ Produto temporário criado (ID: ${tempProductId})\n`);

        console.log('3️⃣  Carregando produto temporário...');
        const prodRes = await makeRequest('GET', '/api/produtos?limit=100');
        const produtos = prodRes.body.produtos || [];
        const produto = produtos.find((p) => p.product_id === tempProductId);
        if (!produto) {
            console.log('❌ Produto temporário não encontrado após criação.\n');
            return;
        }
        console.log(`✅ Produto selecionado: ${produto.product_name}`);
        console.log(`   ID: ${produto.product_id} | Estoque atual: ${produto.current_stock}\n`);

        console.log('4️⃣  Criando ENTRADA (+50 unidades)...');
        const entrada = await makeRequest('POST', '/api/movimentacoes', {
            product_id: produto.product_id,
            movement_type: 'IN',
            quantity: 50,
            reference_type: 'PURCHASE_ORDER',
            reference_id: 999,
            notes: 'Entrada teste automático'
        });

        if (entrada.status === 201) {
            console.log('✅ ENTRADA registrada!');
            console.log(`   Qtd: +${entrada.body.movimentacao.quantity}`);
            console.log(`   Estoque: ${entrada.body.movimentacao.estoque_anterior} → ${entrada.body.movimentacao.estoque_novo}\n`);
        } else {
            console.log('❌', entrada.body);
        }

        console.log('5️⃣  Criando SAÍDA (-15 unidades)...');
        const saida = await makeRequest('POST', '/api/movimentacoes', {
            product_id: produto.product_id,
            movement_type: 'OUT',
            quantity: 15,
            notes: 'Saída teste automático'
        });

        if (saida.status === 201) {
            console.log('✅ SAÍDA registrada!');
            console.log(`   Qtd: ${saida.body.movimentacao.quantity}`);
            console.log(`   Estoque: ${saida.body.movimentacao.estoque_anterior} → ${saida.body.movimentacao.estoque_novo}\n`);
        } else {
            console.log('❌', saida.body);
        }

        console.log('6️⃣  Criando AJUSTE (+3 unidades)...');
        const ajuste = await makeRequest('POST', '/api/movimentacoes', {
            product_id: produto.product_id,
            movement_type: 'ADJUSTMENT',
            quantity: 3,
            notes: 'Ajuste de inventário'
        });

        if (ajuste.status === 201) {
            console.log('✅ AJUSTE registrado!');
            console.log(`   Qtd: ${ajuste.body.movimentacao.quantity}`);
            console.log(`   Novo estoque: ${ajuste.body.movimentacao.estoque_novo}\n`);
        }

        console.log('7️⃣  Listando todas as movimentações...');
        const lista = await makeRequest('GET', '/api/movimentacoes?limit=10');
        const movs = lista.body.movimentacoes || [];
        console.log(`✅ ${movs.length} movimentações encontradas\n`);
        
        console.log('   📋 Últimas movimentações:');
        movs.slice(0, 5).forEach((m, i) => {
            console.log(`   ${i+1}. ${m.movement_type.padEnd(11)} | ${String(m.quantity).padStart(4)} unid | ${m.product_name}`);
        });

        console.log(`\n8️⃣  Histórico do produto "${produto.product_name}"...`);
        const hist = await makeRequest('GET', `/api/movimentacoes/produto/${produto.product_id}`);
        console.log(`✅ ${hist.body.total} movimentações deste produto\n`);

        console.log('9️⃣  Análise geral...');
        const analise = await makeRequest('GET', '/api/movimentacoes/filtros/analise');
        const stats = analise.body.estatisticas;
        console.log('✅ Estatísticas:');
        console.log(`   • Total: ${stats.total_movimentacoes} movimentações`);
        console.log(`   • Entradas: ${stats.entradas} registros (${stats.qtd_total_entrada} unid)`);
        console.log(`   • Saídas: ${stats.saidas} registros (${stats.qtd_total_saida} unid)`);
        console.log(`   • Ajustes: ${stats.ajustes} registros (${stats.qtd_total_ajuste} unid)`);

        console.log('\n' + '='.repeat(70));
        console.log('✨ TODOS OS TESTES EXECUTADOS COM SUCESSO!');
        console.log('='.repeat(70) + '\n');

    } catch (erro) {
        console.error('\n❌ ERRO:', erro.message, erro);
    } finally {
        if (token && tempProductId) {
            await makeRequest('DELETE', `/api/produtos/${tempProductId}`);
            console.log(`\n🧹 Cleanup: produto temporário ${tempProductId} removido.`);
        }
    }
}

test();
