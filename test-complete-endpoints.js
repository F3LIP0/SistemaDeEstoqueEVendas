/**
 * TESTES DE ENDPOINTS - API COMPLETA v2.0
 * Testa todos os endpoints CRUD implementados
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000/api';
let TOKEN = '';

// Cores para console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

// Função para fazer requisições HTTP
function request(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {})
            }
        };

        const req = http.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({ status: res.statusCode, body: response });
                } catch (e) {
                    resolve({ status: res.statusCode, body });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

// TESTES
async function runTests() {
    log('\n================================', 'blue');
    log('🧪 TESTES DE ENDPOINTS - v2.0', 'blue');
    log('================================\n', 'blue');

    try {
        // 1. LOGIN
        log('1️⃣  Testando POST /api/login', 'yellow');
        let res = await request('POST', '/login', {
            email: 'admin@empresa.com',
            senha: 'admin123'
        });
        if (res.status === 200 && res.body.token) {
            TOKEN = res.body.token;
            log('✅ Login bem-sucedido', 'green');
        } else {
            log('❌ Erro no login', 'red');
            return;
        }

        // 2. LISTAR USUÁRIOS
        log('\n2️⃣  Testando GET /api/usuarios', 'yellow');
        res = await request('GET', '/usuarios');
        if (res.status === 200) {
            log(`✅ Usuários listados: ${res.body.total || res.body.usuarios?.length || 0}`, 'green');
        } else {
            log(`❌ Erro ao listar usuários: ${res.status}`, 'red');
        }

        // 3. CRIAR USUÁRIO
        log('\n3️⃣  Testando POST /api/usuarios', 'yellow');
        const newUser = {
            username: `teste_${Date.now()}`,
            email: `teste_${Date.now()}@empresa.com`,
            senha: '123456',
            full_name: 'Usuário Teste',
            role_name: 'EMPLOYEE'
        };
        res = await request('POST', '/usuarios', newUser);
        let newUserId = null;
        if (res.status === 201) {
            newUserId = res.body.id;
            log(`✅ Usuário criado com ID: ${newUserId}`, 'green');
        } else {
            log(`❌ Erro ao criar usuário: ${res.body.mensagem || res.status}`, 'red');
        }

        // 4. ATUALIZAR USUÁRIO
        if (newUserId) {
            log('\n4️⃣  Testando PUT /api/usuarios/:id', 'yellow');
            res = await request('PUT', `/usuarios/${newUserId}`, {
                full_name: 'Usuário Teste Atualizado'
            });
            if (res.status === 200) {
                log('✅ Usuário atualizado com sucesso', 'green');
            } else {
                log(`❌ Erro ao atualizar usuário: ${res.status}`, 'red');
            }
        }

        // 5. LISTAR PRODUTOS
        log('\n5️⃣  Testando GET /api/productos', 'yellow');
        res = await request('GET', '/productos?limit=10');
        if (res.status === 200) {
            log(`✅ Produtos listados: ${res.body.productos?.length || 0}`, 'green');
        } else {
            log(`❌ Erro ao listar produtos: ${res.status}`, 'red');
        }

        // 6. CRIAR PRODUTO
        log('\n6️⃣  Testando POST /api/productos', 'yellow');
        const newProduct = {
            sku: `TEST-${Date.now()}`,
            product_name: 'Produto Teste',
            category_id: 1,
            brand_id: 1,
            unit_id: 1,
            cost_price: 100,
            selling_price: 150,
            minimum_stock: 5,
            maximum_stock: 50
        };
        res = await request('POST', '/productos', newProduct);
        let newProductId = null;
        if (res.status === 201) {
            newProductId = res.body.id;
            log(`✅ Produto criado com ID: ${newProductId}`, 'green');
        } else {
            log(`❌ Erro ao criar produto: ${res.body.mensagem || res.status}`, 'red');
        }

        // 7. ATUALIZAR PRODUTO
        if (newProductId) {
            log('\n7️⃣  Testando PUT /api/productos/:id', 'yellow');
            res = await request('PUT', `/productos/${newProductId}`, {
                product_name: 'Produto Teste Atualizado',
                selling_price: 200
            });
            if (res.status === 200) {
                log('✅ Produto atualizado com sucesso', 'green');
            } else {
                log(`❌ Erro ao atualizar produto: ${res.status}`, 'red');
            }
        }

        // 8. LISTAR VENDAS
        log('\n8️⃣  Testando GET /api/vendas', 'yellow');
        res = await request('GET', '/vendas?limit=10');
        if (res.status === 200) {
            log(`✅ Vendas listadas: ${res.body.vendas?.length || 0}`, 'green');
        } else {
            log(`❌ Erro ao listar vendas: ${res.status}`, 'red');
        }

        // 9. DASHBOARD
        log('\n9️⃣  Testando GET /api/dashboard/estatisticas', 'yellow');
        res = await request('GET', '/dashboard/estatisticas');
        if (res.status === 200) {
            log('✅ Dashboard carregado com sucesso', 'green');
        } else {
            log(`❌ Erro ao carregar dashboard: ${res.status}`, 'red');
        }

        // 10. PONTO
        log('\n🔟 Testando GET /api/ponto', 'yellow');
        res = await request('GET', '/ponto');
        if (res.status === 200) {
            log('✅ Ponto carregado com sucesso', 'green');
        } else {
            log(`❌ Erro ao carregar ponto: ${res.status}`, 'red');
        }

        // 11. MOVIMENTAÇÕES
        log('\n1️⃣1️⃣  Testando GET /api/movimentacoes', 'yellow');
        res = await request('GET', '/movimentacoes?limit=10');
        if (res.status === 200) {
            log(`✅ Movimentações listadas: ${res.body.movimentacoes?.length || 0}`, 'green');
        } else {
            log(`❌ Erro ao listar movimentações: ${res.status}`, 'red');
        }

        // 12. HEALTH CHECK
        log('\n1️⃣2️⃣  Testando GET /api/health', 'yellow');
        res = await request('GET', '/health');
        if (res.status === 200 && res.body.ok) {
            log('✅ Servidor online', 'green');
        } else {
            log(`❌ Erro no health check: ${res.status}`, 'red');
        }

        // 13. DELETAR PRODUTO
        if (newProductId) {
            log('\n1️⃣3️⃣  Testando DELETE /api/productos/:id', 'yellow');
            res = await request('DELETE', `/productos/${newProductId}`);
            if (res.status === 200) {
                log('✅ Produto deletado com sucesso', 'green');
            } else {
                log(`❌ Erro ao deletar produto: ${res.status}`, 'red');
            }
        }

        // 14. DELETAR USUÁRIO
        if (newUserId) {
            log('\n1️⃣4️⃣  Testando DELETE /api/usuarios/:id', 'yellow');
            res = await request('DELETE', `/usuarios/${newUserId}`);
            if (res.status === 200) {
                log('✅ Usuário deletado com sucesso', 'green');
            } else {
                log(`❌ Erro ao deletar usuário: ${res.status}`, 'red');
            }
        }

        log('\n================================', 'blue');
        log('✅ TESTES CONCLUÍDOS', 'green');
        log('================================\n', 'blue');

    } catch (error) {
        log(`\n❌ ERRO: ${error.message}`, 'red');
        log('\n⚠️  Certifique-se de que o servidor está rodando em http://localhost:3000', 'yellow');
    }
}

// Executar testes
runTests();
