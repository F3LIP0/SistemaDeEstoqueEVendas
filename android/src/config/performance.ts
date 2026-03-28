/**
 * Configurações de performance do React Native
 * Aplique estas settings no seu App.tsx ou configuração global
 */

import React, { useEffect } from 'react';
import { LogBox } from 'react-native';

// Desabilitar warnings não críticos em produção
if (__DEV__) {
  // Warnings em desenvolvimento
  LogBox.ignoreLogs([
    'ViewPropTypes will be removed',
    'Non-serializable values',
  ]);
} else {
  // Silenciar tudo em produção
  LogBox.ignoreAllLogs(true);
}

/**
 * Configurações de Rendering
 */
export const RenderingConfig = {
  // Desabilitar YellowBox em produção
  disableYellowBox: !__DEV__,

  // Habilitar hermes engine (mais rápido)
  useHermesEngine: true,

  // Otimizações de lista
  flatListOptimizations: {
    removeClippedSubviews: true,
    maxToRenderPerBatch: 10,
    updateCellsBatchingPeriod: 50,
    initialNumToRender: 10,
  },
};

/**
 * Configurações de Memória
 */
export const MemoryConfig = {
  // Limpar cache periodicamente
  clearCacheInterval: 30 * 60 * 1000, // 30 minutos

  // Limite de tamanho de cache
  maxCacheSize: 50 * 1024 * 1024, // 50MB

  // Garbage collection agressivo
  enableAggressiveGC: !__DEV__,
};

/**
 * Configurações de Network
 */
export const NetworkConfig = {
  // Timeout de requisições
  requestTimeout: 15000,

  // Conexão persistente
  keepAlive: true,

  // Pool de conexões
  maxConnections: 6,

  // Batch requisições
  batchSize: 5,

  // Retry policy
  maxRetries: 3,
  retryDelay: 1000,
};

/**
 * Hook para aplicar otimizações globais
 */
export function useGlobalPerformanceOptimizations() {
  useEffect(() => {
    // Limpar cache periodicamente
    const cacheTimer = setInterval(() => {
      // Implementar limpeza
      console.log('[Performance] Clearing old cache');
    }, MemoryConfig.clearCacheInterval);

    // Habilitar fast refresh em desenvolvimento
    if (__DEV__ && (global as any).HMRClient) {
      console.log('[Performance] Fast Refresh enabled');
    }

    return () => {
      clearInterval(cacheTimer);
    };
  }, []);
}

/**
 * Logging de performance
 */
export class PerformanceLogger {
  private static marks = new Map<string, number>();

  static mark(name: string) {
    this.marks.set(name, performance.now());
  }

  static measure(name: string, startMark: string) {
    const startTime = this.marks.get(startMark);
    if (!startTime) {
      console.warn(`[Performance] Mark "${startMark}" not found`);
      return;
    }

    const duration = performance.now() - startTime;
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);

    if (__DEV__ && duration > 1000) {
      console.warn(
        `[Performance] "${name}" took too long: ${duration.toFixed(2)}ms`
      );
    }

    this.marks.delete(startMark);
  }

  static async measureAsync(name: string, fn: () => Promise<void>) {
    const startTime = performance.now();
    try {
      await fn();
    } finally {
      const duration = performance.now() - startTime;
      console.log(
        `[Performance] Async ${name}: ${duration.toFixed(2)}ms`
      );
    }
  }
}

/**
 * Exemplo de uso:
 * 
 * // Em App.tsx
 * export default function App() {
 *   useGlobalPerformanceOptimizations();
 *   return <AppNavigator />;
 * }
 * 
 * // Em screens
 * PerformanceLogger.mark('data-fetch-start');
 * const data = await fetchData();
 * PerformanceLogger.measure('Data fetch', 'data-fetch-start');
 * 
 * // Async
 * await PerformanceLogger.measureAsync('Heavy processing', async () => {
 *   await heavyComputation();
 * });
 */
