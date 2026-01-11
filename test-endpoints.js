const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Função para fazer requisições
async function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Testes
async function runTests() {
  console.log(`\n${colors.cyan}🧪 INICIANDO TESTES DOS ENDPOINTS${colors.reset}\n`);

  try {
    // 1. Teste de Login
    console.log(`${colors.blue}1️⃣  TESTANDO LOGIN:${colors.reset}`);
    const loginRes = await makeRequest('POST', '/api/login', {
      username: 'admin',
      password: 'admin123'
    });
    console.log(`   Status: ${loginRes.status}`);
    if (loginRes.status === 200 && loginRes.data.token) {
      console.log(`   ${colors.green}✅ Login bem-sucedido!${colors.reset}`);
      console.log(`   Token: ${loginRes.data.token.substring(0, 50)}...`);
      var token = loginRes.data.token;
    } else {
      console.log(`   ${colors.red}❌ Erro no login${colors.reset}`);
      console.log(`   Resposta: ${JSON.stringify(loginRes.data)}`);
      return;
    }

    // 2. Teste de Produtos
    console.log(`\n${colors.blue}2️⃣  TESTANDO GET /api/produtos:${colors.reset}`);
    const prodRes = await makeRequest('GET', '/api/produtos');
    console.log(`   Status: ${prodRes.status}`);
    if (prodRes.status === 200) {
      console.log(`   ${colors.green}✅ Endpoint funcionando!${colors.reset}`);
      console.log(`   Produtos retornados: ${prodRes.data.length || 0}`);
      if (prodRes.data.length > 0) {
        console.log(`   Exemplo: ${prodRes.data[0].product_name || prodRes.data[0].sku}`);
      }
    } else {
      console.log(`   ${colors.red}❌ Erro${colors.reset}`);
    }

    // 3. Teste de Vendas
    console.log(`\n${colors.blue}3️⃣  TESTANDO GET /api/vendas:${colors.reset}`);
    const vendasRes = await makeRequest('GET', '/api/vendas', null, token);
    console.log(`   Status: ${vendasRes.status}`);
    if (vendasRes.status === 200) {
      console.log(`   ${colors.green}✅ Endpoint funcionando!${colors.reset}`);
      console.log(`   Vendas retornadas: ${vendasRes.data.length || 0}`);
    } else {
      console.log(`   ${colors.red}❌ Erro${colors.reset}`);
      console.log(`   Resposta: ${JSON.stringify(vendasRes.data).substring(0, 100)}`);
    }

    // 4. Teste de Dashboard
    console.log(`\n${colors.blue}4️⃣  TESTANDO GET /api/dashboard/estatisticas:${colors.reset}`);
    const dashRes = await makeRequest('GET', '/api/dashboard/estatisticas', null, token);
    console.log(`   Status: ${dashRes.status}`);
    if (dashRes.status === 200) {
      console.log(`   ${colors.green}✅ Endpoint funcionando!${colors.reset}`);
      console.log(`   Estatísticas: ${JSON.stringify(dashRes.data).substring(0, 150)}...`);
    } else {
      console.log(`   ${colors.red}❌ Erro${colors.reset}`);
    }

    // 5. Teste de Ponto
    console.log(`\n${colors.blue}5️⃣  TESTANDO GET /api/ponto:${colors.reset}`);
    const pontoRes = await makeRequest('GET', '/api/ponto', null, token);
    console.log(`   Status: ${pontoRes.status}`);
    if (pontoRes.status === 200) {
      console.log(`   ${colors.green}✅ Endpoint funcionando!${colors.reset}`);
      console.log(`   Registros de ponto: ${pontoRes.data.length || 0}`);
    } else {
      console.log(`   ${colors.red}❌ Erro${colors.reset}`);
    }

    // 6. Teste de Movimentações
    console.log(`\n${colors.blue}6️⃣  TESTANDO GET /api/movimentacoes:${colors.reset}`);
    const movRes = await makeRequest('GET', '/api/movimentacoes', null, token);
    console.log(`   Status: ${movRes.status}`);
    if (movRes.status === 200) {
      console.log(`   ${colors.green}✅ Endpoint funcionando!${colors.reset}`);
      console.log(`   Movimentações: ${movRes.data.length || 0}`);
    } else {
      console.log(`   ${colors.red}❌ Erro${colors.reset}`);
    }

    // 7. Teste de Criar Produto
    console.log(`\n${colors.blue}7️⃣  TESTANDO POST /api/produtos:${colors.reset}`);
    const newProduct = {
      sku: 'TEST-' + Date.now(),
      product_name: 'Produto Teste',
      cost_price: 10.00,
      selling_price: 15.00,
      unit_id: 1,
      category_id: 1,
      brand_id: 1,
      minimum_stock: 5,
      maximum_stock: 100
    };
    const createProdRes = await makeRequest('POST', '/api/produtos', newProduct, token);
    console.log(`   Status: ${createProdRes.status}`);
    if (createProdRes.status === 201 || createProdRes.status === 200) {
      console.log(`   ${colors.green}✅ Produto criado!${colors.reset}`);
      console.log(`   ID: ${createProdRes.data.product_id}`);
    } else {
      console.log(`   ${colors.yellow}⚠️  Status ${createProdRes.status}${colors.reset}`);
      console.log(`   Resposta: ${JSON.stringify(createProdRes.data).substring(0, 100)}`);
    }

    console.log(`\n${colors.green}🎉 TESTES CONCLUÍDOS!${colors.reset}\n`);

  } catch (error) {
    console.log(`${colors.red}❌ Erro durante os testes:${colors.reset}`);
    console.error(error.message);
  }
}

// Aguardar um pouco para garantir que o servidor está pronto
setTimeout(runTests, 1000);
