# 🏢 Sistema de Estoque e Vendas v2.0

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue)]()
[![License](https://img.shields.io/badge/License-MIT-yellow)]()

**Sistema web completo para gerenciamento de estoque, vendas e ponto de presença em pequenas e médias empresas.**

## 🚀 Features

✅ **Gestão de Estoque** - CRUD com alertas e controle automático  
✅ **Módulo de Vendas** - Registro com cálculo de lucro e margem  
✅ **Controle de Ponto** - Entrada/saída com relatórios  
✅ **Dashboard** - KPIs em tempo real com gráficos  
✅ **Segurança** - Autenticação JWT, 3 níveis de acesso, validações rigorosas  
✅ **Responsivo** - Desktop, Tablet e Mobile  
✅ **Documentação Completa** - Briefing, Requisitos, Diagramas, Swagger  

## 📋 Documentação Completa

| Documento | Descrição |
|-----------|-----------|
| [📋 BRIEFING.md](docs/BRIEFING.md) | Escopo, objetivos, justificativa |
| [📋 REQUISITOS.md](docs/REQUISITOS.md) | RF e RNF detalhados |
| [📋 MAPA-DE-TELAS.md](docs/MAPA-DE-TELAS.md) | Wireframes de todas as telas |
| [📋 ARQUITETURA.md](docs/ARQUITETURA.md) | Diagrama ER e arquitetura |
| [📋 FIGMA-PROTOTIPO.md](docs/FIGMA-PROTOTIPO.md) | Guia de design |
| [📋 SWAGGER-API.md](docs/SWAGGER-API.md) | Documentação OpenAPI completa |
| [📋 SISTEMA-COMPLETO.md](docs/SISTEMA-COMPLETO.md) | Guia de uso e endpoints |

## 🔧 Quickstart

1. **Clone o repositório**
```bash
git clone https://github.com/F3LIP0/SistemaDeEstoqueEVendas.git
cd SistemaDeEstoqueEVendas
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o banco de dados PostgreSQL**

   a. **Crie o banco de dados:**
   ```sql
   CREATE DATABASE inventory_system;
   ```

   b. **Execute o script SQL completo** fornecido para criar todas as tabelas, views, triggers e funções.
   
   c. **Configure as variáveis de ambiente** (opcional - crie um arquivo `.env`):
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=sua_senha
   DB_NAME=inventory_system
   JWT_SECRET=seu_segredo_super_seguro
   PORT=3000
   ```

    d. **Conexão com Supabase (alternativa via HTTP ou pooler)**

    - Opção 1 — Conexão direta (quando o container permite IPv4):
       ```env
       DATABASE_URL=postgresql://postgres:SUA_SENHA@db.SEUPROJETO.supabase.co:5432/postgres?sslmode=require
       ```
    - Opção 2 — Connection Pooler do Supabase (porta 6543):
       Copie exatamente de Project Settings → Database → Connection pooling (pgbouncer)
       ```env
       # Exemplo (ajuste SEU-ID e REGIAO)
       # DATABASE_URL=postgresql://postgres.SEU-ID:SUA_SENHA@aws-0-REGIAO.pooler.supabase.com:6543/postgres
       ```
    - Opção 3 — API do Supabase via HTTP (recomendada se houver bloqueio IPv6):
       ```env
       SUPABASE_URL=https://SEUPROJETO.supabase.co
       SUPABASE_SERVICE_ROLE_KEY=SUA_CHAVE_SERVICE_ROLE
       ```

4. **Inicie o servidor**
```bash
npm start
```

Para desenvolvimento com auto-reload:
```bash
npm run dev
```

5. **Abra o sistema no navegador**
   - Backend API: `http://localhost:3000`
   - Frontend: Abra o arquivo `sistema.html` no navegador

## 🔐 Credenciais Padrão

**Administrador:**
- Username/Email: `admin` ou `admin@empresa.com`
- Senha: `admin123`

> ⚠️ **Importante:** Altere essas credenciais após o primeiro acesso!

## 📁 Estrutura do Projeto

```
SistemaDeEstoqueEVendas/
├── backend.js          # API REST em Node.js com PostgreSQL
├── sistema.html        # Interface do usuário
├── package.json        # Dependências do projeto
├── .gitignore         # Arquivos ignorados pelo Git
└── README.md          # Este arquivo
```

## 🗄️ Estrutura do Banco de Dados PostgreSQL

O sistema utiliza uma estrutura completa e profissional com:

### Tabelas Principais
- **roles** - Níveis de acesso (Employee, Manager, Admin)
- **users** - Usuários do sistema
- **time_records** - Controle de ponto
- **categories** - Categorias de produtos (com hierarquia)
- **brands** - Marcas/fabricantes
- **units** - Unidades de medida
- **products** - Catálogo de produtos
- **suppliers** - Fornecedores
- **customers** - Clientes
- **purchase_orders** - Ordens de compra
- **purchase_order_items** - Itens das ordens de compra
- **stock_entries** - Entradas de estoque
- **stock_entry_items** - Itens de entrada
- **sales_orders** - Pedidos de venda
- **sales_order_items** - Itens dos pedidos
- **stock_exits** - Saídas de estoque
- **stock_exit_items** - Itens de saída
- **stock_movements** - Histórico de movimentações (auditoria)
- **stock_adjustments** - Ajustes de estoque
- **payments** - Pagamentos recebidos
- **activity_log** - Log de atividades do sistema

### Views Úteis
- **vw_low_stock_products** - Produtos com estoque baixo
- **vw_sales_summary** - Resumo de vendas
- **vw_inventory_value** - Valor do inventário

### Triggers Automáticos
- Atualização automática de `updated_at`
- Atualização automática de estoque em entradas/saídas
- Registro automático em `stock_movements`

### Segurança
- Row Level Security (RLS) habilitado
- Senhas com hash bcrypt
- JWT para autenticação
- Audit trail completo

## 🎯 API Endpoints

### Autenticação
```
POST /api/login               - Autenticação de usuário
POST /api/usuarios            - Criar usuário (Manager/Admin - Níveis 2 e 3)
```

### Produtos
```
GET  /api/produtos            - Listar produtos (com filtros)
POST /api/produtos            - Criar produto (Manager/Admin)
```

### Vendas
```
GET  /api/vendas              - Listar vendas com paginação (Autenticado)
```

### Dashboard
```
GET  /api/dashboard/estatisticas  - Estatísticas gerais (Autenticado)
```

### Ponto
```
GET  /api/ponto               - Registros de ponto (Autenticado)
                               Employee vê apenas os próprios
```

### Movimentações
```
GET  /api/movimentacoes       - Movimentações de estoque (Manager/Admin)
```

## 🔒 Níveis de Permissão

| Funcionalidade | Employee (1) | Manager (2) | Admin (3) |
|---------------|------------|---------|-------|
| Visualizar produtos | ✅ | ✅ | ✅ |
| Criar/Editar produtos | ❌ | ✅ | ✅ |
| Visualizar vendas | ✅ | ✅ | ✅ |
| Controle de ponto próprio | ✅ | ✅ | ✅ |
| Ver ponto de outros | ❌ | ✅ | ✅ |
| Criar usuários | ❌ | ✅ | ✅ |
| Acessar movimentações | ❌ | ✅ | ✅ |
| Ajustes de estoque | ❌ | ✅ | ✅ |

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **pg (node-postgres)** - Driver PostgreSQL
- **bcryptjs** - Hash de senhas
- **jsonwebtoken** - Autenticação JWT
- **CORS** - Cross-Origin Resource Sharing

### Frontend
- **HTML5** - Estrutura
- **CSS3** - Estilização moderna
- **JavaScript (ES6+)** - Lógica do cliente
- **Chart.js** - Gráficos interativos
- **Font Awesome** - Ícones

### Banco de Dados
- **PostgreSQL** - SGBD relacional robusto
- **Triggers** - Automações no banco
- **Views** - Consultas otimizadas
- **RLS** - Segurança em nível de linha

## 🔄 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Servidor
PORT=3000
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
DB_NAME=inventory_system

# JWT
JWT_SECRET=seu_segredo_super_seguro_aqui_min_32_caracteres
```

## 📝 Diferenças da Versão Anterior (MySQL)

Esta versão foi migrada de MySQL para PostgreSQL com melhorias significativas:

### Mudanças Principais
- ✅ Migração de MySQL para PostgreSQL
- ✅ Estrutura de banco de dados profissional e escalável
- ✅ Sistema de roles hierárquico (ao invés de tipos fixos)
- ✅ Auditoria completa com `activity_log` e `stock_movements`
- ✅ Triggers automáticos para atualização de estoque
- ✅ Views otimizadas para consultas comuns
- ✅ Suporte a categorias hierárquicas
- ✅ Sistema completo de compras (fornecedores, ordens de compra)
- ✅ Controle de lotes e validades
- ✅ Múltiplos status para pedidos e pagamentos
- ✅ Row Level Security (RLS) para segurança adicional

### Campos Atualizados
| Campo Antigo (MySQL) | Campo Novo (PostgreSQL) |
|---------------------|------------------------|
| `usuarios.nome` | `users.full_name` |
| `usuarios.tipo` | `users.role_id` (referência a `roles`) |
| `produtos.codigo` | `products.sku` |
| `produtos.nome` | `products.product_name` |
| `produtos.estoque` | `products.current_stock` |
| `vendas.codigo` | `sales_orders.order_number` |
| `vendas.total` | `sales_orders.total_amount` |
| `ponto.entrada` | `time_records.clock_in` |

## 📦 Mapeamento de Tabelas

| Tabela MySQL | Tabela PostgreSQL | Observações |
|-------------|------------------|-------------|
| `usuarios` | `users` + `roles` | Separado em duas tabelas |
| `produtos` | `products` + `categories` + `brands` + `units` | Normalizado |
| `vendas` | `sales_orders` + `customers` | Com mais campos |
| `itens_venda` | `sales_order_items` | Mesma estrutura |
| `movimentacoes` | `stock_movements` | Mais completa |
| `ponto` | `time_records` | Campos renomeados |

## 📝 TODO / Melhorias Futuras

- [ ] Implementar edição de produtos no frontend
- [ ] Sistema de backup automático do PostgreSQL
- [ ] Relatórios em PDF usando pdfmake
- [ ] Gráficos dinâmicos com dados reais da API
- [ ] Sistema de notificações em tempo real (WebSockets)
- [ ] Integração com sistemas de pagamento
- [ ] App mobile com React Native
- [ ] Multi-tenancy (múltiplas empresas)
- [ ] Importação/exportação de dados (CSV/Excel)
- [ ] Sistema de permissões granulares

## 🐛 Troubleshooting

**Erro ao conectar ao banco:**
- Verifique se o PostgreSQL está rodando: `sudo service postgresql status`
- Confirme as credenciais no arquivo `.env`
- Teste a conexão: `psql -U postgres -h localhost`

**Porta 3000 em uso:**
- Altere a porta no arquivo `.env` ou `backend.js`
- Ou mate o processo: `lsof -ti:3000 | xargs kill`

**Token inválido:**
- Faça logout e login novamente
- Limpe o localStorage do navegador (F12 > Application > Local Storage)

**Tabelas não existem:**
- Execute o script SQL completo de criação do banco
- Verifique se conectou ao banco correto

**Permissões negadas:**
- Verifique o role_level do usuário (1, 2 ou 3)
- Administradores têm role_level = 3

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 👨‍💻 Autor

Desenvolvido por F3LIP0

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

---

⭐ Se este projeto foi útil, considere dar uma estrela no GitHub!