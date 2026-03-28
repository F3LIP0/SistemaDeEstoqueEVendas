import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';

export interface CacheOptions {
  ttl?: number; // Time to live em ms (padrão: 5 minutos)
  persist?: boolean; // Persistir em AsyncStorage
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

class CacheManager {
  private static instance: CacheManager;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private isOffline = false;

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  setOffline(offline: boolean) {
    this.isOffline = offline;
  }

  isCurrentlyOffline(): boolean {
    return this.isOffline;
  }

  set(key: string, data: any, options: CacheOptions = {}): void {
    const { ttl = DEFAULT_TTL, persist = true } = options;

    // Cache em memória
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttl,
    });

    // Persistir em AsyncStorage
    if (persist) {
      this.persistToStorage(key, data);
    }
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);

    if (!cached) return null;

    // Verificar expiração
    if (cached.timestamp < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Tentar cache em memória primeiro
    const cached = this.get(key);
    if (cached) return cached;

    try {
      // Se online, buscar dados fresco
      if (!this.isOffline) {
        const data = await fetchFn();
        this.set(key, data, options);
        return data;
      }

      // Se offline, tentar cache persistido
      const persistedData = await this.getFromStorage(key);
      if (persistedData) {
        return persistedData;
      }

      throw new Error('Offline e sem dados em cache');
    } catch (error) {
      // Fallback completo para dados persistidos
      const persistedData = await this.getFromStorage(key);
      if (persistedData) {
        return persistedData;
      }
      throw error;
    }
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
      AsyncStorage.removeItem(`cache:${key}.catch`).catch(() => {});
    } else {
      this.cache.clear();
      AsyncStorage.getAllKeys()
        .then((keys) => {
          const cacheKeys = keys.filter((k) => k.startsWith('cache:'));
          return AsyncStorage.multiRemove(cacheKeys);
        })
        .catch(() => {});
    }
  }

  private async persistToStorage(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `cache:${key}`,
        JSON.stringify(data),
        { item: 'asdasd' } as any
      );
    } catch (err) {
      console.error(`Failed to persist cache for ${key}:`, err);
    }
  }

  private async getFromStorage(key: string): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(`cache:${key}`);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error(`Failed to retrieve cache for ${key}:`, err);
      return null;
    }
  }
}

export const cacheManager = CacheManager.getInstance();

/**
 * Hook para usar cache com suporte offline
 */
export interface UseOfflineDataOptions extends CacheOptions {
  enabled?: boolean;
}

export interface UseOfflineDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isStale: boolean;
  isOffline: boolean;
  retry: () => Promise<void>;
}

export function useOfflineData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: UseOfflineDataOptions = {}
): UseOfflineDataReturn<T> {
  const { enabled = true, ttl, persist = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [isOffline, setIsOffline] = useState(cacheManager.isCurrentlyOffline());

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const fetchedData = await cacheManager.getOrFetch(key, fetchFn, {
        ttl,
        persist,
      });

      setData(fetchedData);
      setIsStale(cacheManager.isCurrentlyOffline() && !cacheManager.get(key));
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [enabled, key, fetchFn, ttl, persist]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const retry = useCallback(async () => {
    cacheManager.clear(key);
    await fetchData();
  }, [key, fetchData]);

  return {
    data,
    loading,
    error,
    isStale,
    isOffline,
    retry,
  };
}

/**
 * Hook para sincronizar dados quando voltar online
 */
export interface SyncItem {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  data: any;
  timestamp: number;
}

class SyncQueue {
  private queue: SyncItem[] = [];
  private syncing = false;

  async add(item: Omit<SyncItem, 'id' | 'timestamp'>): Promise<void> {
    const syncItem: SyncItem = {
      ...item,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };

    this.queue.push(syncItem);
    await this.persistQueue();
  }

  async processQueue(syncFn: (item: SyncItem) => Promise<void>): Promise<void> {
    if (this.syncing) return;

    this.syncing = true;
    const failedItems: SyncItem[] = [];

    for (const item of this.queue) {
      try {
        await syncFn(item);
      } catch (err) {
        failedItems.push(item);
      }
    }

    this.queue = failedItems;
    await this.persistQueue();
    this.syncing = false;
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  async clear(): Promise<void> {
    this.queue = [];
    await AsyncStorage.removeItem('sync:queue');
  }

  private async persistQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('sync:queue', JSON.stringify(this.queue));
    } catch (err) {
      console.error('Failed to persist sync queue:', err);
    }
  }

  async loadQueue(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('sync:queue');
      if (data) {
        this.queue = JSON.parse(data);
      }
    } catch (err) {
      console.error('Failed to load sync queue:', err);
    }
  }
}

export const syncQueue = new SyncQueue();
