# Sistema de Ícones 🎨

O app utiliza um sistema de ícones integrado com suporte a múltiplas bibliotecas.

## Uso Básico

```tsx
import { Icon, Icons } from '@/components';

// Usando preset
<Icon name={Icons.home} size="md" />

// Usando nome direto
<Icon name="home" library="ionicons" size="lg" color="blue" />
```

## Bibliotecas Disponíveis

- **ionicons** (padrão): Ícones Ionicons - melhor cobertura geral
- **material**: Material Design icons - específico para material design
- **fontawesome**: FontAwesome 5 - muitos ícones

## Tamanhos

- `xs` → 16px
- `sm` → 20px
- `md` → 24px (padrão)
- `lg` → 32px
- `xl` → 48px

## Presets Disponíveis

### Navegação
- `home` - Tela inicial
- `back` - Voltar
- `close` - Fechar
- `menu` - Menu

### Ações
- `add` - Adicionar
- `edit` - Editar (lápis)
- `delete` - Deletar
- `search` - Buscar
- `filter` - Filtrar
- `settings` - Configurações
- `refresh` - Atualizar

### Status
- `check` - Sucesso/Marcado
- `error` - Erro
- `warning` - Aviso
- `info` - Informação

### Comuns
- `user` - Usuário único
- `users` - Múltiplos usuários
- `lock` - Bloqueado
- `unlock` - Desbloqueado
- `eye` - Visível
- `eyeOff` - Oculto
- `calendar` - Calendário
- `clock` - Hora
- `phone` - Telefone
- `email` - Email

### Negócio
- `products` - Produtos
- `sales` - Vendas
- `inventory` - Estoque
- `analytics` - Análises

## Exemplos de Uso

```tsx
// Em Buttons
<Button label="+ Novo" icon={<Icon name={Icons.add} size="sm" color="white" />} />

// Com cores customizadas
<Icon name={Icons.delete} size="lg" color={UI.colors.danger} />

// Em Headers
<Header title="Produtos" rightComponent={<Icon name={Icons.filter} />} />

// Com outras bibliotecas
<Icon name="star" library="material" size="lg" />
```

## Adicionando Novos Presets

Edite `icons.ts` e adicione à constante `Icons`:

```typescript
export const Icons = {
  // existing...
  meuIcon: 'nome-do-icon',
} as const;
```

## Encontrando Nomes de Ícones

Visite:
- Ionicons: https://ionic.io/ionicons/
- Material: https://fonts.google.com/icons
- FontAwesome: https://fontawesome.com/icons
