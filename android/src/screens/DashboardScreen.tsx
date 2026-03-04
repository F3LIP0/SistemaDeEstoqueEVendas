import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { UI } from '../theme/ui';

type DashboardData = {
  vendas_mes: number;
  estoque_baixo: number;
  pedidos_hoje: number;
  lucro_mes: number;
};

export function DashboardScreen() {
  const { token, user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const roleLevel = user?.role_level ?? 0;

  const load = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const data = await apiRequest<DashboardData>('/dashboard/estatisticas', { token });
      setStats(data);
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Olá, {user?.nome ?? 'Usuário'} 👋</Text>
          <Pressable onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Sair</Text>
          </Pressable>
        </View>
        <View style={styles.card}><Text>Vendas do mês: R$ {stats?.vendas_mes ?? 0}</Text></View>
        <View style={styles.card}><Text>Estoque baixo: {stats?.estoque_baixo ?? 0}</Text></View>
        <View style={styles.card}><Text>Pedidos hoje: {stats?.pedidos_hoje ?? 0}</Text></View>
        <View style={styles.card}><Text>Lucro do mês: R$ {stats?.lucro_mes ?? 0}</Text></View>

        {roleLevel >= 2 ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Módulos de Gestão</Text>
            <View style={styles.grid}>
              <Pressable style={styles.navButton} onPress={() => navigation.navigate('Usuários')}>
                <Text style={styles.navButtonText}>Usuários</Text>
              </Pressable>
              <Pressable style={styles.navButton} onPress={() => navigation.navigate('Cadastros')}>
                <Text style={styles.navButtonText}>Cadastros</Text>
              </Pressable>
              {roleLevel >= 3 ? (
                <Pressable style={styles.navButton} onPress={() => navigation.navigate('Configurações')}>
                  <Text style={styles.navButtonText}>Configurações</Text>
                </Pressable>
              ) : null}
              {roleLevel >= 3 ? (
                <Pressable style={styles.navButton} onPress={() => navigation.navigate('Auditoria')}>
                  <Text style={styles.navButtonText}>Auditoria</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.colors.background },
  content: { padding: 16, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  logoutButton: {
    backgroundColor: UI.colors.danger,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: UI.radius.sm,
  },
  logoutText: { color: UI.colors.white, fontWeight: '700' },
  card: { backgroundColor: UI.colors.card, borderRadius: UI.radius.md, padding: 14 },
  sectionCard: { backgroundColor: UI.colors.card, borderRadius: UI.radius.md, padding: 14, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  navButton: {
    backgroundColor: UI.colors.primary,
    borderRadius: UI.radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  navButtonText: { color: UI.colors.white, fontWeight: '600' },
});
