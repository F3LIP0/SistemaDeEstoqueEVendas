# Arquitetura do App Android 🏗️

Visão geral da arquitetura, padrões e decisões de design.

## Padrões Arquiteturais

### Estrutura em Camadas

```
┌─────────────────────────────────┐
│     UI / Screens / Components  │  ← Apresentação
├─────────────────────────────────┤
│     Business Logic / Hooks     │  ← Lógica
├─────────────────────────────────┤
│   Services / API / Cache       │  ← Dados
├─────────────────────────────────┤
│  React Native / Expo Platform  │  ← Platform
└─────────────────────────────────┘
```

### Fluxo de Dados

```
User Input → Component → Hook → Service → API/Cache → State → Render
```

Exemplo:
```
User clica em campo de email 
  → Input component
  → useForm hook (validação)
  → Atualiza estado do form
  → Componente renderiza com erro se inválido
```

## Padrões de Design

### 1. Container/Presentational

```tsx
// ❌ Evitar: Lógica na UI
export function ProductsScreen() {
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    apiRequest('/products', { token }).then(setProducts);
  }, []);
  
  return <FlatList data={products} />;
}

// ✅ Fazer: Separar lógica
export function ProductsScreenContainer() {
  const { data: products } = useOfflineData('products', 
    () => apiRequest('/products', { token })
  );
  
  return <ProductsScreenView products={products} />;
}

const ProductsScreenView = ({ products }) => (
  <FlatList data={products} renderItem={renderProduct} />
);
```

### 2. Composition over Inheritance

```tsx
// ❌ Herança
class BaseButton extends React.Component {}
class PrimaryButton extends BaseButton {}

// ✅ Composition
export function Button({ variant = 'primary', ...props }) {
  const styles = getVariantStyles(variant);
  return <Pressable style={styles} {...props} />;
}
```

### 3. Hooks for Stateful Logic

```tsx
// ✅ Custom hooks para lógica reutilizável
export function useProductFilter(products, query) {
  return useMemo(() => 
    products.filter(p => p.name.includes(query))
  , [products, query]);
}

// Uso em diferentes componentes
const filtered = useProductFilter(products, searchQuery);
```

## Camadas e Responsabilidades

### 1. Presentation Layer (UI)

**Arquivos:** `screens/` e `components/`

Responsabilidades:
- Renderizar UI
- Capturar input do usuário
- Exibir estados (loading, error, etc)
- Chamar funções de hooks

```tsx
export function ProdutosScreen() {
  const { data, loading, error } = useOfflineData(...);
  
  if (loading) return <SkeletonList />;
  if (error) return <EmptyState />;
  
  return <ProdutosList items={data} />;
}
```

### 2. Business Logic Layer (Hooks)

**Arquivos:** `hooks/`

Responsabilidades:
- Validação de dados
- Transformação de dados
- Gerenciamento de estado
- Orquestração de chamadas

```tsx
export function useForm(initialValues, rules) {
  const [form, setForm] = useState(...);
  
  const validate = () => {
    // Lógica de validação
    return isValid;
  };
  
  return { validate, getFieldProps, ... };
}
```

### 3. Data Layer (Services + API)

**Arquivos:** `services/` e `types.ts`

Responsabilidades:
- Requisições HTTP
- Cache de dados
- Sincronização offline
- Transformação de respostas

```typescript
export const apiRequest = async (path, options) => {
  // Requisição HTTP com erro handling
};

export const useOfflineData = (key, fetchFn) => {
  // Gerencia cache e fallback offline
};
```

### 4. Cross-Cutting Concerns

**Arquivos:** `context/`, `config/`, `utils/`

Responsabilidades:
- Autenticação (AuthContext)
- Tema/Design (ui.ts)
- Configurações (config.ts)
- Validadores (validators.ts)

```typescript
// AuthContext fornece token globalmente
const { token } = useAuth();

// UI tokens usados em todo app
const { colors, radius } = UI;

// Validadores compartilhados
const { Validators, CommonRules } = validators;
```

## Fluxo de uma Feature (Exemplo: Criar Venda)

### 1. User interage

```
Click em "Nova Venda" → VendasScreen renderiza form
```

### 2. Form valida input

```tsx
const form = useForm(
  { customer_id: '', items: [] },
  { customer_id: CommonRules.required }
);

// Submit triggered
const isValid = form.validate();
```

### 3. Lógica de negócio

```tsx
if (isValid) {
  if (isOnline) {
    // Enviar direto
    await apiRequest('/vendas', { 
      method: 'POST',
      body: form.values,
      token 
    });
  } else {
    // Adicionar à fila de sync
    await syncQueue.add({
      endpoint: '/vendas',
      method: 'POST',
      data: form.values
    });
  }
}
```

### 4. API realiza ação

```
POST /vendas → Backend processa → Retorna ordem_id
```

### 5. UI atualiza

```tsx
// Cache invalidado
cacheManager.clear('vendas:list');

// Reload data
await retry();

// Toast notifica usuário
toast.success('Venda criada com sucesso!');
```

## Estado da Aplicação

### Local Component State
```tsx
const [quantity, setQuantity] = useState(1);
```

### Form State
```tsx
const { form, values, errors } = useForm(...);
```

### Global Auth State
```tsx
const { token, user } = useAuth();
```

### Cached Data
```tsx
const { data } = useOfflineData(...);
```

### Sincronização
```tsx
const { isOnline } = useNetworkStatus();
const queueSize = syncQueue.getQueueSize();
```

## Estratégia de Erros

### Níveis de Erro

```
1. Validação (Form) → Mostrar inline
   ❌ Email inválido

2. Negócio (API) → Toast + EmptyState
   ❌ Produto não existe

3. Técnico (Network) → Offline fallback
   ❌ Sem conexão → usar cache

4. Fatal (Crash) → ErrorBoundary
   ❌ App travou → reiniciar
```

### Handling

```tsx
try {
  const data = await apiRequest('/endpoint', { token });
  setData(data);
} catch (err) {
  if (err instanceof ApiError) {
    if (err.status === 404) {
      // Não encontrado
    } else if (err.status === 401) {
      // Não autorizado
      logout();
    } else if (err.status === 500) {
      // Erro servidor
    }
  } else {
    // Erro de rede ou desconhecido
    await syncQueue.add(...); // Tentar depois
  }
}
```

## Decisões Arquiteturais

### Por que React Native + Expo?

✅ **Vantagens:**
- Code sharing entre iOS/Android
- Fast development (Expo Go)
- Rich ecosystem
- Easy over-the-air updates

### Por que Custom Hooks ao invés de Redux?

✅ **Vantagens:**
- Menos boilerplate
- Melhor colocação de estado
- Mais simples de entender

⚠️ **Quando usar Redux:**
- Estado complexo com múltiplas actions
- Time grande (> 5 devs)
- Precise time-travel debugging

### Por que AuthContext + AsyncStorage?

✅ **Vantagens:**
- Simples para app médio
- Suporta offline (persiste token)
- Sem deps externas

⚠️ **Limitações:**
- AsyncStorage não é seguro (cifrar dados sensitivos!)
- Considerar Keychain para tokens

### Por que Cache Manual?

✅ **Vantagens:**
- Total controle
- Sem deps pesadas
- Fácil debug

⚠️ **Alternativas:**
- React Query (mais complexo)
- SWR (mais simples)
- Apollo (se GraphQL)

## Directory Structure Rationalization

```
src/
├── components/      Componentes reutilizáveis (não tem lógica)
├── screens/         Telas/páginas (orquestram componentes)
├── hooks/           Custom hooks (lógica reutilizável)
├── services/        API, cache, BD (data fetching)
├── context/         Global state (auth, theme)
├── navigation/      Estrutura de navegação
├── theme/           Design tokens
├── utils/           Helpers puros (validators, formators)
├── types.ts         Tipos compartilhados
├── config.ts        Configurações
└── __tests__/       Testes
```

## Performance Considerations

### Code Splitting

```tsx
// Lazy load screens pesadas
const AuditoriaScreen = React.lazy(() => 
  import('./screens/AuditoriaScreen')
);
```

### Memoization Strategy

```tsx
// Componentes de lista
export const ProductCard = React.memo(({product}) => ...);

// Callbacks
const handlePress = useCallback((id) => {...}, [id]);

// Seletores
const products = useMemo(() => 
  items.filter(...), [items]
);
```

### Data Fetching Optimization

```
Requisições em paralelo quando possível:
Promise.all([
  apiRequest('/products', ...),
  apiRequest('/customers', ...),
  apiRequest('/sales', ...)
])

Paginação para listas grandes:
GET /products?page=1&limit=20

Caching automático:
useOfflineData(..., { ttl: 5*60*1000 })
```

## Testing Strategy

```
1. Unit Tests (Hooks, Utils)
   → Testes de lógica pura

2. Integration Tests (Screens)
   → Testes de fluxo

3. E2E Tests (Manual ou Detox)
   → Testes completos
```

## Security Considerations

### 1. Token Storage
```
❌ Armazenar em localStorage/AsyncStorage (vulnerável)
✅ Usar Keychain/Keystore + AsyncStorage + flag
```

### 2. API Communication
```
✅ HTTPS obrigatório
✅ JWT com expiração
✅ Refresh token rotation
```

### 3. Input Validation
```tsx
✅ Validar no frontend (UX)
✅ Validar no backend (segurança)
❌ Confiar apenas em frontend
```

### 4. Data Encryption
```
Para dados sensitivos:
✅ Encriptar antes de armazenar
✅ Usar RNEncryption ou similar
```

## Escalabilidade

### Quando crescer para...

**100k+ linhas de código:**
→ Considerar migração para TypeScript estruturado
→ Implementar state management (Redux/Zustand)

**5+ telas complexas:**
→ Feature-based architecture
→ Code splitting

**API calls complexas:**
→ React Query ou SWR
→ GraphQL

**50k+ usuários:**
→ Analytics/monitoring
→ Performance optimization
→ CDN para assets

## Referências

- [React Native Official Docs](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Patterns](https://reactpatterns.com/)
- [Software Architecture Patterns](https://www.oreilly.com/library/view/software-architecture-patterns/9781491971437/)
