# 📱 Fluxa Mobile - Android App

Aplicativo React Native para gerenciamento de estoque, vendas e operações em tempo real com suporte completo para offline.

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Android Studio (para build native)
- Expo CLI: `npm install -g expo-cli`

### Instalação

```bash
cd android
npm install
```

### Rodando em Desenvolvimento

```bash
# Expo Go (mais rápido para desenvolvimento)
npm start

# Ou rodas direto no Android
npm run android

# Ou no iOS
npm run ios

# Web (para testes rápidos)
npm run web
```

## 📁 Estrutura do Projeto

```
android/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Icon.tsx
│   │   ├── Header.tsx
│   │   ├── Modal Dialog.tsx
│   │   ├── Skeleton.tsx
│   │   ├── EmptyState.tsx
│   │   ├── Toast.tsx
│   │   └── index.ts
│   │
│   ├── screens/             # Telas do app
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── ProdutosScreen.tsx
│   │   ├── VendasScreen.tsx
│   │   ├── MovimentacoesScreen.tsx
│   │   ├── UsuariosScreen.tsx
│   │   ├── PontoScreen.tsx
│   │   ├── CadastrosScreen.tsx
│   │   ├── ConfiguracoesScreen.tsx
│   │   └── AuditoriaScreen.tsx
│   │
│   ├── services/            # Serviços e APIs
│   │   ├── api.ts           # Cliente HTTP
│   │   ├── cache.ts         # Cache e offline
│   │   └── OFFLINE.md
│   │
│   ├── hooks/               # Custom hooks
│   │   ├── useDebouncedValue.ts
│   │   ├── useForm.ts       # Validação de formulários
│   │   ├── useAsync.ts      # Async operations
│   │   ├── useNetworkStatus.ts
│   │   └── index.ts
│   │
│   ├── context/             # Contextos globais
│   │   └── AuthContext.tsx
│   │
│   ├── navigation/          # Navegação
│   │   └── AppNavigator.tsx
│   │
│   ├── theme/               # Design tokens
│   │   └── ui.ts
│   │
│   ├── utils/               # Utilitários
│   │   ├── validators.ts
│   │   ├── FORMS.md
│   │   └── index.ts
│   │
│   ├── config/              # Configurações
│   │   ├── config.ts
│   │   ├── types.ts
│   │   └── performance.ts
│   │
│   ├── __tests__/           # Testes
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── TESTING.md
│   │
│   ├── PERFORMANCE.md       # Guia de performance
│   └── README.md
│
├── App.tsx                  # App principal
├── app.json                 # Configuração Expo
├── package.json
├── tsconfig.json
├── jest.config.js
├── jest.setup.js
└── index.ts
```

## 🎨 Design System

Todos os componentes usam tokens centralizados em `src/theme/ui.ts`:

```typescript
{
  colors: {
    primary: '#2563eb',
    secondary: '#0f766e',
    danger: '#991b1b',
    success: '#166534',
    ...
  },
  radius: {
    xs: 6, sm: 8, md: 10, lg: 12
  }
}
```

## 📚 Guias Principais

### Componentes
Ver: [Componentes Reutilizáveis](src/components/)

Componentes disponíveis:
- `Button` - Botões com variantes (primary, secondary, danger, ghost)
- `Card` - Container com styling
- `Input` - Input com validação
- `Header` - Header customizável
- `ModalDialog` - Modais com tipos (info, warning, danger, success)
- `Icon` - Sistema de ícones
- `Skeleton` - Loaders
- `EmptyState` - Estados vazios
- `Toast` - Notificações

### Formulários e Validação
Ver: [Sistema de Forms](src/utils/FORMS.md)

Usa hook `useForm` com validadores reutilizáveis:
```tsx
const { getFieldProps, validate, errors } = useForm(
  initialValues,
  {
    email: CommonRules.email,
    phone: CommonRules.phone,
    password: CommonRules.password,
  }
);
```

### Offline e Cache
Ver: [Suporte Offline](src/services/OFFLINE.md)

Use `useOfflineData` para qualquer endpoint:
```tsx
const { data, loading, error, isStale, retry } = useOfflineData(
  'unique-key',
  () => apiRequest('/endpoint', { token }),
  { ttl: 5 * 60 * 1000 }
);
```

### Performance
Ver: [Otimização de Performance](src/PERFORMANCE.md)

Práticas implementadas:
- Memoização com `React.memo`
- Debouncing em inputs
- Lazy loading de screens
- Caching automático
- Virtual scrolling

### Testes
Ver: [Testes Automatizados](src/__tests__/TESTING.md)

Rodar testes:
```bash
npm test                    # Rodar todos
npm test -- --watch        # Watch mode
npm test -- --coverage     # Com cobertura
```

## 🔗 Integração com API

Cliente HTTP pré-configurado em `src/services/api.ts`:

```typescript
import { apiRequest } from '@/services/api';

// GET
const produtos = await apiRequest('/produtos', { token });

// POST
await apiRequest('/vendas', {
  method: 'POST',
  body: { customer_id: 1, items: [...] },
  token
});

// PUT
await apiRequest(`/produtos/${id}`, {
  method: 'PUT',
  body: { name: 'novo' },
  token
});

// DELETE
await apiRequest(`/produtos/${id}`, {
  method: 'DELETE',
  token
});
```

Base URL configurada em: `src/config.ts`

## 🔐 Autenticação

Sistema JWT implementado em `src/context/AuthContext.tsx`:

```typescript
import { useAuth } from '@/context/AuthContext';

const { token, user, login, logout } = useAuth();

// Login
await login({ emailOrUsername: 'user@email.com', senha: 'pass' });

// Logout
await logout();

// User data
console.log(user.nome, user.role_name);
```

## 🎯 Funcionalidades Principais

### Dashboard
- Estatísticas do mês
- Indicadores chave
- Acesso rápido a módulos

### Produtos
- Listar produtos com busca
- Criar/editar/deletar
- Controle de estoque

### Vendas
- Criar vendas
- Múltiplos itens por venda
- Cálculo automático

### Movimentações
- Entrada/Saída/Ajuste
- Rastreamento de estoque
- Histórico completo

### Usuários
- Gerenciamento de acesso
- Roles e permissions
- Auditoria de ações

### Ponto
- Clock in/out
- Histórico de presença
- Relatórios

### Configurações
- Admin settings
- Informações da empresa
- Padrões do sistema

### Auditoria
- Log de todas as ações
- Filtros e busca
- Rastreabilidade

## 🧪 Testing

Testes com Jest + React Native Testing Library:

```bash
npm test
```

Exemplos de testes:
- Validação de hooks
- Componentes renderização
- Validadores e sanitizadores
- Integração de formulários

Ver: [Guia de Testes](src/__tests__/TESTING.md)

## 📊 Monitoramento e Debug

### Em Desenvolvimento

```bash
# Expo menu
Cmd+D (iOS) ou Ctrl+M (Android)

# Opções disponíveis:
# - Debug remote JS
# - Reload
# - Perf Monitor
```

### Performance Logger

```typescript
import { PerformanceLogger } from '@/config/performance';

PerformanceLogger.mark('operation-start');
// ... código
PerformanceLogger.measure('Operation', 'operation-start');
```

## 🚢 Build e Deploy

### Android APK

```bash
# Build APK de desenvolvimento
eas build --platform android --local

# Build APK produção
eas build --platform android --profile production
```

### Play Store

Ver: [Setup de Deploy](DEPLOYMENT.md)

## 🔧 Troubleshooting

### App não inicia
```bash
# Limpar cache
expo prebuild --clean
npm start -- --clear
```

### Testes falhando
```bash
# Limpar cache Jest
npm test -- --clearCache
```

### Performance lenta
Ver: [Guia de Performance](src/PERFORMANCE.md)

## 📦 Dependências Principais

| Pacote | Versão | Uso |
|--------|--------|-----|
| react-native | 0.81.5 | Framework base |
| react-navigation | 7.1+ | Navegação |
| expo | 54.0+ | Framework |
| @react-native-async-storage | 2.2.0 | Persistência |
| @expo/vector-icons | 14.0+ | Ícones |
| jest | 29.5+ | Testes |

Veja `package.json` para lista completa.

## 🌐 Variáveis de Ambiente

```bash
# .env
EXPO_PUBLIC_API_URL=https://seu-api.com/api
```

Ou configure em `src/config.ts`

## 📞 Suporte

Documentação detalhada para:
- [Componentes](src/components/)
- [Formulários](src/utils/FORMS.md)
- [Offline](src/services/OFFLINE.md)
- [Performance](src/PERFORMANCE.md)
- [Testes](src/__tests__/TESTING.md)

## 📄 Licença

Proprietary - Sistema de Estoque e Vendas Fluxa

---

**Desenvolvido com ❤️ em React Native**
