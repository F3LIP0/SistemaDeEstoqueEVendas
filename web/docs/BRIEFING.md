# 📋 BRIEFING - fluxa

## 1. Identificação do Projeto

**Nome do Projeto:** Sistema de Gestão de Estoque e Vendas  
**Versão:** 2.0  
**Data de Criação:** 10 de Janeiro de 2026  
**Aluno/Grupo:** F3LIP0  
**Scrum Master:** Professor

---

## 2. Descrição Geral

Sistema web completo para gerenciamento de estoque, vendas e controle de ponto em pequenas e médias empresas. Permite cadastro de produtos, registro de vendas, monitoramento de estoque em tempo real, gestão de usuários com diferentes níveis de acesso e controle de presença de funcionários.

---

## 3. Problema a Resolver

- **Falta de controle centralizado** de estoque (dispersão de informações em planilhas)
- **Dificuldade em rastrear** histórico de vendas
- **Perda de produtos** por falta de alertas de estoque baixo
- **Impossibilidade de análise** de dados de vendas e lucro
- **Controle manual** de ponto de funcionários (propenso a erros)
- **Falta de autenticação** e segurança nos dados

---

## 4. Público-Alvo

- **Empresas**: Pequenas e médias (10-100 funcionários)
- **Setores**: Varejo, distribuição, e-commerce
- **Usuários diretos**:
  - Gerentes/Donos (visão estratégica via dashboard)
  - Vendedores (registro de vendas)
  - Funcionários (controle de ponto)
  - Administradores (gestão geral)

---

## 5. Objetivos

### Objetivos Principais
1. **Centralizar dados** de estoque, vendas e pessoal em um único sistema
2. **Automatizar processos** de registro de vendas e controle de ponto
3. **Permitir análises** em tempo real com dashboard inteligente
4. **Garantir segurança** com autenticação JWT e controle de acesso por perfil
5. **Melhorar eficiência** operacional reduzindo erros manuais

### Objetivos Secundários
1. Gerar relatórios de vendas e estoque
2. Enviar alertas de estoque baixo
3. Calcular lucro estimado
4. Manter histórico auditável de operações

---

## 6. Diferenciais da Solução

- ✅ **Interface intuitiva** sem curva de aprendizado acentuada
- ✅ **Responsiva** - funciona em desktop, tablet e celular
- ✅ **Segura** - autenticação JWT com 3 níveis de acesso
- ✅ **Rápida** - API otimizada com Supabase
- ✅ **Escalável** - arquitetura preparada para crescimento
- ✅ **Confiável** - validações rigorosas e backup em banco de dados gerenciado
- ✅ **Moderna** - stack tecnológico atualizado (Node.js, PostgreSQL, HTML5)

---

## 7. Justificativa

Sistema ERP simples é uma necessidade em empresas de pequeno/médio porte que crescem rapidamente. Ferramentas como SAP são caras e complexas. Este projeto oferece uma alternativa **simples, acessível e funcional** para gestão básica de negócio, cumprindo obrigações legais (controle de ponto) e operacionais (inventário).

---

## 8. Tecnologias Utilizadas

### Back-end
- **Node.js** 16+ (runtime JavaScript)
- **Express.js** (framework web)
- **PostgreSQL** (banco de dados)
- **Supabase** (BaaS - Backend as a Service)
- **JWT** (autenticação)
- **bcryptjs** (hashing de senhas)

### Front-end
- **HTML5** (estrutura)
- **CSS3** (estilo responsivo)
- **JavaScript ES6+** (interatividade)
- **Chart.js** (gráficos)
- **Font Awesome** (ícones)

### Infraestrutura
- **GitHub** (versionamento e CI/CD)
- **Codespaces** (ambiente de desenvolvimento)
- **Supabase Cloud** (banco de dados gerenciado)

---

## 9. Escopo do Projeto

### Incluso ✅
- Sistema de login com 3 níveis (Employee, Manager, Admin)
- CRUD de produtos (criar, ler, atualizar, deletar)
- CRUD de vendas
- CRUD de usuários
- Dashboard com estatísticas
- Controle de ponto
- Movimentações de estoque
- Validações de dados
- API REST documentada
- Interface web responsiva

### Excluído ❌
- Aplicativo mobile (versão 3.0)
- E-mail automático de alertas
- Integração com sistemas externos
- Relatórios em PDF (versão 3.0)
- Suporte multi-idioma

---

## 10. Cronograma

| Fase | Tarefa | Data Prevista |
|------|--------|----------------|
| Planejamento | Requisitos + Documentação | 08/12/2025 |
| Design | Protótipo Figma + Diagramas | 15/12/2025 |
| Dev Backend | API + BD + Autenticação | 22/12/2025 |
| Dev Frontend | Interface + Integração API | 29/12/2025 |
| Testes | Testes manuais + Automação | 05/01/2026 |
| Entrega Final | Documentação + Apresentação | 12/01/2026 |

---

## 11. Sucesso do Projeto

Projeto será considerado **bem-sucedido** quando:
- ✅ Todos os 8 endpoints funcionam corretamente
- ✅ Login funciona para os 3 perfis
- ✅ Dashboard carrega em menos de 2 segundos
- ✅ Interface é 100% responsiva
- ✅ Banco de dados tem 24 tabelas estruturadas
- ✅ 0 erros em produção após 1h de teste
- ✅ Documentação completa e atualizada
- ✅ Apresentação clara do sistema funcionando

---

## 12. Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Falha em conectar ao Supabase | Média | Alto | Implementar fallback PostgreSQL TCP |
| Performance lenta em listagens | Baixa | Médio | Usar paginação + índices no BD |
| Bug crítico descoberto tarde | Média | Alto | Testes automatizados + revisão PR |
| Scope creep (tarefas extras) | Alta | Médio | Manter backlog fechado até MVP |

---

## 13. Métricas de Sucesso

- **Disponibilidade**: 99%+ uptime
- **Performance**: API responde em <200ms (p95)
- **Segurança**: 0 vulnerabilidades conhecidas
- **Usabilidade**: Interface intuitiva (sem treinamento)
- **Confiabilidade**: 100% das operações CRUD funcionando
- **Cobertura**: Testes manuais 100% + testes automatizados 70%+

---

**Aprovado por:** _________________ (Professor)  
**Data:** ________________________  
**Assinatura:** _________________ 
