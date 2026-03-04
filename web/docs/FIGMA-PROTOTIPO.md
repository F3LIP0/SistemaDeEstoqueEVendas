# 🎨 PROTÓTIPO FIGMA E DESIGN SYSTEM

## 1. Links de Acesso

### Arquivos Figma Disponíveis

| Arquivo | Link | Status |
|---------|------|--------|
| **Sistema de Estoque - High Fidelity** | [Abrir no Figma](https://www.figma.com/file/seu-projeto-aqui) | 📋 Criar |
| **Design System - Components** | [Abrir no Figma](https://www.figma.com/file/seu-design-system) | 📋 Criar |
| **User Flows & Wireframes** | [Abrir no Figma](https://www.figma.com/file/seu-wireframes) | 📋 Criar |
| **Protótipo Interativo** | [Abrir no Figma](https://www.figma.com/proto/seu-proto) | 📋 Criar |

---

## 2. Passo a Passo: Criando Protótipo no Figma

### 2.1 Preparação

1. **Criar Conta Figma** (se não tiver):
   - Acesse: https://www.figma.com
   - Clique em "Sign up"
   - Use email pessoal ou corporativo

2. **Criar Novo File**:
   - Clique em "New file"
   - Nomeie: "Sistema de Estoque e Vendas v2.0"
   - Selecione Desktop

3. **Configurar Grade**:
   - View > Show grid
   - View > Show guidelines
   - Assets > Criar library para componentes

---

### 2.2 Estrutura do Projeto Figma

```
Sistema de Estoque e Vendas v2.0
│
├─ 📱 01 - Login
│  ├─ Desktop (1440px)
│  ├─ Tablet (768px)
│  └─ Mobile (375px)
│
├─ 📊 02 - Dashboard
│  ├─ Desktop
│  ├─ Tablet
│  └─ Mobile
│
├─ 📦 03 - Produtos
│  ├─ Listagem
│  ├─ Criar/Editar
│  ├─ Deletar (modal)
│  ├─ Desktop
│  ├─ Tablet
│  └─ Mobile
│
├─ 💳 04 - Vendas
│  ├─ Nova Venda
│  ├─ Histórico
│  ├─ Desktop
│  └─ Mobile
│
├─ ⏱️ 05 - Ponto
│  ├─ Meu Ponto
│  ├─ Relatório
│  └─ Desktop
│
├─ 🎨 06 - Design System
│  ├─ Colors
│  ├─ Typography
│  ├─ Buttons
│  ├─ Forms
│  ├─ Cards
│  ├─ Tables
│  ├─ Modals
│  └─ Icons
│
└─ 📐 07 - Prototypes
   ├─ Login Flow
   ├─ Venda Flow
   └─ Navigation Flow
```

---

### 2.3 Guia de Componentes

#### 2.3.1 Cores

```
Primary Blue        #1976D2
Secondary Orange    #FF9800
Success Green       #4CAF50
Warning Yellow      #FFC107
Danger Red          #F44336
Background White    #FFFFFF
Text Dark           #333333
Border Light        #CCCCCC
```

**Como aplicar no Figma:**
1. Window > Design > Colors
2. Clique em "+"
3. Cole código HEX
4. Nomee a cor (ex: "Primary Blue")
5. Marque como "Library color"

#### 2.3.2 Tipografia

```
Heading 1 (H1)
- Font: Roboto Bold
- Size: 28px
- Line Height: 32px
- Color: Primary Blue

Heading 2 (H2)
- Font: Roboto Bold
- Size: 20px
- Line Height: 24px
- Color: Primary Blue

Body Text
- Font: Roboto Regular
- Size: 14px
- Line Height: 20px
- Color: Text Dark

Label
- Font: Roboto Bold
- Size: 12px
- Line Height: 16px
- Color: Text Gray

Button Text
- Font: Roboto Medium
- Size: 14px
- Line Height: 20px
- Color: White (para botão primário)
```

**Como aplicar no Figma:**
1. Window > Design > Typography
2. Selecione texto
3. Customize font, size, weight
4. Clique no "+"
5. Nomee e salve como local style

#### 2.3.3 Componentes Principais

**Botão Primário**
- Width: 120px (variável)
- Height: 40px
- Border Radius: 4px
- Background: Primary Blue
- Text: White, Bold, 14px
- Padding: 12px 24px
- Hover: Darker blue (#1565C0)
- Active: Even darker (#0D47A1)

**Botão Secundário**
- Mesmas dimensões
- Background: Transparent
- Border: 2px Primary Blue
- Text: Primary Blue
- Hover: Light blue background

**Input Text**
- Width: 100% (container)
- Height: 40px
- Border: 1px Border Light
- Border Radius: 4px
- Padding: 10px 12px
- Font: Body Text
- Placeholder: Light gray

**Card**
- Border Radius: 8px
- Background: White
- Border: 1px Border Light
- Padding: 16px
- Shadow: 0 2px 8px rgba(0,0,0,0.1)

**Badge Status**
- Width: Auto
- Height: 24px
- Border Radius: 12px
- Padding: 4px 8px
- Font: Bold, 12px
- Cores:
  - OK: Green background, white text
  - BAIXO: Yellow background, dark text
  - CRÍTICO: Red background, white text

---

### 2.4 Exemplo: Prototipagem da Tela de Login

**Passo 1: Criar artboard**
1. Selecione "Artboard" tool
2. Clique e arraste para criar frame 1440x900
3. Nomeie "Login - Desktop"

**Passo 2: Background**
1. Selecione a artboard
2. Design > Fill > Choose color "Background White"

**Passo 3: Card de Login**
1. Rectangle tool → Crie retângulo 500x600
2. Center na artboard
3. Fill: White
4. Stroke: Border Light (1px)
5. Border Radius: 8px
6. Shadow: 0 4px 12px rgba(0,0,0,0.15)

**Passo 4: Logo e Título**
1. Text tool → Clique no card
2. Digite: "🏢 SISTEMA DE ESTOQUE E VENDAS"
3. Apply typography: Heading 1
4. Centralize no card

**Passo 5: Formulário**
1. Adicione campo "Email"
   - Label: Text "Email *" (12px Bold)
   - Input: Rectangle 100% width, 40px altura
   - Placeholder: "seu@email.com"

2. Adicione campo "Senha"
   - Label: Text "Senha *"
   - Input: Rectangle com tipo "password"

3. Adicione checkbox "Lembrar-me"

4. Adicione botão "Entrar"
   - Use componente Button Primário
   - Width: 100%

**Passo 6: Footer**
1. Text: "© 2026 - Todos os direitos reservados"
2. Align: Center, 10px from bottom

**Passo 7: Criar responsivos**
1. Duplicate artboard
2. Renomeie para "Login - Tablet"
3. Resize para 768px width
4. Adapt components
5. Repeat para Mobile (375px)

---

### 2.5 Criando Protótipo Interativo

**Passo 1: Criar múltiplas telas**
1. Crie artboards para: Login, Dashboard, Produtos
2. Organize em grid

**Passo 2: Adicionar interações**
1. Selecione botão "Entrar" na tela Login
2. Design > Prototype > Interaction
3. Trigger: On click
4. Action: Navigate to → Selecione "Dashboard"
5. Animation: Dissolve

**Passo 3: Preview**
1. Clique em ▶️ "Present" (canto superior direito)
2. Teste fluxos
3. Compartilhe link com stakeholders

---

### 2.6 Exportando Componentes para Código

**Assets do Figma → CSS/HTML**

```html
<!-- Botão Primário -->
<button class="btn btn-primary">
  Entrar
</button>

<!-- CSS -->
<style>
.btn {
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: #1976D2;
  color: white;
}

.btn-primary:hover {
  background-color: #1565C0;
}

.btn-primary:active {
  background-color: #0D47A1;
}

.btn-secondary {
  background-color: transparent;
  color: #1976D2;
  border: 2px solid #1976D2;
}

.btn-secondary:hover {
  background-color: #E3F2FD;
}
</style>
```

---

## 3. Inspeção Automática Figma

**Para desenvolvedores:**
1. Abra arquivo Figma
2. Selecione componente
3. Panel direito > Design > Inspect
4. Veja medidas, cores, fonts automáticas
5. Copie valores CSS

---

## 4. Compartilhamento e Feedbacks

### 4.1 Compartilhar Protótipo

1. Clique em "Share" (canto superior direito)
2. Gere link público
3. Configure permissões:
   - View only (recomendado para clientes)
   - Can edit (para time)
4. Copie URL e compartilhe

### 4.2 Coletando Feedback

1. Use modo comentários (Shift + C)
2. Deixe anotações no design
3. Convide stakeholders
4. Abra feedback (View > Comments)

---

## 5. Design System - Tokens

### 5.1 Spacing Scale

```
Spacing 4px
Spacing 8px (xs)
Spacing 12px (sm)
Spacing 16px (md) ← padrão
Spacing 24px (lg)
Spacing 32px (xl)
Spacing 48px (2xl)
```

### 5.2 Shadow System

```
Elevation 1: 0 2px 4px rgba(0,0,0,0.1)
Elevation 2: 0 4px 8px rgba(0,0,0,0.12)
Elevation 3: 0 8px 16px rgba(0,0,0,0.15)
Elevation 4: 0 12px 24px rgba(0,0,0,0.18)
```

### 5.3 Border Radius

```
None: 0px
Small: 2px
Medium: 4px (padrão)
Large: 8px
Circular: 50%
```

---

## 6. Checklist de Design

- [ ] Todas as telas criadas (Desktop, Tablet, Mobile)
- [ ] Colors aplicadas com variáveis Figma
- [ ] Typography aplicada com local styles
- [ ] Componentes criados como library
- [ ] Responsividade testada em 3 breakpoints
- [ ] Protótipo interativo funcionando
- [ ] Accessibility check (contraste, labels)
- [ ] Design revisado com stakeholders
- [ ] Link público compartilhado
- [ ] Versão final exportada para desenvolvedor

---

## 7. Recursos Úteis

- **Figma Help**: https://help.figma.com
- **Design System Generator**: https://www.figma.com/community
- **UI Kits Gratuitas**:
  - Material Design 3: https://www.figma.com/@materialdesign
  - Ant Design: https://www.figma.com/@ant-design
- **Plugins Recomendados**:
  - Color Contrast Checker
  - Responsive Grid System
  - Figma to HTML/CSS

---

## 8. Próximos Passos

1. **[HOJE]** Criar arquivo Figma com estrutura
2. **[DIA 2]** Design da tela de Login com responsividade
3. **[DIA 3]** Design do Dashboard com gráficos
4. **[DIA 4]** Prototipagem interativa completa
5. **[DIA 5]** Feedback e revisões
6. **[DIA 6]** Exportar assets para desenvolvimento
7. **[DIA 7]** QA visual - comparar Figma vs implementado

---

**Mentor Design:** Sua empresa ou design system externo  
**Data de Criação:** 15 de Janeiro de 2026  
**Status:** 🔄 Em progresso - Aguardando criação do arquivo Figma

### 🚀 AÇÃO IMEDIATA:
Crie um arquivo Figma em https://www.figma.com/files e comece com a estrutura acima. Compartilhe o link para aprovação antes de continuar.
