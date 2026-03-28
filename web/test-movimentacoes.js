require('dotenv').config();
const http = require('http');

// Credenciais de teste
const adminCredentials = {
    username: 'admin',
    password: '123456'
};

let token = null;

function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers.Authorization = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        body: data ? JSON.parse(data) : null,
                        headers: res.headers
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        body: data,
                        headers: res.headers
                    });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    console.log('🧪 Iniciando testes de Movimentações de Estoque...\n');

    try {
        // 1. Login
        console.log('1️⃣ Fazendo login...');
        const loginRes = await makeRequest('POST', '/api/login', adminCredentials);
        if (loginRes.status !== 200) {
            console.log('❌ Erro ao fazer login:', loginRes.body);
            return;
        }
        token = loginRes.body.token;
        console.log('✅ Login realizado com sucesso!');
        console.log(`   Token: ${token.substring(0, 20)}...\n`);

        // 2. Listar produtos
        console.log('2️⃣ Listando produtos...');
        const produtosRes = await makeRequest('GET', '/api/produtos?limit=5');
        if (produtosRes.status !== 200) {
            console.log('❌ Erro ao listar produtos:', produtosRes.body);
            return;
        }
        const produtos = produtosRes.body.produtos || [];
        console.log(`✅ ${produtos.length} produtos encontrados`);
        
        if (produtos.length === 0) {
            console.log('⚠️  Nenhum produto encontrado. Pulando testes de movimentação.');
            return;
        }

        const produtoTeste = produtos[0];
        console.log(`   Usando produto: ${produtoTeste.product_name} (ID: ${produtoTeste.product_id})\n`);

        // 3. Criar movimentação de entrada
        console.log('3️⃣ Criando movimentação de ENTRADA...');
        const entradaRes = await makeRequest('POST', '/api/movimentacoes', {
            product_id: produtoTeste.product_id,
            movement_type: 'IN',
            quantity: 50,
            reference_type: 'PURCHASE_ORDER',
            reference_id: 1,
            notes: 'Entrada de teste via API'
        });
        if (entradaRes.status !== 201) {
            console.log('❌ Erro ao criar entrada:', entradaRes.body);
        } else {
            console.log('✅ Entrada criada com sucesso!');
            console.log('   Detalhes:', JSON.stringify(entradaRes.body.movimentacao, null, 2));
        }
        console.log();

        // 4. Criar movimentação de saída
        console.log('4️⃣ Criando movimentação de SAÍDA...');
        const saidaRes = await makeRequest('POST', '/api/movimentacoes', {
            product_id: produtoTeste.product_id,
            movement_type: 'OUT',
            quantity: 10,
            reference_type: 'SALES_ORDER',
            reference_id: 1,
            notes: 'Saída de teste via API'
        });
        if (saidaRes.status !== 201) {
            console.log('❌ Erro ao criar saída:', saidaRes.body);
        } else {
            console.log('✅ Saída criada com sucesso!');
            console.log('   Detalhes:', JSON.stringify(saidaRes.body.movimentacao, null, 2));
        }
        console.log();

        // 5. Criar ajuste
        console.log('5️⃣ Criando movimentação de AJUSTE...');
        const ajusteRes = await makeRequest('POST', '/api/movimentacoes', {
            product_id: produtoTeste.product_id,
            movement_type: 'ADJUSTMENT',
            quantity: 5,
            notes: 'Ajuste de teste via API'
        });
        if (ajusteRes.status !== 201) {
            console.log('❌ Erro ao criar ajuste:', ajusteRes.body);
        } else {
            console.log('✅ Ajuste criado com sucesso!');
            console.log('   Detalhes:', JSON.stringify(ajusteRes.body.movimentacao, null, 2));
        }
        console.log();

        // 6. Listar todas as movimentações
        console.log('6️⃣ Listando todas as movimentações...');
        const listRes = await makeRequest('GET', '/api/movimentacoes?limit=20');
        if (listRes.status !== 200) {
            console.log('❌ Erro ao listar:', listRes.body);
        } else {
            console.log(`✅ ${listRes.body.total} movimentações encontradas`);
            if (listRes.body.movimentacoes && listRes.body.movimentacoes.length > 0) {
                console.log('   Últimas 3 movimentações:');
                listRes.body.movimentacoes.slice(0, 3).forEach((m, i) => {
                    console.log(`   ${i+1}. ${m.movement_type} - ${m.quantity} unidades - ${m.product_name}`);
                });
            }
        }
        console.log();

        // 7. Obter histórico de um produto
        console.log(`7️⃣ Obtendo histórico do produto ${produtoTeste.product_id}...`);
        const historicoRes = await makeRequest('GET', `/api/movimentacoes/produto/${produtoTeste.product_id}`);
        if (historicoRes.status !== 200) {
            console.log('❌ Erro ao obter histórico:', historicoRes.body);
        } else {
            console.log(`✅ ${historicoRes.body.total} movimentações do produto`);
            if (historicoRes.body.movimentacoes && historicoRes.body.movimentacoes.length > 0) {
                console.log('   Movimentações:');
                historicoRes.body.movimentacoes.slice(0, 3).forEach((m, i) => {
                    console.log(`   ${i+1}. ${m.movement_type} - ${m.quantity} - ${new Date(m.movement_date).toLocaleString()}`);
                });
            }
        }
        console.log();

        // 8. Análise de movimentações
        console.log('8️⃣ Obtendo análise de movimentações...');
        const analiseRes = await makeRequest('GET', '/api/movimentacoes/filtros/analise?tipo=IN');
        if (analiseRes.status !== 200) {
            console.log('❌ Erro ao obter análise:', analiseRes.body);
        } else {
            console.log('✅ Análise obtida com sucesso!');
            console.log('   Estatísticas:', JSON.stringify(analiseRes.body.estatisticas, null, 2));
        }
        console.log();

        console.log('✨ Todos os testes foram executados!');

    } catch (error) {
        console.error('❌ Erro durante os testes:', error.message);
    }
}

runTests();
