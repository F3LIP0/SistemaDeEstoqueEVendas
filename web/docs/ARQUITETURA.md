# 🗂️ MODELO ENTIDADE-RELACIONAMENTO (ER) E ARQUITETURA

## 1. DIAGRAMA ER - Modelo de Dados

```
                         ┌─────────────────┐
                         │     roles       │
                         ├─────────────────┤
                         │ id (PK)         │
                         │ nome            │ (EMPLOYEE, MANAGER, ADMIN)
                         └────────┬────────┘
                                  │
                                  │ 1:N
                                  │
                    ┌─────────────▼──────────────┐
                    │        users               │
                    ├────────────────────────────┤
                    │ id (PK)                    │
                    │ email (UNIQUE)             │◄────────────┐
                    │ usuario (UNIQUE)           │             │
                    │ senha (hashed bcrypt)      │             │
                    │ nome                       │             │
                    │ role_id (FK)─┐             │             │
                    │ created_at   │             │             │
                    │ updated_at   │             │             │
                    └────────────┬─┘             │             │
                                 │               │             │
                          1:N    │               │             │
                    ┌────────────┴──┐            │             │
                    │                │            │             │
                    v                v            │             │
        ┌──────────────────┐ ┌──────────────────┤             │
        │ sales_orders     │ │ time_records     │             │
        ├──────────────────┤ ├──────────────────┤             │
        │ id (PK)          │ │ id (PK)          │             │
        │ user_id (FK)─────┼─┤ user_id (FK)─────┼─────────────┘
        │ customer_id (FK) │ │ data             │
        │ data_venda       │ │ entrada          │
        │ total            │ │ saida (NULL ok)  │
        │ lucro            │ │ horas_trabalh    │
        │ status           │ │ created_at       │
        │ created_at       │ └──────────────────┘
        └────────┬─────────┘
                 │
                 │ 1:N
                 │
        ┌────────▼─────────────────────┐
        │ sales_order_items            │
        ├──────────────────────────────┤
        │ id (PK)                      │
        │ sale_order_id (FK)           │
        │ produto_id (FK)──┐           │
        │ quantidade       │           │
        │ preco_unitario   │           │
        │ subtotal         │           │
        └──────────────────┘           │
                                       │
                ┌──────────────────────┘
                │
                v
    ┌─────────────────────────────────┐
    │      products                   │
    ├─────────────────────────────────┤
    │ id (PK)                         │
    │ sku (UNIQUE)                    │
    │ nome                            │
    │ categoria_id (FK)───┐           │
    │ marca_id (FK)       │           │
    │ unidade_id (FK)     │           │
    │ preco_custo         │           │
    │ preco_venda         │           │
    │ estoque_atual       │           │
    │ estoque_minimo      │           │
    │ estoque_maximo      │           │
    │ ativo               │           │
    │ descricao           │           │
    │ created_at          │           │
    │ updated_at          │           │
    └──────────┬──────────┘           │
               │                      │
         1:N   │                      │
    ┌──────────┘                      │
    │                                 │
    │         ┌───────────────────────┘
    │         │
    │         │ 1:N
    │         │
    │   ┌─────▼──────────────────┐
    │   │ stock_movements        │
    │   ├────────────────────────┤
    │   │ id (PK)                │
    │   │ produto_id (FK)        │
    │   │ tipo (entrada/saida)   │
    │   │ quantidade             │
    │   │ user_id (FK)           │
    │   │ motivo                 │
    │   │ created_at             │
    │   └────────────────────────┘
    │
    │ 1:N
    └──────────────────┐
                       │
    ┌──────────────────▼──┐
    │ categories          │
    ├─────────────────────┤
    │ id (PK)             │
    │ nome (UNIQUE)       │
    │ descricao           │
    │ created_at          │
    └─────────────────────┘

    ┌──────────────────┐
    │ brands           │
    ├──────────────────┤
    │ id (PK)          │
    │ nome (UNIQUE)    │
    │ descricao        │
    │ created_at       │
    └──────────────────┘

    ┌──────────────────┐
    │ units            │
    ├──────────────────┤
    │ id (PK)          │
    │ abreviacao (UN)  │
    │ nome (UNIDADE)   │
    │ created_at       │
    └──────────────────┘

    ┌──────────────────┐
    │ customers        │
    ├──────────────────┤
    │ id (PK)          │
    │ nome             │
    │ email            │
    │ telefone         │
    │ cpf_cnpj         │
    │ endereco         │
    │ cidade           │
    │ estado           │
    │ cep              │
    │ created_at       │
    └──────────────────┘

    ┌──────────────────┐
    │ activity_log     │
    ├──────────────────┤
    │ id (PK)          │
    │ user_id (FK)     │
    │ acao             │
    │ tabela           │
    │ registro_id      │
    │ descricao        │
    │ ip_address       │
    │ created_at       │
    └──────────────────┘
```

---

## 2. RELACIONAMENTOS

| Tabela 1 | Relacionamento | Tabela 2 | Tipo | Descrição |
|----------|----------------|----------|------|-----------|
| roles | 1:N | users | Um-para-Muitos | Um perfil para múltiplos usuários |
| users | 1:N | sales_orders | Um-para-Muitos | Um vendedor realiza múltiplas vendas |
| users | 1:N | time_records | Um-para-Muitos | Um funcionário tem múltiplos registros de ponto |
| sales_orders | 1:N | sales_order_items | Um-para-Muitos | Uma venda tem múltiplos itens |
| sales_order_items | N:1 | products | Muitos-para-Um | Múltiplos itens de venda referem-se a produtos |
| products | 1:N | stock_movements | Um-para-Muitos | Um produto tem múltiplos movimentos de estoque |
| categories | 1:N | products | Um-para-Muitos | Uma categoria tem múltiplos produtos |
| brands | 1:N | products | Um-para-Muitos | Uma marca tem múltiplos produtos |
| units | 1:N | products | Um-para-Muitos | Uma unidade é usada em múltiplos produtos |
| customers | 1:N | sales_orders | Um-para-Muitos | Um cliente tem múltiplas vendas |
| users | 1:N | activity_log | Um-para-Muitos | Um usuário realiza múltiplas ações |

---

## 3. ÍNDICES E PERFORMANCE

### Índices Criados

```sql
-- Chaves estrangeiras (índices automáticos)
INDEX idx_users_role_id ON users(role_id);
INDEX idx_sales_orders_user_id ON sales_orders(user_id);
INDEX idx_sales_orders_customer_id ON sales_orders(customer_id);
INDEX idx_sales_order_items_sale_order_id ON sales_order_items(sale_order_id);
INDEX idx_sales_order_items_produto_id ON sales_order_items(produto_id);
INDEX idx_time_records_user_id ON time_records(user_id);
INDEX idx_stock_movements_produto_id ON stock_movements(produto_id);
INDEX idx_stock_movements_user_id ON stock_movements(user_id);
INDEX idx_products_categoria_id ON products(categoria_id);
INDEX idx_products_marca_id ON products(marca_id);
INDEX idx_activity_log_user_id ON activity_log(user_id);

-- Busca e filtros
INDEX idx_users_email ON users(email);
INDEX idx_users_usuario ON users(usuario);
INDEX idx_products_sku ON products(sku);
INDEX idx_products_ativo ON products(ativo);
INDEX idx_sales_orders_data ON sales_orders(data_venda DESC);
INDEX idx_time_records_data ON time_records(data DESC);
INDEX idx_categories_nome ON categories(nome);
INDEX idx_brands_nome ON brands(nome);
INDEX idx_customers_email ON customers(email);
```

---

## 4. ARQUITETURA DO SISTEMA

### 4.1 Diagrama de Arquitetura (3 Camadas)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CAMADA APRESENTAÇÃO                          │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │              │  │              │  │              │              │
│  │   Sistema    │  │   Sistema    │  │   Sistema    │              │
│  │   HTML/CSS   │  │   HTML/CSS   │  │   HTML/CSS   │ ← Browser   │
│  │   JavaScript │  │   JavaScript │  │   JavaScript │              │
│  │              │  │              │  │              │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                      │
│         │                 │                 │                      │
│         └─────────────────┬─────────────────┘                      │
│                           │                                         │
│                    API_URL: /api                                    │
│                 (Relative URLs)                                     │
│                           │                                         │
│                           v                                         │
├─────────────────────────────────────────────────────────────────────┤
│                      CAMADA APLICAÇÃO                                │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Node.js + Express (Backend)                              │   │
│  │  Porta: 3000                                              │   │
│  │                                                            │   │
│  │  Rotas:                                                   │   │
│  │  ├─ POST   /api/login                                    │   │
│  │  ├─ GET/POST/PUT/DELETE /api/usuarios                    │   │
│  │  ├─ GET/POST/PUT/DELETE /api/productos                   │   │
│  │  ├─ GET/POST /api/vendas                                 │   │
│  │  ├─ GET /api/dashboard                                   │   │
│  │  ├─ POST /api/ponto/entrada                              │   │
│  │  ├─ POST /api/ponto/saida                                │   │
│  │  ├─ GET /api/movimentacoes                               │   │
│  │  └─ GET /api/health                                      │   │
│  │                                                            │   │
│  │  Middlewares:                                             │   │
│  │  ├─ CORS (preflight OPTIONS)                             │   │
│  │  ├─ autenticar() - JWT validation                        │   │
│  │  ├─ autorizar(...roles) - Role-based access             │   │
│  │  └─ error handling                                        │   │
│  │                                                            │   │
│  │  Validações:                                              │   │
│  │  ├─ Conflito de email/usuário/SKU                        │   │
│  │  ├─ Validação de relacionamentos (FK)                    │   │
│  │  ├─ Regras de negócio                                    │   │
│  │  └─ Reverão e sincronização de estoque                   │   │
│  └──────────┬──────────────────────────────────────────────┬─┘   │
│             │                                              │      │
│             │           Dual-Path Strategy                │      │
│             │                                              │      │
│       ┌─────▼──────────────┬──────────────────┴─────┐     │      │
│       │                    │                        │     │      │
│       v                    v                        │     │      │
│  ┌─────────────┐    ┌──────────────┐              │     │      │
│  │ Supabase    │    │ PostgreSQL   │              │     │      │
│  │ HTTP API    │    │ TCP Direct   │              │     │      │
│  │ (Primary)   │    │ (Fallback)   │              │     │      │
│  │             │    │              │              │     │      │
│  │ env:        │    │ env:         │              │     │      │
│  │ .SUPABASE_  │    │ .DATABASE_   │              │     │      │
│  │   URL       │    │   URL        │              │     │      │
│  │ .SERVICE_   │    │ .DATABASE_   │              │     │      │
│  │   ROLE_KEY  │    │   USER       │              │     │      │
│  │             │    │ .DATABASE_   │              │     │      │
│  │             │    │   PASSWORD   │              │     │      │
│  └─────────────┘    └──────────────┘              │     │      │
│       │                    │                      │     │      │
│       └────────┬───────────┘                      │     │      │
│                │                                  │     │      │
├────────────────┼──────────────────────────────────┼─────┤      │
│                │      CAMADA DADOS                │     │      │
│                v                                  │     │      │
│  ┌───────────────────────────────────────┐       │     │      │
│  │                                       │       │     │      │
│  │  PostgreSQL Database (Supabase Cloud)│       │     │      │
│  │                                       │       │     │      │
│  │  24 Tabelas:                          │       │     │      │
│  │  ├─ roles, users, time_records       │       │     │      │
│  │  ├─ categories, brands, units        │       │     │      │
│  │  ├─ products                          │       │     │      │
│  │  ├─ customers                         │       │     │      │
│  │  ├─ sales_orders, sales_order_items  │       │     │      │
│  │  ├─ stock_movements, activity_log    │       │     │      │
│  │  └─ e mais...                         │       │     │      │
│  │                                       │       │     │      │
│  │  3 Views, 10+ Índices, Triggers      │       │     │      │
│  │                                       │       │     │      │
│  └───────────────────────────────────────┘       │     │      │
│                                                  │     │      │
└──────────────────────────────────────────────────┴─────┘      │
```

### 4.2 Fluxo de Requisição

```
┌─ Frontend (Browser) ────────────────────────────┐
│                                                 │
│ 1. Usuário clica em "Nova Venda"               │
│                                                 │
│ 2. JavaScript faz requisição:                  │
│    POST /api/vendas                            │
│    Headers: Authorization: Bearer <JWT>        │
│    Body: {                                     │
│      cliente_id: 5,                           │
│      itens: [{                                │
│        produto_id: 10,                        │
│        quantidade: 2                          │
│      }]                                       │
│    }                                          │
│                                                 │
└─────────────┬───────────────────────────────────┘
              │
              v (HTTP POST)
┌─ Backend (Express) ────────────────────────────┐
│                                                 │
│ 3. Middleware CORS valida origem              │
│                                                 │
│ 4. Middleware autenticar() extrai JWT         │
│    - Verifica assinatura                      │
│    - Obtém user_id                            │
│                                                 │
│ 5. Middleware autorizar(['MANAGER','ADMIN'])  │
│    - Verifica se role permite                 │
│                                                 │
│ 6. Controller POST /vendas:                   │
│    a) Valida entrada:                        │
│       - cliente_id existe?                    │
│       - produtos existem?                     │
│       - tem estoque?                          │
│    b) Calcula totais:                        │
│       - subtotal por item                    │
│       - total, lucro, margem                 │
│    c) Try-catch + Dual-path:                 │
│       - Tenta Supabase HTTP API              │
│       - Se falhar, tenta PostgreSQL TCP      │
│    d) Se sucesso:                            │
│       - Retorna venda criada (201)            │
│       - Atualiza estoque automático           │
│    e) Se erro:                               │
│       - Retorna mensagem amigável (400/500)  │
│                                                 │
└─────────────┬───────────────────────────────────┘
              │
              v (HTTP 201 JSON)
┌─ Database ────────────────────────────────────┐
│                                                 │
│ 7. INSERT em sales_orders                     │
│ 8. INSERT em sales_order_items (múltiplas)    │
│ 9. UPDATE estoque em products                 │
│ 10. Triggers automáticos:                     │
│     - updated_at em products                  │
│     - Reversão se erro                        │
│                                                 │
└─────────────┬───────────────────────────────────┘
              │
              v (Dados persistidos)
┌─ Frontend (Response) ─────────────────────────┐
│                                                 │
│ 11. JavaScript recebe:                        │
│     {                                         │
│       success: true,                          │
│       id: 123,                                │
│       total: 500.00,                          │
│       message: "Venda registrada"             │
│     }                                         │
│                                                 │
│ 12. Atualiza DOM:                             │
│     - Exibe mensagem de sucesso              │
│     - Limpa formulário                        │
│     - Recarrega lista de vendas              │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 5. FLUXO DE AUTENTICAÇÃO E AUTORIZAÇÃO

```
┌─ Login ──────────────────────────────────────┐
│                                              │
│ 1. POST /api/login {email, senha}           │
│                                              │
│ 2. Backend consulta users table:            │
│    SELECT * FROM users WHERE email = ?      │
│                                              │
│ 3. Compara senha com hash bcrypt:           │
│    bcryptjs.compare(senha, usuario.senha)   │
│                                              │
│ 4. Se válido, gera JWT:                     │
│    jwt.sign({                                │
│      id: usuario.id,                        │
│      email: usuario.email,                  │
│      role_id: usuario.role_id               │
│    }, JWT_SECRET, {expiresIn: '24h'})       │
│                                              │
│ 5. Retorna token ao frontend                │
│                                              │
│ 6. Frontend armazena em localStorage        │
│                                              │
└──────────────────────────────────────────────┘

┌─ Requisição Autenticada ─────────────────────┐
│                                              │
│ 1. Frontend inclui header:                  │
│    Authorization: Bearer eyJhbGci...        │
│                                              │
│ 2. Middleware autenticar():                 │
│    - Extrai token do header                 │
│    - Verifica com jwt.verify()              │
│    - Se inválido → 401 Unauthorized         │
│    - Se válido → adiciona user ao request   │
│                                              │
│ 3. Middleware autorizar(['MANAGER','ADMIN']):
│    - Verifica request.user.role_id          │
│    - Se role não permitida → 403 Forbidden  │
│    - Se permitida → continua                │
│                                              │
│ 4. Controller pode acessar:                 │
│    - req.user.id                            │
│    - req.user.email                         │
│    - req.user.role_id                       │
│                                              │
│ 5. Executa operação com segurança           │
│                                              │
└──────────────────────────────────────────────┘

┌─ Logout ──────────────────────────────────────┐
│                                              │
│ 1. Frontend remove localStorage.token       │
│                                              │
│ 2. Redireciona para /login                  │
│                                              │
│ 3. Token pode expirar após 24h              │
│   (sem logout ativo necessário)              │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 6. SEGURANÇA - Camadas Implementadas

```
┌─────────────────────────────────────────────────────────┐
│ CAMADA 1: Autenticação                                   │
│ - JWT com assinatura HS256                             │
│ - Expiração 24h                                         │
│ - Secret armazenado em .env                            │
└─────────────────────────────────────────────────────────┘
        │
        v
┌─────────────────────────────────────────────────────────┐
│ CAMADA 2: Autorização                                    │
│ - 3 roles: EMPLOYEE, MANAGER, ADMIN                    │
│ - Controle granular por endpoint                       │
│ - Verificação em tempo de execução                     │
└─────────────────────────────────────────────────────────┘
        │
        v
┌─────────────────────────────────────────────────────────┐
│ CAMADA 3: Validação de Entrada                          │
│ - Tipo de dado (string, number, date)                  │
│ - Comprimento máx/mín                                  │
│ - Valores permitidos (enum)                            │
│ - Sanitização contra XSS                               │
└─────────────────────────────────────────────────────────┘
        │
        v
┌─────────────────────────────────────────────────────────┐
│ CAMADA 4: Segurança de BD                               │
│ - Prepared statements ($1, $2)                         │
│ - Proteção contra SQL Injection                        │
│ - Transações para integridade                          │
│ - Índices para performance                             │
└─────────────────────────────────────────────────────────┘
        │
        v
┌─────────────────────────────────────────────────────────┐
│ CAMADA 5: Criptografia                                  │
│ - Senhas com bcryptjs (10 salt rounds)                 │
│ - Envio HTTPS (production)                             │
│ - JWT assinado                                         │
└─────────────────────────────────────────────────────────┘
        │
        v
┌─────────────────────────────────────────────────────────┐
│ CAMADA 6: Auditoria                                      │
│ - Log de todas as ações                                │
│ - activity_log com user_id, ação, IP                  │
│ - Rastreamento de mudanças                             │
└─────────────────────────────────────────────────────────┘
        │
        v
┌─────────────────────────────────────────────────────────┐
│ CAMADA 7: CORS                                           │
│ - Whitelist de origens                                 │
│ - Preflight OPTIONS habilitado                         │
│ - Headers validados                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 7. MÉTRICAS E PERFORMANCE

| Operação | Tempo Alvo | Implementação |
|----------|-----------|-----------------|
| POST /login | < 500ms | Bcrypt hash comparison |
| GET /productos (100 registros) | < 200ms | Paginação + índices |
| POST /vendas | < 500ms | Transação, múltiplos inserts |
| GET /dashboard | < 300ms | Queries paralelas, caching possível |
| GET /api/health | < 50ms | Simple DB connectivity check |

---

**Diagrama Atualizado:** 15 de Janeiro de 2026  
**Aprovado por:** _________________ (Professor)
