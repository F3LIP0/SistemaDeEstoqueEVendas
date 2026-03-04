import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { ApiError, apiRequest } from '../services/api';
import { UI } from '../theme/ui';

type TimeEntry = {
  attendance_id: number;
  clock_in?: string;
  clock_out?: string;
  attendance_date?: string;
};

type TimeResponse = {
  registros: TimeEntry[];
};

export function PontoScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<TimeEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const data = await apiRequest<TimeResponse>('/ponto', { token });
      setItems(data.registros || []);
      setInfo(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 410) {
        setItems([]);
        setInfo('Módulo de ponto desativado no backend.');
      } else if (err instanceof ApiError) {
        setInfo(err.message);
      } else {
        setInfo('Falha ao carregar registros de ponto.');
      }
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  async function registerPoint(tipo: 'entrada' | 'saida') {
    if (!token) return;
    try {
      setSubmitting(true);
      await apiRequest('/ponto', {
        method: 'POST',
        token,
        body: { tipo },
      });
      Alert.alert('Sucesso', `${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso`);
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        Alert.alert('Erro', err.message);
      } else {
        Alert.alert('Erro', 'Falha ao registrar ponto');
      }
    } finally {
      setSubmitting(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.container}>
      {info ? <Text style={styles.info}>{info}</Text> : null}
      <View style={styles.actions}>
        <Pressable style={[styles.button, styles.entradaButton]} onPress={() => registerPoint('entrada')} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? 'Processando...' : 'Registrar entrada'}</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.saidaButton]} onPress={() => registerPoint('saida')} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? 'Processando...' : 'Registrar saída'}</Text>
        </Pressable>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.attendance_id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>Registro #{item.attendance_id}</Text>
            <Text>Data: {item.attendance_date || '-'}</Text>
            <Text>Entrada: {item.clock_in ? new Date(item.clock_in).toLocaleString('pt-BR') : '-'}</Text>
            <Text>Saída: {item.clock_out ? new Date(item.clock_out).toLocaleString('pt-BR') : '-'}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>{refreshing ? 'Carregando registros de ponto...' : 'Nenhum registro de ponto encontrado.'}</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.colors.background },
  info: { textAlign: 'center', color: UI.colors.textMuted, marginTop: 10 },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginBottom: 8, marginTop: 6 },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: UI.radius.sm,
    alignItems: 'center',
  },
  entradaButton: { backgroundColor: UI.colors.primary },
  saidaButton: { backgroundColor: UI.colors.warning },
  buttonText: { color: UI.colors.white, fontWeight: '600' },
  card: { backgroundColor: UI.colors.card, borderRadius: UI.radius.md, padding: 12 },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  empty: { textAlign: 'center', marginTop: 20, color: UI.colors.textMuted },
});
