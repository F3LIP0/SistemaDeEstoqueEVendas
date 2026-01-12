# ✅ SISTEMA DE ESTOQUE E VENDAS - DOCUMENTAÇÃO COMPLETA v2.0

## 🎯 STATUS DO PROJETO

**Status Geral:** ✅ **COMPLETO PARA WEB**

- ✅ Backend funcional com todos os endpoints CRUD
- ✅ Frontend totalmente responsivo
- ✅ Documentação formal completa
- ✅ Banco de dados PostgreSQL estruturado
- ✅ Autenticação JWT implementada
- ⏳ Mobile: Planejado para v3.0

---

## 📋 ÍNDICE

1. [Visão Geral](#1-visão-geral)
2. [Tecnologias](#2-tecnologias)
3. [Instalação](#3-instalação)
4. [Endpoints da API](#4-endpoints-da-api)
5. [Documentação Formal](#5-documentação-formal)
6. [Testes](#6-testes)
7. [Deploy](#7-deploy)
8. [Roadmap](#8-roadmap)

---

## 1. Visão Geral

Sistema web completo para gerenciamento de:
- **Estoque**: CRUD de produtos com controle de níveis
- **Vendas**: Registro, consulta e análise de vendas
- **Usuários**: Gestão de equipe com 3 níveis de acesso
- **Ponto**: Controle de presença de funcionários
- **Dashboard**: KPIs e estatísticas em tempo real

**Versão**: 2.0.0  
**Data**: 15 de Janeiro de 2026  
**Desenvolvedor**: F3LIP0  

---

## 2. Tecnologias

### Backend
- **Node.js** 16+
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados
- **Supabase** - BaaS (HTTP API)
- **JWT** - Autenticação
- **bcryptjs** - Hashing de senhas

### Frontend
- **HTML5** - Estrutura
- **CSS3** - Estilo responsivo
- **JavaScript ES6+** - Interatividade
- **Chart.js** - Gráficos
- **Font Awesome** - Ícones

### Infraestrutura
- **GitHub** - Versionamento
- **Supabase Cloud** - BD gerenciado
- **Codespaces/Local** - Desenvolvimento

---

## 3. Instalação

### 3.1 Pré-requisitos
- Node.js 16+ instalado
- npm ou yarn
- Git
- Conta Supabase

### 3.2 Clonar Repositório

```bash
git clone https://github.com/F3LIP0/SistemaDeEstoqueEVendas.git
cd SistemaDeEstoqueEVendas
```

### 3.3 Instalar Dependências

```bash
npm install
```

### 3.4 Configurar Variáveis de Ambiente

Crie arquivo `.env`:

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-secreta

# PostgreSQL (fallback)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Aplicação
PORT=3000
NODE_ENV=development
JWT_SECRET=seu-segredo-jwt-muito-seguro
```

### 3.5 Criar Banco de Dados

```bash
# Execute o schema no Supabase SQL Editor
psql -U postgres -d seu_db -f schema-supabase.sql

# Ou via Supabase Dashboard:
# 1. SQL Editor → New Query
# 2. Cole conteúdo de schema-supabase.sql
# 3. Execute
```

### 3.6 Criar Usuário Admin

```bash
npm run create-admin
```

**Credenciais padrão:**
- Email: `admin@empresa.com`
- Senha: `admin123`

### 3.7 Iniciar Servidor

```bash
npm start
```

**Saída esperada:**
```
🚀 ========================================
   Servidor rodando em http://localhost:3000
   ========================================

📌 Endpoints disponíveis:
   POST   /api/login                    - Autenticação
   POST   /api/usuarios                 - Criar usuário (Admin)
   GET    /api/usuarios                 - Listar usuários (Manager/Admin)
   PUT    /api/usuarios/:id             - Atualizar usuário (Admin)
   DELETE /api/usuarios/:id             - Deletar usuário (Admin)
   GET    /api/productos                - Listar produtos (Todos)
   POST   /api/productos                - Criar produto (Manager/Admin)
   PUT    /api/productos/:id            - Atualizar produto (Manager/Admin)
   DELETE /api/productos/:id            - Deletar produto (Admin)
   GET    /api/vendas                   - Listar vendas (Autenticado)
   GET    /api/dashboard/estatisticas   - Estatísticas (Autenticado)
   GET    /api/ponto                    - Controle de ponto (Autenticado)
   GET    /api/movimentacoes            - Movimentações (Manager/Admin)
   GET    /api/health                   - Status do servidor
```

### 3.8 Acessar Sistema

Abra browser: http://localhost:3000

---

## 4. Endpoints da API

### 4.1 Autenticação

#### POST /api/login
Realiza login e retorna JWT token (24h validade)

**Request:**
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empresa.com",
    "senha": "admin123"
  }'
```

**Response (200):**
```json
{
  "sucesso": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "email": "admin@empresa.com",
    "nome": "Administrador",
    "role_id": 3
  }
}
```

---

### 4.2 Usuários (CRUD Completo)

#### POST /api/usuarios
Criar novo usuário (Admin)

**Request:**
```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "joao_silva",
    "email": "joao@empresa.com",
    "senha": "123456",
    "full_name": "João Silva",
    "role_name": "MANAGER"
  }'
```

#### GET /api/usuarios
Listar usuários com paginação (Manager/Admin)

```bash
curl -X GET "http://localhost:3000/api/usuarios?page=1&limit=10" \
  -H "Authorization: Bearer TOKEN"
```

#### PUT /api/usuarios/:id
Atualizar usuário (Admin)

```bash
curl -X PUT http://localhost:3000/api/usuarios/2 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "João Silva Atualizado",
    "role_name": "EMPLOYEE"
  }'
```

#### DELETE /api/usuarios/:id
Deletar usuário (Admin)

```bash
curl -X DELETE http://localhost:3000/api/usuarios/2 \
  -H "Authorization: Bearer TOKEN"
```

**Proteção:** Não permite deletar o último admin

---

### 4.3 Produtos (CRUD Completo)

#### GET /api/productos
Listar produtos (Todos)

```bash
curl -X GET "http://localhost:3000/api/productos?page=1&limit=10" \
  -H "Authorization: Bearer TOKEN"
```

#### POST /api/productos
Criar produto (Manager/Admin)

```bash
curl -X POST http://localhost:3000/api/productos \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "NB001",
    "product_name": "Notebook Dell",
    "category_id": 1,
    "brand_id": 2,
    "unit_id": 1,
    "cost_price": 1500.00,
    "selling_price": 2500.00,
    "minimum_stock": 5,
    "maximum_stock": 50
  }'
```

**Validações:**
- SKU deve ser único
- Preço venda >= preço custo
- Estoque mín <= estoque máx

#### PUT /api/productos/:id
Atualizar produto (Manager/Admin)

```bash
curl -X PUT http://localhost:3000/api/productos/10 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Notebook Dell Atualizado",
    "selling_price": 2600.00,
    "current_stock": 12
  }'
```

#### DELETE /api/productos/:id
Deletar produto (Admin) - Soft delete

```bash
curl -X DELETE http://localhost:3000/api/productos/10 \
  -H "Authorization: Bearer TOKEN"
```

---

### 4.4 Vendas

#### GET /api/vendas
Listar vendas com paginação

```bash
curl -X GET "http://localhost:3000/api/vendas?limit=10&offset=0" \
  -H "Authorization: Bearer TOKEN"
```

**Resposta:**
```json
{
  "sucesso": true,
  "total": 45,
  "vendas": [
    {
      "order_id": 1,
      "order_date": "2026-01-15",
      "total_amount": 5000.00,
      "customer_id": 5,
      "status": "completed"
    }
  ]
}
```

---

### 4.5 Dashboard

#### GET /api/dashboard/estatisticas
Obter KPIs e estatísticas

```bash
curl -X GET http://localhost:3000/api/dashboard/estatisticas \
  -H "Authorization: Bearer TOKEN"
```

**Resposta:**
```json
{
  "sucesso": true,
  "total_vendas_mes": 45,
  "receita_mes": 125000.00,
  "lucro_estimado": 25000.00,
  "produtos_criticos": 3,
  "usuarios_online": 4
}
```

---

### 4.6 Controle de Ponto

#### GET /api/ponto
Consultar ponto (Autenticado)

```bash
curl -X GET "http://localhost:3000/api/ponto?mes=01&ano=2026" \
  -H "Authorization: Bearer TOKEN"
```

---

### 4.7 Movimentações de Estoque

#### GET /api/movimentacoes
Listar movimentações (Manager/Admin)

```bash
curl -X GET "http://localhost:3000/api/movimentacoes?tipo=IN&limit=50" \
  -H "Authorization: Bearer TOKEN"
```

---

### 4.8 Health Check

#### GET /api/health
Status do servidor

```bash
curl http://localhost:3000/api/health
```

**Resposta:**
```json
{
  "ok": true,
  "message": "Backend online",
  "timestamp": "2026-01-15T14:32:00.000Z"
}
```

---

## 5. Documentação Formal

A documentação completa está em `docs/`:

1. **[BRIEFING.md](docs/BRIEFING.md)** - Escopo, objetivos, justificativa
2. **[REQUISITOS.md](docs/REQUISITOS.md)** - RF e RNF detalhados
3. **[MAPA-DE-TELAS.md](docs/MAPA-DE-TELAS.md)** - Wireframes de todas as telas
4. **[ARQUITETURA.md](docs/ARQUITETURA.md)** - Diagrama ER e arquitetura
5. **[FIGMA-PROTOTIPO.md](docs/FIGMA-PROTOTIPO.md)** - Guia de design
6. **[SWAGGER-API.md](docs/SWAGGER-API.md)** - Documentação OpenAPI

---

## 6. Testes

### 6.1 Teste Manual com Curl

**Login:**
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.com","senha":"admin123"}'
```

**Guardar token:**
```bash
export TOKEN="seu_token_aqui"
```

**Listar produtos:**
```bash
curl -X GET http://localhost:3000/api/productos \
  -H "Authorization: Bearer $TOKEN"
```

### 6.2 Teste com Postman

1. Abra Postman
2. File → Import → Selecione `docs/openapi.yaml`
3. Configure variáveis:
   - `base_url`: http://localhost:3000/api
   - `token`: (será preenchido após login)
4. Execute requisições

### 6.3 Teste Automático

```bash
npm test
```

---

## 7. Deploy

### 7.1 Deploy no Railway

```bash
# 1. Criar conta em railway.app
# 2. Conectar repositório GitHub
# 3. Configurar variáveis de ambiente
# 4. Railway faz deploy automático
```

### 7.2 Deploy no Render

```bash
# 1. Conectar repositório
# 2. Usar Dockerfile incluído
# 3. Configurar .env
```

---

## 8. Roadmap

### v2.0 ✅ (Completo - Jan 2026)
- [x] API REST completa
- [x] Frontend responsivo
- [x] Autenticação JWT
- [x] CRUD produtos/usuários/vendas
- [x] Dashboard com gráficos
- [x] Documentação formal

### v2.1 🔄 (Próximo)
- [ ] Endpoints PUT/PATCH/DELETE melhorados
- [ ] Testes automatizados (Jest/Cypress)
- [ ] Paginação avançada
- [ ] Filtros e buscas otimizadas
- [ ] Performance e caching

### v3.0 🚀 (Planejado)
- [ ] **Aplicativo Mobile** (React Native ou Flutter)
- [ ] Relatórios em PDF
- [ ] Alertas por email
- [ ] Integração com sistemas de pagamento
- [ ] Multi-tenant (múltiplas empresas)
- [ ] Análise de dados com IA

---

## 📞 Suporte

- **Email**: api-support@empresa.com
- **GitHub Issues**: [Link do repositório]
- **Documentação**: [docs/](docs/)

---

## 📄 Licença

MIT License - Veja LICENSE.md para detalhes

---

**Atualizado:** 15 de Janeiro de 2026  
**Versão:** 2.0.0  
**Status**: ✅ Pronto para Produção (Web)
