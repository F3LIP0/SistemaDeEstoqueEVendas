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
    console.log('\n🧪 TESTE FINAL - CRIAÇÃO DE MOVIMENTAÇÕES\n');
    
    // Login
    console.log('1. Fazendo login...');
    const login = await makeRequest('POST', '/api/login', { username: 'admin', senha: 'admin123' });
    if (login.status !== 200) {
        console.log('❌ Erro no login:', login.body);
        return;
    }
    token = login.body.token;
    console.log('✅ Login OK\n');
    
    // Listar produtos
    const prodRes = await makeRequest('GET', '/api/produtos?limit=1');
    const produto = prodRes.body.produtos[0];
    console.log(`2. Produto: ${produto.product_name} (Estoque: ${produto.current_stock})\n`);
    
    // Teste 1: ENTRADA sem referência
    console.log('3. Criando ENTRADA sem referência...');
    const entrada1 = await makeRequest('POST', '/api/movimentacoes', {
        product_id: produto.product_id,
        movement_type: 'IN',
        quantity: 10,
        notes: 'Entrada teste 1'
    });
    
    if (entrada1.status === 201) {
        console.log('✅ ENTRADA criada!');
        console.log(`   Estoque: ${entrada1.body.movimentacao.estoque_anterior} → ${entrada1.body.movimentacao.estoque_novo}\n`);
    } else {
        console.log('❌ ERRO:', entrada1.body);
        console.log('');
    }
    
    // Teste 2: ENTRADA com referência PURCHASE
    console.log('4. Criando ENTRADA com referência PURCHASE...');
    const entrada2 = await makeRequest('POST', '/api/movimentacoes', {
        product_id: produto.product_id,
        movement_type: 'IN',
        quantity: 25,
        reference_type: 'PURCHASE',
        reference_id: 123,
        notes: 'Entrada de compra #123'
    });
    
    if (entrada2.status === 201) {
        console.log('✅ ENTRADA criada!');
        console.log(`   Estoque: ${entrada2.body.movimentacao.estoque_anterior} → ${entrada2.body.movimentacao.estoque_novo}\n`);
    } else {
        console.log('❌ ERRO:', entrada2.body);
        console.log('');
    }
    
    // Teste 3: SAÍDA
    console.log('5. Criando SAÍDA...');
    const saida = await makeRequest('POST', '/api/movimentacoes', {
        product_id: produto.product_id,
        movement_type: 'OUT',
        quantity: 5,
        reference_type: 'SALE',
        reference_id: 456,
        notes: 'Venda #456'
    });
    
    if (saida.status === 201) {
        console.log('✅ SAÍDA criada!');
        console.log(`   Estoque: ${saida.body.movimentacao.estoque_anterior} → ${saida.body.movimentacao.estoque_novo}\n`);
    } else {
        console.log('❌ ERRO:', saida.body);
        console.log('');
    }
    
    // Teste 4: AJUSTE
    console.log('6. Criando AJUSTE...');
    const ajuste = await makeRequest('POST', '/api/movimentacoes', {
        product_id: produto.product_id,
        movement_type: 'ADJUSTMENT',
        quantity: 3,
        reference_type: 'ADJUSTMENT',
        notes: 'Ajuste de inventário'
    });
    
    if (ajuste.status === 201) {
        console.log('✅ AJUSTE criado!');
        console.log(`   Estoque novo: ${ajuste.body.movimentacao.estoque_novo}\n`);
    } else {
        console.log('❌ ERRO:', ajuste.body);
        console.log('');
    }
    
    // Listar movimentações
    console.log('7. Listando movimentações...');
    const lista = await makeRequest('GET', '/api/movimentacoes?limit=10');
    console.log(`✅ ${lista.body.total} movimentações encontradas\n`);
    
    if (lista.body.movimentacoes && lista.body.movimentacoes.length > 0) {
        console.log('Últimas 5:');
        lista.body.movimentacoes.slice(0, 5).forEach((m, i) => {
            console.log(`${i+1}. ${m.movement_type.padEnd(12)} ${String(m.quantity).padStart(4)} unid - ${m.product_name}`);
        });
    }
    
    console.log('\n✨ TESTES CONCLUÍDOS!\n');
}

test();
