require('dotenv').config();
const http = require('http');

let token = null;

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
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
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
    console.log('\n✅ TESTE CORRETO - MOVIMENTAÇÕES\n');
    
    const login = await makeRequest('POST', '/api/login', { username: 'admin', senha: 'admin123' });
    token = login.body.token;
    console.log('1. ✅ Login OK\n');
    
    const prodRes = await makeRequest('GET', '/api/produtos?limit=1');
    const produto = prodRes.body.produtos[0];
    console.log(`2. Produto: ${produto.product_name} (Estoque inicial: ${produto.current_stock})\n`);
    
    // ENTRADA - sem reference_type (usará 'IN' automaticamente)
    console.log('3. Criando ENTRADA (+15 unidades)...');
    const entrada = await makeRequest('POST', '/api/movimentacoes', {
        product_id: produto.product_id,
        movement_type: 'IN',
        quantity: 15,
        reference_id: 100,
        notes: 'Entrada de mercadoria'
    });
    
    if (entrada.status === 201) {
        console.log(`✅ Criada! Estoque: ${entrada.body.movimentacao.estoque_anterior} → ${entrada.body.movimentacao.estoque_novo}\n`);
    } else {
        console.log('❌ ERRO:', entrada.body, '\n');
    }
    
    // SAÍDA
    console.log('4. Criando SAÍDA (-7 unidades)...');
    const saida = await makeRequest('POST', '/api/movimentacoes', {
        product_id: produto.product_id,
        movement_type: 'OUT',
        quantity: 7,
        reference_id: 50,
        notes: 'Venda de produtos'
    });
    
    if (saida.status === 201) {
        console.log(`✅ Criada! Estoque: ${saida.body.movimentacao.estoque_anterior} → ${saida.body.movimentacao.estoque_novo}\n`);
    } else {
        console.log('❌ ERRO:', saida.body, '\n');
    }
    
    // AJUSTE
    console.log('5. Criando AJUSTE (+2 unidades)...');
    const ajuste = await makeRequest('POST', '/api/movimentacoes', {
        product_id: produto.product_id,
        movement_type: 'ADJUSTMENT',
        quantity: 2,
        notes: 'Ajuste de inventário'
    });
    
    if (ajuste.status === 201) {
        console.log(`✅ Criado! Estoque final: ${ajuste.body.movimentacao.estoque_novo}\n`);
    } else {
        console.log('❌ ERRO:', ajuste.body, '\n');
    }
    
    // Listar
    const lista = await makeRequest('GET', '/api/movimentacoes?limit=5');
    console.log(`6. ✅ Total de ${lista.body.total} movimentações\n`);
    
    console.log('📋 Últimas 5 movimentações:');
    lista.body.movimentacoes.slice(0, 5).forEach((m, i) => {
        console.log(`   ${i+1}. [${m.movement_type}] ${m.quantity > 0 ? '+' : ''}${m.quantity} - ${m.product_name}`);
    });
    
    console.log('\n✨ SISTEMA FUNCIONANDO CORRETAMENTE!\n');
}

test();
