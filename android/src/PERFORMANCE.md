# Otimização de Performance 🚀

Guia de boas práticas e otimizações implementadas no app.

## Implementações Ativas

### 1. Memoização de Componentes

```tsx
import React from 'react';

// Para componentes que recebem mesmas props
export const ProductCard = React.memo(({ product, onPress }) => (
  <Pressable onPress={onPress}>
    <Text>{product.name}</Text>
  </Pressable>
), (prevProps, nextProps) => {
  // Comparação customizada
  return prevProps.product.id === nextProps.product.id;
});
```

### 2. Lazy Loading de Screens

```tsx
// Componentes pesados são carregados sob demanda
const AuditoriaScreen = lazy(() => 
  import('./screens/AuditoriaScreen')
    .then(mod => ({ default: mod.AuditoriaScreen }))
);
```

### 3. Virtual Scrolling para Listas Largas

```tsx
// Para listas com 500+ itens
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={items}
  renderItem={({ item }) => <ProductCard product={item} />}
  estimatedItemSize={100}  // Altura estimada
/>
```

### 4. Debouncing em Searches

```tsx
// useForm hook já vem com debouncing
const debouncedSearch = useDebouncedValue(query, 300);

useEffect(() => {
  // Buscar apenas após 300ms sem digitar
  search(debouncedSearch);
}, [debouncedSearch]);
```

### 5. Image Optimization

```tsx
// Sempre especifique dimensões
<Image
  source={{ uri: imageUrl }}
  style={{ width: 200, height: 200 }}
  defaultSource={require('./placeholder.png')}
/>

// Para logos/ícones, usar SVG
import { SvgUri } from 'react-native-svg';
<SvgUri width={40} height={40} uri={logoUrl} />
```

### 6. Caching API Responses

```tsx
// Já implementado em cache.ts
const { data } = useOfflineData(
  'unique-key',
  fetchFunction,
  { ttl: 5 * 60 * 1000 } // 5 minutos
);
```

## Performance Checklist

### Rendering

- [ ] Usar `React.memo()` em componentes com props estáveis
- [ ] Usar `useMemo()` para computações caras
- [ ] Usar `useCallback()` para callbacks passadas como props
- [ ] Evitar renderização de listas com `<FlatList>` (ou `<FlashList>`)
- [ ] Usar `keyExtractor` apropriadamente em listas

### State Management

- [ ] Não usar Context para dados que mudam frequentemente
- [ ] Dividir Context em múltiplos providers quando necessário
- [ ] Usar Redux/Zustand para estado global complexo

### Network

- [ ] Batching de requisições (5 num, não 50)
- [ ] Paginação para listas grandes
- [ ] Compressão de images antes de upload
- [ ] Usar HTTP/2 no backend

### Memory

- [ ] Limpar listeners em useEffect cleanup
- [ ] Não armazenar objetos grandes em Redux
- [ ] Limpar timeouts/intervals

### Bundle

- [ ] Tree shaking de dependências não usadas
- [ ] Lazy load screens sob demanda
- [ ] Remover console.log() em produção

## Medindo Performance

### React Native Profiler

```typescript
import { Performance } from 'react-native';

// Medir tempo de função
const start = Performance.now();
// ... código
const duration = Performance.now() - start;
console.log(`Operation took ${duration}ms`);
```

### Usar React DevTools

```bash
# Em desenvolvimento
npm start
# Depois no Flipper ou Chrome DevTools
```

## Otimizações Específicas Implementadas

### 1. Input Validation com Debouncing

```tsx
const debouncedSearch = useDebouncedValue(searchQuery, 250);

const filteredItems = useMemo(() => {
  return items.filter(item =>
    item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );
}, [items, debouncedSearch]);
```

### 2. Lazy Loading de Tab Screens

```tsx
// Screens não são carregados até serem acessados
<Tab.Screen 
  name="Auditoria" 
  component={AuditoriaScreen}
  listeners={({ navigation }) => ({
    tabPress: () => {
      // Lazy load se necessário
    }
  })}
/>
```

### 3. Cache de Imagens

```tsx
// FastImage com cache automático
import FastImage from 'react-native-fast-image';

<FastImage
  source={{ uri: productImage, priority: FastImage.priority.normal }}
  style={{ width: 200, height: 200 }}
/>
```

## Boas Práticas por Tipo de Componente

### Screens (Telas)

```tsx
export const ProductsScreen = React.memo(() => {
  const [items, setItems] = useState([]);
  
  // Usar useCallback para callbacks estáveis
  const handlePress = useCallback((id) => {
    navigation.navigate('ProductDetail', { id });
  }, [navigation]);

  return (
    <FlatList
      data={items}
      renderItem={({ item }) => (
        <ProductCard 
          product={item} 
          onPress={() => handlePress(item.id)}
        />
      )}
      keyExtractor={item => item.id.toString()}
      removeClippedSubviews={true}  // Otimização para listas
      maxToRenderPerBatch={10}       // Renderizar em lotes
      updateCellsBatchingPeriod={50}
    />
  );
});
```

### Forms

```tsx
export const ProductForm = React.memo(({ onSubmit }) => {
  const { getFieldProps, validate } = useForm(
    initialValues,
    validationRules
  );

  // Memoizar validação
  const handleSubmit = useCallback(() => {
    if (validate()) {
      onSubmit(values);
    }
  }, [validate, values, onSubmit]);

  return (
    // Form JSX
  );
});
```

### Lists com Muitos Itens

```tsx
import { FlashList } from '@shopify/flash-list';

export const LargeList = ({ items }) => {
  return (
    <FlashList
      data={items}
      renderItem={({ item }) => <ListItem item={item} />}
      estimatedItemSize={80}
      numColumns={2}  // Se grid
      onEndReachedThreshold={0.5}  // Carregar mais com 50% do fim
      onEndReached={loadMore}
    />
  );
};
```

## Análise de Performance

### Ferramentas

1. **React Native Performance Monitor**
   ```bash
   # No app em desenvolvimento
   Cmd+D (iOS) ou Ctrl+M (Android)
   > Perf Monitor
   ```

2. **Flipper**
   ```bash
   npm install flipper
   # Conectar ao Android/iOS
   ```

3. **Bundle Size Analysis**
   ```bash
   npm run build -- --analyze
   ```

### Métricas Alvo

- **Time to Interactive (TTI)**: < 2s
- **Frame rate**: 60 FPS (ou 120 em ProMotion)
- **Input latency**: < 100ms
- **Bundle size**: < 5MB

## Troubleshooting de Performance

### App lento ao iniciar

```typescript
// Lazy load contextos pesados
const HeavyContext = React.lazy(() => import('./contexts/Heavy'));

// Ou carregar em background
useEffect(() => {
  setTimeout(() => {
    // Carregar dados pesados
  }, 2000);
}, []);
```

### Listas lentas

```typescript
// Usar FlashList ao invés de FlatList
// Implementar virtualization
<FlashList
  data={items}
  renderItem={renderItem}
  estimatedItemSize={100}
/>
```

### Memória alta

```typescript
// Limpar listeners
useEffect(() => {
  return () => {
    // Cleanup
  };
}, []);

// Não armazenar objetos grandes globalmente
// Usar selectores no Redux
```

### Tela congelada

```typescript
// Usar InteractionManager para tarefas pesadas
import { InteractionManager } from 'react-native';

useEffect(() => {
  const task = InteractionManager.runAfterInteractions(() => {
    // Processamento pesado
  });

  return () => task.cancel();
}, []);
```

## Performance em Produção

### Otimizações de Build

```json
// app.json
{
  "expo": {
    "plugins": [
      ["expo-build-properties", {
        "android": { "enableProguardInReleaseBuilds": true }
      }]
    ]
  }
}
```

### Monitoria

```typescript
// Implementar analytics
import { analytics } from '@/services/analytics';

analytics.trackScreenView('ProductScreen');
analytics.trackEvent('product_viewed', { productId: 123 });
```

## Referências

- [React Native Performance](https://reactnative.dev/docs/performance)
- [Flipper Screenshots](https://fbflipper.com/)
- [FlashList Documentation](https://shopify.github.io/flash-list/)
