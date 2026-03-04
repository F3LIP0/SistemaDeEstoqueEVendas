import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { ApiError, apiRequest } from '../services/api';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { UI } from '../theme/ui';

type AuditLog = {
  log_id: number;
  created_at: string;
  action?: string;
  resource_type?: string;
  resource_id?: number | null;
  ip_address?: string | null;
  usuario_nome?: string | null;
  username?: string | null;
};

type AuditResponse = {
  logs: AuditLog[];
};

export function AuditoriaScreen() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<AuditLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'CREATE' | 'UPDATE' | 'DELETE'>('ALL');
  const debouncedQuery = useDebouncedValue(query, 250);

  const isAdmin = (user?.role_level ?? 0) >= 3;

  const load = useCallback(async () => {
    if (!token || !isAdmin) return;
    setRefreshing(true);
    try {
      const data = await apiRequest<AuditResponse>('/auditoria?limit=100', { token });
      setItems(data.logs || []);
      setInfo(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        setInfo('Acesso restrito a administradores.');
      } else if (error instanceof Error) {
        setInfo(error.message);
      } else {
        setInfo('Falha ao carregar logs de auditoria.');
      }
    } finally {
      setRefreshing(false);
    }
  }, [token, isAdmin]);

  const filteredItems = useMemo(() => {
    const term = debouncedQuery.trim().toLowerCase();
    return items.filter((item) => {
      const actionMatch = actionFilter === 'ALL' ? true : (item.action || '').toUpperCase() === actionFilter;
      const textMatch =
        !term ||
        (item.usuario_nome || item.username || '').toLowerCase().includes(term) ||
        (item.resource_type || '').toLowerCase().includes(term) ||
        String(item.log_id).includes(term);
      return actionMatch && textMatch;
    });
  }, [items, debouncedQuery, actionFilter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyWrap}>
          <Text style={styles.info}>Acesso restrito a administradores.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {info ? <Text style={styles.info}>{info}</Text> : null}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => String(item.log_id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        ListHeaderComponent={
          <View style={styles.filtersCard}>
            <Text style={styles.filtersTitle}>Filtros</Text>
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por usuário, recurso ou ID"
            />
            <View style={styles.chipsRow}>
              {(['ALL', 'CREATE', 'UPDATE', 'DELETE'] as const).map((action) => (
                <Pressable
                  key={action}
                  style={[styles.chip, actionFilter === action && styles.chipActive]}
                  onPress={() => setActionFilter(action)}
                >
                  <Text style={styles.chipText}>{action}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.resultText}>Resultado: {filteredItems.length} log(s)</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.action || 'Ação'} · {item.resource_type || 'recurso'}</Text>
            <Text>Usuário: {item.usuario_nome || item.username || 'Sistema'}</Text>
            <Text>Recurso ID: {item.resource_id ?? '-'}</Text>
            <Text>IP: {item.ip_address || '-'}</Text>
            <Text>Data: {item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : '-'}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.info}>{refreshing ? 'Carregando logs de auditoria...' : 'Nenhum log de auditoria encontrado.'}</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.colors.background },
  filtersCard: { backgroundColor: UI.colors.card, borderRadius: UI.radius.md, padding: 12, marginBottom: 10, gap: 8 },
  filtersTitle: { fontSize: 16, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: UI.colors.border,
    borderRadius: UI.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: UI.colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: UI.colors.chipBg,
  },
  chipActive: { backgroundColor: UI.colors.chipActiveBg, borderColor: UI.colors.chipActiveBorder },
  chipText: { fontSize: 12, fontWeight: '600' },
  resultText: { fontSize: 12, color: UI.colors.textMuted, fontWeight: '600' },
  card: { backgroundColor: UI.colors.card, borderRadius: UI.radius.md, padding: 12 },
  name: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  info: { textAlign: 'center', color: UI.colors.textMuted, marginTop: 10 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
