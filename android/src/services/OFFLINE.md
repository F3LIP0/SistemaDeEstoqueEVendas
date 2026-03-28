# Suporte Offline e Cache 📱

Sistema completo para usar o app offline com sincronização automática quando voltar online.

## Arquitetura

- **CacheManager**: Gerencia cache em memória e persistência
- **SyncQueue**: Fila de mudanças para sincronizar online
- **useOfflineData**: Hook para dados com fallback offline
- **useNetworkStatus**: Hook para detectar status de rede

## Quick Start

### Carregar Dados com Fallback Offline

```tsx
import { useOfflineData } from '@/hooks';

export function ProdutosScreen() {
  const { data: produtos, loading, error, isStale } = useOfflineData(
    'produtos:list',
    () => apiRequest('/produtos', { token }),
    { ttl: 5 * 60 * 1000 } // Cache por 5 minutos
  );

  if (loading) return <SkeletonList />;
  if (error) return <EmptyState title="Erro" message={error.message} />;

  return (
    <>
      {isStale && <Text>📴 Dados offline (podem estar desatualizados)</Text>}
      <ProdutosList items={produtos} />
    </>
  );
}
```

### Sincronizar Mudanças Quando Online

```tsx
import { syncQueue } from '@/services/cache';
import { useNetworkStatus } from '@/hooks';

export function MovimentacoesScreen() {
  const { isOnline } = useNetworkStatus();

  const handleCreateMovement = async (data) => {
    try {
      if (isOnline) {
        // Online: enviar direto
        await apiRequest('/movimentacoes', { 
          method: 'POST', 
          body: data, 
          token 
        });
      } else {
        // Offline: adicionar à fila de sync
        await syncQueue.add({
          endpoint: '/movimentacoes',
          method: 'POST',
          data,
        });
        toast.info('Salvo localmente. Será sincronizado quando online.');
      }
    } catch (err) {
      // Falhou online? Adicionar à fila
      await syncQueue.add({
        endpoint: '/movimentacoes',
        method: 'POST',
        data,
      });
      toast.warning('Será sincronizado quando online');
    }
  };

  return <MovimentacoesForm onSubmit={handleCreateMovement} />;
}
```

## API Completa

### CacheManager

```typescript
// Set cache
cacheManager.set(key, data, { 
  ttl: 5*60*1000,      // Expiração em ms
  persist: true         // Persistir em AsyncStorage
});

// Get from cache
const data = cacheManager.get(key);

// Get or fetch
const data = await cacheManager.getOrFetch(
  key,
  () => apiRequest('/endpoint', { token }),
  { ttl: 5*60*1000, persist: true }
);

// Clear
cacheManager.clear(key);      // Limpar chave específica
cacheManager.clear();          // Limpar tudo

// Offline state
cacheManager.setOffline(true);
cacheManager.isCurrentlyOffline();
```

### useOfflineData Hook

```typescript
const {
  data,          // Dados do endpoint ou cache
  loading,       // boolean - carregando?
  error,         // Error | null
  isStale,       // boolean - offline e dados expirados?
  isOffline,     // boolean - app offline?
  retry,         // () => Promise<void> - tentar novamente
} = useOfflineData(
  'unique-key',
  async () => apiRequest('/endpoint', { token }),
  {
    enabled: true,           // Executar hook?
    ttl: 5 * 60 * 1000,     // Cache TTL
    persist: true            // Persistir em AsyncStorage
  }
);
```

### useNetworkStatus Hook

```typescript
const { isOnline, setIsOnline } = useNetworkStatus();

// Usar para decidir fluxo
if (!isOnline) {
  // Mostrar modo offline
  // Adicionar à fila de sync
} else {
  // Executar online
}

// Forçar status (para testes)
setIsOnline(false);
```

### SyncQueue

```typescript
// Adicionar à fila
await syncQueue.add({
  endpoint: '/movimentacoes',
  method: 'POST',
  data: { quantity: 10, product_id: 1 }
});

// Processar fila
await syncQueue.processQueue(async (item) => {
  await apiRequest(item.endpoint, {
    method: item.method,
    body: item.data,
    token
  });
});

// Informações
const size = syncQueue.getQueueSize();

// Limpar
await syncQueue.clear();

// Carregar fila persistida
await syncQueue.loadQueue();
```

## Exemplo Prático: Tela de Vendas com Offline

```tsx
import React, { useEffect } from 'react';
import { useOfflineData, useNetworkStatus } from '@/hooks';
import { syncQueue } from '@/services/cache';
import { apiRequest } from '@/services/api';
import { useToast } from '@/components';

export function VendasCompleteScreen() {
  const { token } = useAuth();
  const toast = useToast();
  const { isOnline } = useNetworkStatus();

  // Carregar vendas com suporte offline
  const { 
    data: vendas, 
    loading, 
    error,
    isStale,
    retry 
  } = useOfflineData(
    'vendas:list',
    () => apiRequest('/vendas', { token }),
    { ttl: 3 * 60 * 1000 } // 3 minutos
  );

  // Sincronizar fila quando voltar online
  useEffect(() => {
    if (isOnline && syncQueue.getQueueSize() > 0) {
      processSyncQueue();
    }
  }, [isOnline]);

  const processSyncQueue = async () => {
    try {
      await syncQueue.processQueue(async (item) => {
        await apiRequest(item.endpoint, {
          method: item.method,
          body: item.data,
          token,
        });
      });

      toast.success(`${syncQueue.getQueueSize()} itens sincronizados`);
      retry(); // Recarregar lista
    } catch (err) {
      toast.error('Erro ao sincronizar');
    }
  };

  const handleCreateVenda = async (venda) => {
    try {
      if (isOnline) {
        // Online: enviar direto
        const result = await apiRequest('/vendas', {
          method: 'POST',
          body: venda,
          token,
        });
        
        toast.success('Venda criada com sucesso!');
        retry();
      } else {
        // Offline: adicionar à fila
        await syncQueue.add({
          endpoint: '/vendas',
          method: 'POST',
          data: venda,
        });
        
        toast.info('Venda salva localmente. Será sincronizada quando online.');
      }
    } catch (err) {
      // Falha online? Tentar adicionar à fila
      if (!isOnline) {
        await syncQueue.add({
          endpoint: '/vendas',
          method: 'POST',
          data: venda,
        });
        toast.warning('Será sincronizado quando online');
      } else {
        toast.error('Erro ao criar venda');
      }
    }
  };

  return (
    <SafeAreaView>
      {/* Indicador de status */}
      {!isOnline && (
        <View style={styles.offlineBar}>
          <Icon name="wifi-off" />
          <Text>Offline - alterações serão sincronizadas</Text>
        </View>
      )}

      {isStale && (
        <View style={styles.staleBar}>
          <Icon name="alert-circle" />
          <Text>Dados podem estar desatualizados</Text>
          <Button label="Atualizar" onPress={retry} size="sm" />
        </View>
      )}

      {/* Fila de sincronização */}
      {syncQueue.getQueueSize() > 0 && (
        <View style={styles.syncBar}>
          <ActivityIndicator />
          <Text>{syncQueue.getQueueSize()} alterações pendentes</Text>
        </View>
      )}

      {/* Conteúdo */}
      {loading && <SkeletonList />}
      {!loading && error && (
        <EmptyState 
          title="Erro" 
          message={error.message}
          actionLabel="Tentar novamente"
          onAction={retry}
        />
      )}
      {!loading && vendas && <VendasList items={vendas} />}

      {/* Form */}
      <VendasForm onSubmit={handleCreateVenda} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  offlineBar: {
    flexDirection: 'row',
    backgroundColor: '#fbbf24',
    padding: 8,
    gap: 8,
    alignItems: 'center',
  },
  staleBar: {
    flexDirection: 'row',
    backgroundColor: '#fed7aa',
    padding: 8,
    gap: 8,
    alignItems: 'center',
  },
  syncBar: {
    flexDirection: 'row',
    backgroundColor: '#bfdbfe',
    padding: 8,
    gap: 8,
    alignItems: 'center',
  },
});
```

## Boas Práticas

### ✅ Faça

- **Cache com TTL apropriado** - 5 min para dados frequentes, 30 min para estáticos
- **Sincronizar ao voltar online** - Use `useNetworkStatus` + evento
- **Indicar estado offline** - Mostre banner/ícone quando offline
- **Mostrar dados stale** - Informe ao usuário quando dados podem estar desatualizados
- **Teste o modo offline** - Simule offline para testar fluxos
- **Limpar cache antigo** - Use TTL para evitar dados obsoletos

### ❌ Evite

- **Não recarregar tudo ao online** - Só sincronize alterações
- **Não passar token na URL** - Sempre em Authorization header
- **Não confiar apenas em AsyncStorage** - Complementar com memória
- **Não ignorar sync queue** - Sempre tentar sincronizar
- **Não mostrar duas listas (online/offline)** - Mescle dados

## Debugging

### Simular Offline

```typescript
// Para testar
cacheManager.setOffline(true);

// Para voltar online
cacheManager.setOffline(false);
```

### Ver Fila de Sincronização

```typescript
// Debug na console
syncQueue.getQueueSize(); // Tamanho
```

### Limpar Tudo

```typescript
// Limpar cache
cacheManager.clear();

// Limpar fila
await syncQueue.clear();

// Limpar AsyncStorage
await AsyncStorage.clear();
```

## Próximos Passos

1. Integrar [NetInfo](https://github.com/react-native-netinfo/react-native-netinfo) para detecção real de rede
2. Adicionar cryptografia para dados sensitivos em cache
3. Implementar sincronização em background
4. Adicionar analytics para uso offline
5. Testes de benchmark de cache

## Referências

- [Offline First Manifesto](https://offlinefirst.org/)
- [React Native Performance Guide](https://reactnative.dev/docs/performance)
- [AsyncStorage Best Practices](https://react-native-async-storage.github.io/async-storage/)
