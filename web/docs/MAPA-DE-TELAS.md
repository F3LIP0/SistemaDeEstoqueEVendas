# 🗺️ MAPA DE TELAS - NAVEGAÇÃO E INTERFACE

## 1. Estrutura de Navegação

```
┌─────────────────────────────────────────────────┐
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ 🏢 fluxa v2.0        │ │
│  │ User: João da Silva | Cargo: Gerente       │ │
│  │ [⏰] 14:32  [🔔] 2 Alertas  [👤] [🚪]      │ │
│  └─────────────────────────────────────────────┘ │
│  ┌──────────┬────────────────────────────────┐   │
│  │          │                                │   │
│  │ MENU     │  CONTEÚDO PRINCIPAL           │   │
│  │          │  (Dinâmico por página)        │   │
│  │ 📊 Dash │                                │   │
│  │ 📦 Prod │                                │   │
│  │ 💳 Vend │                                │   │
│  │ 📈 Esto │                                │   │
│  │ ⏱️  Pont │                                │   │
│  │ ⚙️  Conf │                                │   │
│  │ ℹ️  Sobr │                                │   │
│  └──────────┴────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐ │
│  │ © 2026 Empresa XYZ - v2.0.0 | Status: ✅   │ │
│  └──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 2. Detalhamento de Telas

### 2.1 TELA 01: Login

**Objetivo:** Autenticar usuário no sistema  
**Acesso:** Público (sem autenticação)  
**Responsividade:** 100% responsiva (mobile-first)

```
┌─────────────────────────────────────┐
│                                     │
│            🏢 fluxa                │
│               v2.0                 │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Email / Usuário             │   │
│  │ [_____________________]     │   │
│  │                             │   │
│  │ Senha                       │   │
│  │ [_____________________]     │   │
│  │                             │   │
│  │ □ Lembrar-me               │   │
│  │                             │   │
│  │  ┌──────────────────────┐   │   │
│  │  │ 🔐 Entrar             │   │   │
│  │  └──────────────────────┘   │   │
│  │                             │   │
│  │ Versão: 2.0.0              │   │
│  │ © 2026 - Todos os direitos │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**Elementos Interativos:**
- Campo Email/Usuário (text input)
- Campo Senha (password input)
- Checkbox "Lembrar-me"
- Botão "Entrar" (POST /api/login)

**Validações:**
- Email não vazio
- Senha mínimo 6 caracteres
- Autenticação contra BD

**Mensagens:**
- ✅ Login realizado com sucesso
- ❌ Usuário ou senha inválidos
- ⏳ Carregando...

---

### 2.2 TELA 02: Dashboard

**Objetivo:** Visão geral do negócio com KPIs  
**Acesso:** Todos autenticados  
**Permissões:** EMPLOYEE, MANAGER, ADMIN

```
┌───────────────────────────────────────────────────────┐
│ 📊 DASHBOARD - Bem-vindo, João!                      │
│ Atualizado em: 14:32 | Filtro: [🔽 Este Mês]        │
├───────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ 💰 Vendas    │  │ 📦 Estoque   │  │ 👥 Usuários│ │
│  │ R$ 15.240    │  │ 234 produtos │  │ 12         │ │
│  │ ↑ 12% vs mês │  │ 8 críticos   │  │ 2 online   │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ 📈 Lucro     │  │ 🎯 Meta      │  │ ⏱️ Ponto    │ │
│  │ R$ 3.240     │  │ 80% cumprida │  │ 24 presente│ │
│  │ Margem: 21%  │  │ R$ 20.000    │  │ 2 falta    │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
│                                                        │
│ ┌────────────────────────────────────────────────┐   │
│ │ GRÁFICO: Vendas Últimos 30 dias               │   │
│ │                                                │   │
│ │    |                                 *         │   │
│ │    |      *          *          *   * *       │   │
│ │    |  *  * *    *   * *    *   * * * * *     │   │
│ │    |_*__*_*_*__*_*_*_*_*__*___*_*_*_*_*___   │   │
│ │    1  5  10  15  20  25  30  Jan               │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ ┌──────────────────┐ ┌──────────────────────────┐   │
│ │ TOP 5 PRODUTOS   │ │ ALERTAS E NOTIFICAÇÕES   │   │
│ │ 1. Notebook      │ │ 🔴 Estoque crítico:     │   │
│ │ 2. Mouse         │ │    - Produto XYZ (0)    │   │
│ │ 3. Teclado       │ │    - Produto ABC (2)    │   │
│ │ 4. Monitor       │ │ 🟡 Última venda:        │   │
│ │ 5. Webcam        │ │    - 15/01 às 14:30     │   │
│ │ [Ver Mais]       │ │ ✅ Ponto: sem atrasos  │   │
│ │                  │ │                          │   │
│ └──────────────────┘ └──────────────────────────┘   │
│                                                        │
└───────────────────────────────────────────────────────┘
```

**Dados Exibidos (GET /api/dashboard):**
- KPIs: Vendas, Estoque, Lucro, Meta, Usuários online, Ponto
- Gráfico de vendas (Chart.js linha)
- Top 5 produtos mais vendidos
- Alertas de estoque crítico
- Últimas transações

---

### 2.3 TELA 03: Produtos

**Objetivo:** CRUD de produtos  
**Acesso:** EMPLOYEE (leitura), MANAGER+ (CRUD)

#### 3A: Listagem de Produtos

```
┌───────────────────────────────────────────────────────┐
│ 📦 PRODUTOS                                            │
│ Categoria: [Todos ▼] | Buscar: [_________] 🔍        │
│ [+ Novo Produto]  Exportar [📊]                       │
├───────────────────────────────────────────────────────┤
│                                                        │
│ SKU      │ Nome      │ Categoria │ Preço │ Estoque   │
│──────────┼───────────┼───────────┼───────┼──────────│
│ NB001    │ Notebook  │ Eletrônica│ R$2500│ 15 ✅   │
│ MS001    │ Mouse     │ Periféricos│ R$45 │ 2 🔴    │
│ KB001    │ Teclado   │ Periféricos│ R$150│ 8 ✅   │
│ MON001   │ Monitor   │ Eletrônica│ R$800│ 0 🔴    │
│ WC001    │ Webcam    │ Periféricos│ R$200│ 5 ✅   │
│                                                        │
│ [≪] 1 de 5 [>>]  │ Mostrar: 10 ▼                    │
│                                                        │
│  [Editar] [Deletar] [Ver Movimentações]              │
│                                                        │
└───────────────────────────────────────────────────────┘
```

**Colunas:**
- SKU (identificador único)
- Nome do produto
- Categoria
- Preço de venda
- Estoque atual + status (✅ OK, 🟡 BAIXO, 🔴 CRÍTICO)

**Ações:**
- Novo Produto (POST /api/productos)
- Editar (PUT /api/productos/:id)
- Deletar (DELETE /api/productos/:id)
- Buscar por nome/SKU
- Filtrar por categoria
- Paginação

#### 3B: Criar/Editar Produto

```
┌─────────────────────────────────────────────┐
│ ➕ NOVO PRODUTO                             │
├─────────────────────────────────────────────┤
│                                             │
│ SKU *                                       │
│ [_______________________]                   │
│                                             │
│ Nome do Produto *                           │
│ [_______________________]                   │
│                                             │
│ Categoria * [Eletrônica ▼]                  │
│ Marca * [Samsung ▼]                         │
│ Unidade * [Unidade ▼]                       │
│                                             │
│ Preço de Custo *          Preço de Venda *  │
│ [___________]             [___________]     │
│ R$                        R$                │
│                                             │
│ Estoque Mínimo *          Estoque Máximo *  │
│ [___________]             [___________]     │
│                                             │
│ Descrição (opcional)                        │
│ [_________________________________]         │
│ [_________________________________]         │
│                                             │
│ □ Ativo                                     │
│                                             │
│ ┌──────────────┐  ┌──────────────┐         │
│ │ ✅ Salvar    │  │ ❌ Cancelar  │         │
│ └──────────────┘  └──────────────┘         │
│                                             │
└─────────────────────────────────────────────┘
```

**Validações Inline:**
- SKU: Máximo 50 caracteres, único
- Preço venda >= preço custo
- Estoque mínimo <= estoque máximo
- Campos obrigatórios sinalizados com *

---

### 2.4 TELA 04: Vendas

**Objetivo:** Registrar e visualizar vendas  
**Acesso:** SELLER+ (MANAGER e ADMIN)

#### 4A: Nova Venda

```
┌─────────────────────────────────────────────┐
│ 💳 NOVA VENDA                               │
├─────────────────────────────────────────────┤
│                                             │
│ Cliente *                                   │
│ [Selecionar cliente ▼]                      │
│ Ou [Novo Cliente]                           │
│                                             │
│ Data da Venda                               │
│ [15/01/2026]  [Hoje]                        │
│                                             │
│ ┌─────────────────────────────────────────┐│
│ │ Produto * │ QTD * │ Preço Unit. │ Subt.││
│ ├──────────┼─────┼──────────────┼───────┤│
│ │ [▼ Prod] │ [_] │ Auto        │ R$    ││
│ │          │     │             │       ││
│ │ [▼ Prod] │ [_] │ Auto        │ R$    ││
│ │          │     │             │       ││
│ │ [+ Novo] │     │             │       ││
│ └─────────────────────────────────────────┘│
│                                             │
│                          Total: R$ 0.00    │
│                          Lucro: R$ 0.00    │
│                          Margem: 0%        │
│                                             │
│ Observações:                                │
│ [_____________________________]             │
│                                             │
│ ┌──────────────┐  ┌──────────────┐         │
│ │ ✅ Confirmar │  │ ❌ Cancelar  │         │
│ └──────────────┘  └──────────────┘         │
│                                             │
└─────────────────────────────────────────────┘
```

**Funcionalidades:**
- Seleção de cliente (dropdown)
- Adição de múltiplos itens
- Cálculo automático de subtotal
- Cálculo de total, lucro e margem
- Validação de estoque em tempo real

#### 4B: Histórico de Vendas

```
┌───────────────────────────────────────────────────────┐
│ 📊 HISTÓRICO DE VENDAS                                │
│ Data: [De ____] até [____] 🔍 | Período: [Este Mês ▼]│
├───────────────────────────────────────────────────────┤
│                                                        │
│ ID     │ Data/Hora    │ Cliente    │ Total  │ Ações  │
│────────┼──────────────┼────────────┼────────┼────────│
│ V001   │ 15/01 14:32  │ João Silva │ R$2500│ 👁️ 🗑️ │
│ V002   │ 15/01 13:45  │ Maria Santos│R$500 │ 👁️ 🗑️ │
│ V003   │ 15/01 10:20  │ Pedro Costa│ R$1500│ 👁️ 🗑️ │
│                                                        │
│ RESUMO: 3 vendas | Total: R$ 4.500 | Lucro: R$ 900   │
│                                                        │
│ [≪] Página 1 de 50 [>>]                              │
│                                                        │
└───────────────────────────────────────────────────────┘
```

---

### 2.5 TELA 05: Estoque

**Objetivo:** Controlar movimentações de estoque  
**Acesso:** MANAGER+

```
┌───────────────────────────────────────────────────────┐
│ 📈 CONTROLE DE ESTOQUE                                │
│ Filtro: [Status ▼ Crítico] | [_____] 🔍             │
├───────────────────────────────────────────────────────┤
│                                                        │
│ Produto    │ Mín. │ Máx. │ Atual │ Status  │ Ação    │
│────────────┼──────┼──────┼───────┼─────────┼─────────│
│ Notebook   │ 5    │ 20   │ 15    │ ✅ OK   │ [Mov.]  │
│ Mouse      │ 10   │ 50   │ 2     │ 🔴 CRI. │ [Mov.]  │
│ Teclado    │ 10   │ 40   │ 8     │ ✅ OK   │ [Mov.]  │
│ Monitor    │ 3    │ 15   │ 0     │ 🔴 CRI. │ [Mov.]  │
│                                                        │
│ ┌──────────────────────────────────────────────────┐  │
│ │ 🟡 ALERTAS: 2 produtos em nível crítico         │  │
│ │ - Monitor (0 un) - Comprar urgente!             │  │
│ │ - Mouse (2 un) - Comprar em breve               │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│ [+ Entrada] [+ Saída] [Exportar Relatório 📄]        │
│                                                        │
└───────────────────────────────────────────────────────┘
```

---

### 2.6 TELA 06: Ponto (Controle de Presença)

**Objetivo:** Registrar entrada/saída de funcionários  
**Acesso:** EMPLOYEE (seu próprio), MANAGER (todos)

#### 6A: Meu Ponto (EMPLOYEE)

```
┌──────────────────────────────────────────┐
│ ⏱️ MEU PONTO DE PRESENÇA                 │
│ Hoje: 15 de Janeiro de 2026             │
├──────────────────────────────────────────┤
│                                          │
│ Horário de Entrada: 08:30 ✅            │
│ Horário de Saída: --- (não saiu)        │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ [⏰ ENTRADA] [📤 SAÍDA]              │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌─ HISTÓRICO (Últimos 7 dias) ──────────┐│
│ │                                       ││
│ │ 15/01 Seg  08:30 ✅  17:45 ✅  9h15m  ││
│ │ 14/01 Dom  FOLGA                      ││
│ │ 13/01 Sab  FOLGA                      ││
│ │ 12/01 Sex  08:45 ⚠️  17:50 ✅  9h05m  ││
│ │ 11/01 Qui  08:30 ✅  17:45 ✅  9h15m  ││
│ │ 10/01 Qua  08:30 ✅  17:45 ✅  9h15m  ││
│ │ 09/01 Ter  09:00 ⚠️  17:45 ✅  8h45m  ││
│ │                                       ││
│ │ [Ver Mês Anterior] [Ver Próximo Mês]  ││
│ └─────────────────────────────────────────┘
│                                          │
│ Estatísticas (Janeiro):                 │
│ Dias trabalhados: 6                     │
│ Horas totais: 55h 30m                  │
│ Atrasos: 2 dias                         │
│ Faltas: 0 dias                          │
│                                          │
└──────────────────────────────────────────┘
```

#### 6B: Relatório de Ponto (MANAGER)

```
┌────────────────────────────────────────────────┐
│ 📋 RELATÓRIO DE PONTO                          │
│ Período: [Janeiro 2026 ▼]                     │
│ Filtro: [Todos ▼]                             │
├────────────────────────────────────────────────┤
│                                                │
│ Funcionário  │ Dias │ Horas │ Atrasos │ Faltas│
│──────────────┼──────┼───────┼─────────┼─────────│
│ João Silva   │ 20   │ 160h  │ 1       │ 0    │
│ Maria Santos │ 20   │ 160h  │ 0       │ 0    │
│ Pedro Costa  │ 19   │ 152h  │ 3       │ 1    │
│ Ana Silva    │ 20   │ 160h  │ 0       │ 0    │
│                                                │
│ [Exportar Relatório] [Imprimir]               │
│                                                │
└────────────────────────────────────────────────┘
```

---

### 2.7 TELA 07: Configurações (ADMIN)

```
┌──────────────────────────────────────────────┐
│ ⚙️ CONFIGURAÇÕES DO SISTEMA                   │
├──────────────────────────────────────────────┤
│                                              │
│ 👥 USUÁRIOS                                  │
│ [+ Novo Usuário] [Listar Usuários]          │
│ Total de usuários: 12                       │
│ - 8 Funcionários                            │
│ - 3 Gerentes                                │
│ - 1 Administrador                           │
│                                              │
│ 📦 CONFIGURAÇÃO DE PRODUTOS                  │
│ [Categorias] [Marcas] [Unidades]            │
│ Total de produtos: 234                      │
│ Ativo: 220 | Inativo: 14                   │
│                                              │
│ 🔐 SEGURANÇA                                 │
│ [Redefinir Senha]                           │
│ [Logs de Auditoria]                         │
│ [Backup do Banco]                           │
│                                              │
│ 📊 SISTEMA                                   │
│ Versão: 2.0.0                               │
│ BD: PostgreSQL (Supabase)                   │
│ Status: ✅ Operacional                      │
│ Último sincronismo: 15/01 às 14:32          │
│                                              │
└──────────────────────────────────────────────┘
```

---

### 2.8 TELA 08: Sobre (ℹ️)

```
┌──────────────────────────────────────────────┐
│ ℹ️ SOBRE O SISTEMA                            │
├──────────────────────────────────────────────┤
│                                              │
│ fluxa                 │
│ Versão: 2.0.0                               │
│ Lançado: 12 de Janeiro de 2026              │
│                                              │
│ DESCRIÇÃO                                    │
│ Sistema web integrado para gerenciamento    │
│ de estoque, vendas e ponto de funcionários  │
│ em pequenas e médias empresas.              │
│                                              │
│ TECNOLOGIAS                                  │
│ • Backend: Node.js + Express                │
│ • Banco: PostgreSQL (Supabase)              │
│ • Frontend: HTML5 + CSS3 + JavaScript       │
│ • Autenticação: JWT                         │
│                                              │
│ DESENVOLVEDOR                                │
│ F3LIP0                                      │
│ Projeto Integrador Final - 2026             │
│                                              │
│ CONTATO                                      │
│ 📧 Email: contato@empresa.com               │
│ 🔗 GitHub: github.com/F3LIP0/SistemaDE...  │
│ 📱 WhatsApp: (11) 9XXXX-XXXX                │
│                                              │
│ SUPORTE                                      │
│ [🐛 Reportar Bug] [📞 Suporte] [💡 Sugestão]│
│                                              │
│ © 2026 - Todos os direitos reservados       │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 3. Fluxos de Navegação

### 3.1 Fluxo de Autenticação

```
┌─────────┐
│ Login   │─────────────────────┐
└─────────┘                     │
    │                           │
    │ Sucesso                   │ Erro
    │                           │
    v                           v
┌──────────┐              ┌──────────────┐
│ Dashboard│              │Msg Erro      │
└──────────┘              │+ Tentar Novo │
    │                     └──────────────┘
    │
    └─────────────┬─────────────┬─────────────┐
                  │             │             │
            EMPLOYEE        MANAGER        ADMIN
```

### 3.2 Fluxo de Venda

```
┌────────────────┐
│ Nova Venda     │
└────────────────┘
    │
    v
┌──────────────────┐
│ Selecionar       │
│ Cliente          │
└──────────────────┘
    │
    v
┌──────────────────┐
│ Adicionar        │
│ Produtos e QTD   │
└──────────────────┘
    │
    v
┌──────────────────┐
│ Revisar Total    │
│ e Observações    │
└──────────────────┘
    │
    ├─── Confirmar ───┐
    │                 │
    v                 v
┌──────────────┐  ┌──────────────┐
│ Venda        │  │ Cancelada    │
│ Registrada ✅│  │ ❌           │
└──────────────┘  └──────────────┘
```

---

## 4. Paleta de Cores

| Elemento | Cor | Código |
|----------|-----|--------|
| Primária | Azul | #1976D2 |
| Secundária | Laranja | #FF9800 |
| Sucesso | Verde | #4CAF50 |
| Alerta | Amarelo | #FFC107 |
| Erro | Vermelho | #F44336 |
| Fundo | Branco | #FFFFFF |
| Texto | Cinza escuro | #333333 |
| Borda | Cinza claro | #CCCCCC |

---

## 5. Tipografia

- **Heading (H1, H2)**: 28px, Bold, Cor: Azul
- **Título de Seção (H3)**: 20px, Bold, Cor: Azul
- **Texto Normal**: 14px, Regular, Cor: Cinza escuro
- **Labels**: 12px, Bold, Cor: Cinza
- **Placeholder**: 14px, Italic, Cor: Cinza claro

---

## 6. Componentes Reutilizáveis

- **Botão Primário**: Azul, 12px padding, border-radius 4px
- **Botão Secundário**: Branco com borda azul
- **Tabela**: Header azul, linhas alternadas, hover cinza claro
- **Formulário**: Label acima, input 100% width, padding 8px
- **Card**: Borda cinza claro, padding 16px, shadow leve
- **Badge**: Status (✅ OK, 🟡 BAIXO, 🔴 CRÍTICO)

---

**Última Atualização:** 15 de Janeiro de 2026  
**Aprovado por:** _________________ (Professor)
