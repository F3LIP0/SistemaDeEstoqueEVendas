# 📋 ESPECIFICAÇÃO DE REQUISITOS

## 1. REQUISITOS FUNCIONAIS (RF)

### 1.1 Autenticação e Autorização

#### RF-01: Login de Usuário
- **Descrição**: Usuário deve fazer login fornecendo credenciais (email/usuario e senha)
- **Atores**: Todos os usuários do sistema
- **Pré-condição**: Usuário registrado no banco de dados
- **Fluxo Principal**:
  1. Usuário acessa tela de login
  2. Insere email/usuário e senha
  3. Sistema valida credenciais contra banco de dados
  4. Se válido, retorna JWT token com 24h de validade
  5. Token é armazenado em localStorage
- **Pós-condição**: Usuário autenticado e redirecionado ao dashboard
- **Restrições**: Senha deve ter mínimo 6 caracteres
- **Prioridade**: CRÍTICA

#### RF-02: Logout de Usuário
- **Descrição**: Usuário deve poder fazer logout, limpando sessão e token
- **Atores**: Todos os usuários autenticados
- **Pré-condição**: Usuário autenticado com token válido
- **Fluxo Principal**:
  1. Usuário clica em "Logout"
  2. Sistema remove token de localStorage
  3. Usuário é redirecionado para tela de login
- **Pós-condição**: Sessão encerrada
- **Prioridade**: CRÍTICA

#### RF-03: Controle de Acesso por Perfil
- **Descrição**: Sistema deve validar permissões baseadas no perfil do usuário
- **Atores**: Sistema
- **Fluxo Principal**:
  1. Usuário faz requisição à API
  2. Middleware extrai JWT do header Authorization
  3. Sistema verifica role do usuário (EMPLOYEE=1, MANAGER=2, ADMIN=3)
  4. Se autorizado, executa operação; se não, retorna erro 403
- **Restrições**: 
  - EMPLOYEE: Leitura apenas de dados públicos
  - MANAGER: CRUD de vendas e estoque
  - ADMIN: Acesso total ao sistema
- **Prioridade**: CRÍTICA

---

### 1.2 Gestão de Usuários

#### RF-04: Criar Novo Usuário (ADMIN)
- **Descrição**: Administrador cria novo usuário no sistema
- **Atores**: Administrador
- **Endpoint**: POST /api/usuarios
- **Campos obrigatórios**: email, nome, usuario, senha, role_id
- **Validações**:
  - Email deve ser único
  - Usuário deve ser único
  - Role_id deve existir na tabela roles
  - Senha encriptada com bcrypt (10 salt rounds)
- **Resposta**: Usuário criado com ID gerado
- **Prioridade**: ALTA

#### RF-05: Listar Usuários (MANAGER+)
- **Descrição**: Listar todos os usuários do sistema
- **Endpoint**: GET /api/usuarios
- **Parâmetros**: page, limit
- **Resposta**: JSON com array de usuários + paginação
- **Restrições**: Apenas MANAGER e ADMIN podem ver
- **Prioridade**: MÉDIA

#### RF-06: Atualizar Usuário (ADMIN)
- **Descrição**: Atualizar dados de um usuário
- **Endpoint**: PUT /api/usuarios/:id
- **Campos atualizáveis**: nome, email, usuario, role_id
- **Validações**: Email e usuario únicos
- **Resposta**: Usuário atualizado
- **Prioridade**: ALTA

#### RF-07: Deletar Usuário (ADMIN)
- **Descrição**: Remover usuário do sistema
- **Endpoint**: DELETE /api/usuarios/:id
- **Validações**: Não pode deletar último admin
- **Resposta**: Confirmação de deleção
- **Prioridade**: MÉDIA

---

### 1.3 Gestão de Produtos

#### RF-08: Criar Produto (MANAGER+)
- **Descrição**: Cadastrar novo produto no catálogo
- **Endpoint**: POST /api/productos
- **Campos obrigatórios**: 
  - sku (único)
  - nome
  - categoria_id (FK)
  - marca_id (FK)
  - preco_custo
  - preco_venda
  - preco_venda >= preco_custo
  - estoque_minimo
  - estoque_maximo
  - estoque_minimo <= estoque_maximo
  - unidade_id (FK)
- **Validações**:
  - SKU deve ser único
  - Preço venda >= preço custo
  - Estoque mínimo <= estoque máximo
  - Categoria, marca e unidade devem existir
- **Resposta**: Produto criado com ID
- **Prioridade**: CRÍTICA

#### RF-09: Listar Produtos (TODOS)
- **Descrição**: Visualizar catálogo de produtos
- **Endpoint**: GET /api/productos
- **Parâmetros**: page, limit, categoria_id (opcional)
- **Resposta**: Array de produtos + paginação
- **Campos retornados**: id, sku, nome, categoria, marca, preco_venda, estoque_atual
- **Prioridade**: CRÍTICA

#### RF-10: Buscar Produto por ID (TODOS)
- **Descrição**: Obter detalhes completos de um produto
- **Endpoint**: GET /api/productos/:id
- **Resposta**: Objeto com todos os dados do produto
- **Prioridade**: ALTA

#### RF-11: Atualizar Produto (MANAGER+)
- **Descrição**: Modificar dados de um produto existente
- **Endpoint**: PUT /api/productos/:id
- **Campos atualizáveis**: nome, preco_custo, preco_venda, estoque_minimo, estoque_maximo, ativo
- **Validações**: Mesmas de criação
- **Resposta**: Produto atualizado
- **Prioridade**: ALTA

#### RF-12: Deletar Produto (ADMIN)
- **Descrição**: Remover produto do catálogo
- **Endpoint**: DELETE /api/productos/:id
- **Restrições**: Apenas soft-delete (marcar como inativo)
- **Prioridade**: MÉDIA

---

### 1.4 Gestão de Vendas

#### RF-13: Criar Venda (SELLER+)
- **Descrição**: Registrar nova venda no sistema
- **Endpoint**: POST /api/vendas
- **Campos obrigatórios**:
  - cliente_id (FK)
  - data_venda
  - itens (array com produto_id e quantidade)
- **Validações**:
  - Cliente deve existir
  - Produto deve ter estoque suficiente
  - Quantidade > 0
  - Estoque é decrementado automaticamente
- **Resposta**: Venda criada com ID e total
- **Prioridade**: CRÍTICA

#### RF-14: Listar Vendas (MANAGER+)
- **Descrição**: Visualizar todas as vendas
- **Endpoint**: GET /api/vendas
- **Parâmetros**: page, limit, data_inicio, data_fim (filtros opcionais)
- **Resposta**: Array de vendas com totalizações
- **Campos**: id, cliente, data, total, usuario
- **Prioridade**: CRÍTICA

#### RF-15: Detalhes da Venda
- **Descrição**: Ver itens e detalhes completos de uma venda
- **Endpoint**: GET /api/vendas/:id
- **Resposta**: Venda com array de itens incluindo produto, quantidade, preço unitário
- **Prioridade**: ALTA

#### RF-16: Atualizar Venda (MANAGER+)
- **Descrição**: Modificar uma venda já realizada
- **Endpoint**: PUT /api/vendas/:id
- **Campos atualizáveis**: data_venda, cliente_id, status
- **Validações**: Reverter estoque da venda anterior antes de aplicar nova
- **Prioridade**: MÉDIA

#### RF-17: Cancelar Venda (MANAGER+)
- **Descrição**: Cancelar venda e devolver estoque
- **Endpoint**: DELETE /api/vendas/:id
- **Fluxo**:
  1. Marca venda como cancelada
  2. Devolve quantidade de cada item para o estoque
- **Prioridade**: MÉDIA

---

### 1.5 Controle de Estoque

#### RF-18: Visualizar Estoque (TODOS)
- **Descrição**: Ver quantidade atual em estoque de cada produto
- **Endpoint**: GET /api/movimentacoes (com filtros)
- **Campos**: produto_id, quantidade_atual, estoque_minimo, estoque_maximo, status_alerta
- **Prioridade**: CRÍTICA

#### RF-19: Alertas de Estoque Baixo
- **Descrição**: Identificar produtos com estoque <= mínimo
- **Campo calculado**: status_alerta (NORMAL, BAIXO, CRÍTICO)
- **Fluxo**:
  - Se estoque <= estoque_minimo → CRÍTICO
  - Se estoque <= estoque_minimo * 1.5 → BAIXO
  - Senão → NORMAL
- **Prioridade**: ALTA

#### RF-20: Movimentações de Estoque (MANAGER+)
- **Descrição**: Registrar entradas e saídas manuais de estoque
- **Endpoint**: POST /api/movimentacoes
- **Campos**: produto_id, tipo (entrada/saida), quantidade, motivo
- **Validações**:
  - Quantidade > 0
  - Não pode sair mais do que tem em estoque
  - Tipo deve ser entrada ou saída
- **Prioridade**: MÉDIA

---

### 1.6 Controle de Ponto

#### RF-21: Registrar Entrada de Ponto (EMPLOYEE)
- **Descrição**: Funcionário registra sua entrada
- **Endpoint**: POST /api/ponto/entrada
- **Dados**: Automático (user_id, timestamp, local via IP)
- **Validações**: Máximo 1 entrada por dia por usuário
- **Prioridade**: ALTA

#### RF-22: Registrar Saída de Ponto (EMPLOYEE)
- **Descrição**: Funcionário registra sua saída
- **Endpoint**: POST /api/ponto/saida
- **Dados**: Automático (user_id, timestamp)
- **Validações**: Deve haver entrada no mesmo dia
- **Prioridade**: ALTA

#### RF-23: Visualizar Ponto (EMPLOYEE)
- **Descrição**: Funcionário visualiza seu histórico de ponto
- **Endpoint**: GET /api/ponto/meu-ponto
- **Parâmetros**: mes, ano
- **Resposta**: Array com entrada/saída, total de horas trabalhadas
- **Prioridade**: MÉDIA

#### RF-24: Relatório de Ponto (MANAGER+)
- **Descrição**: Gerente visualiza ponto de todos os funcionários
- **Endpoint**: GET /api/ponto
- **Parâmetros**: usuario_id, data_inicio, data_fim
- **Resposta**: Relatório com faltas, atrasos, horas extras
- **Prioridade**: MÉDIA

---

### 1.7 Dashboard e Relatórios

#### RF-25: Dashboard Principal (TODOS)
- **Descrição**: Exibir visão geral do negócio com estatísticas
- **Endpoint**: GET /api/dashboard
- **Métricas**:
  - Total de vendas (mês atual)
  - Faturamento (mês atual)
  - Produtos em falta (estoque <= mínimo)
  - Produtos mais vendidos (top 5)
  - Gráfico de vendas por dia (últimos 30 dias)
  - Número de usuários online
- **Resposta**: JSON com todas as métricas
- **Prioridade**: CRÍTICA

---

## 2. REQUISITOS NÃO-FUNCIONAIS (RNF)

### 2.1 Performance

#### RNF-01: Tempo de Resposta da API
- **Descrição**: Todas as requisições devem responder em tempo aceitável
- **Métricas**:
  - GET simples: < 100ms
  - GET com JOIN: < 300ms
  - POST com validações: < 500ms
  - Listagens paginadas: < 200ms
- **Ferramenta de Medição**: Postman, browser DevTools

#### RNF-02: Paginação
- **Descrição**: Listagens devem usar paginação para evitar sobrecarga
- **Implementação**: Limit padrão = 10, máximo = 100 registros por página
- **Parâmetros**: page, limit

#### RNF-03: Índices de Banco de Dados
- **Descrição**: Índices em colunas frequentemente consultadas
- **Campos indexados**: sku, email, usuario, categoria_id, data_venda, user_id

---

### 2.2 Segurança

#### RNF-04: Autenticação JWT
- **Descrição**: Todas as requisições (exceto login) devem incluir JWT válido
- **Implementação**:
  - Algoritmo: HS256
  - Validade: 24 horas
  - Secret: Armazenado em variável de ambiente
  - Header: Authorization: Bearer <token>

#### RNF-05: Hashing de Senhas
- **Descrição**: Senhas nunca são armazenadas em texto plano
- **Implementação**: bcryptjs com 10 salt rounds
- **Validação**: Comparação segura em cada login

#### RNF-06: CORS
- **Descrição**: API deve aceitar requisições apenas de origens autorizadas
- **Configuração**: 
  - Frontend: http://localhost:3000
  - Preflight: OPTIONS habilitado para todos os endpoints
- **Headers**: 
  - Access-Control-Allow-Origin: *
  - Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
  - Access-Control-Allow-Headers: Content-Type, Authorization

#### RNF-07: Validação de Entrada
- **Descrição**: Todas as entradas de usuário devem ser validadas
- **Implementação**:
  - Tipo de dado correto (string, number, date)
  - Comprimento máximo/mínimo
  - Valores permitidos (enums)
  - Sem caracteres especiais perigosos (SQL injection, XSS)

#### RNF-08: SQL Injection Prevention
- **Descrição**: Usar prepared statements / parameterized queries
- **Implementação**: Todas as queries usam placeholders ($1, $2) do driver pg

#### RNF-09: Proteção contra CSRF
- **Descrição**: Proteger contra Cross-Site Request Forgery
- **Implementação**: Token CSRF em cookies (versão 3.0)

---

### 2.3 Confiabilidade

#### RNF-10: Backup de Dados
- **Descrição**: Dados devem ser automaticamente backed-up
- **Frequência**: Diária
- **Implementação**: Supabase gerencia backups automáticos

#### RNF-11: Tratamento de Erros
- **Descrição**: Sistema deve tratar erros gracefully
- **Implementação**:
  - Try-catch em todas as rotas
  - Mensagens de erro amigáveis (não expor stack traces)
  - Logging de erros para debug

#### RNF-12: Integridade de Dados
- **Descrição**: Operações críticas devem ser atômicas
- **Implementação**: Transações no banco de dados para vendas

---

### 2.4 Escalabilidade

#### RNF-13: Arquitetura Preparada para Crescimento
- **Implementação**:
  - Separação backend/frontend
  - Banco de dados em ambiente cloud (Supabase)
  - API RESTful (facilita futura migração para GraphQL)
  - Paginação implementada

#### RNF-14: Preparado para Multi-Tenant (v3.0)
- **Implementação**: Tabelas preparadas com empresa_id (future-ready)

---

### 2.5 Usabilidade

#### RNF-15: Interface Responsiva
- **Descrição**: Sistema funciona em desktop, tablet e mobile
- **Breakpoints**:
  - Desktop: > 1200px
  - Tablet: 768px - 1199px
  - Mobile: < 768px
- **Teste**: Chrome DevTools device emulation

#### RNF-16: Acessibilidade
- **Descrição**: Interface acessível para usuários com deficiências
- **Implementação**:
  - Cores com contraste adequado
  - Labels em formulários
  - ARIA labels onde necessário
  - Navegação por teclado

#### RNF-17: Performance Visual
- **Descrição**: Interface carrega e responde rapidamente
- **Métricas**:
  - First Contentful Paint: < 2s
  - Largest Contentful Paint: < 4s
  - Time to Interactive: < 5s

---

### 2.6 Disponibilidade

#### RNF-18: Uptime
- **Descrição**: Sistema deve estar disponível 99% do tempo
- **Target**: 99% uptime (máximo 3.6h downtime/mês)

#### RNF-19: Recuperação de Falhas
- **Descrição**: Sistema deve se recuperar de falhas gracefully
- **Implementação**:
  - Fallback para PostgreSQL direto se Supabase falhar
  - Health check endpoint (/api/health)
  - Logs de erro para diagnóstico

---

### 2.7 Manutenibilidade

#### RNF-20: Código Bem Documentado
- **Descrição**: Código deve ter comentários explicativos
- **Implementação**:
  - JSDoc para funções públicas
  - Comentários em lógica complexa
  - README com instruções de setup

#### RNF-21: Versionamento
- **Descrição**: Versão do sistema em package.json e código
- **Formato**: semantic versioning (MAJOR.MINOR.PATCH)
- **Atual**: 2.0.0

#### RNF-22: Logs Estruturados
- **Descrição**: Todos os eventos importantes são registrados
- **Níveis**: INFO, WARN, ERROR
- **Informações**: timestamp, endpoint, user_id, status, tempo resposta

---

## 3. Matriz de Rastreabilidade

| RF ID | Descrição | RNF Relacionado | Prioridade | Status |
|-------|-----------|-----------------|-----------|--------|
| RF-01 | Login | RNF-04, RNF-05 | CRÍTICA | ✅ Feito |
| RF-02 | Logout | RNF-04 | CRÍTICA | ✅ Feito |
| RF-03 | Controle de Acesso | RNF-04 | CRÍTICA | ✅ Feito |
| RF-04 | Criar Usuário | RNF-05, RNF-07 | ALTA | ✅ Feito |
| RF-08 | Criar Produto | RNF-07, RNF-08 | CRÍTICA | ✅ Feito |
| RF-09 | Listar Produtos | RNF-01, RNF-02 | CRÍTICA | ✅ Feito |
| RF-13 | Criar Venda | RNF-07, RNF-12 | CRÍTICA | ✅ Feito |
| RF-14 | Listar Vendas | RNF-01, RNF-02 | CRÍTICA | ✅ Feito |
| RF-21 | Registrar Ponto | RNF-07 | ALTA | ✅ Feito |
| RF-25 | Dashboard | RNF-01 | CRÍTICA | ✅ Feito |

---

**Aprovado por:** _________________ (Professor)  
**Data:** ________________________
