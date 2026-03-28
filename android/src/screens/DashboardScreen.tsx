import React, { useCallback, useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Header } from '../components';
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
      <Header title="Dashboard" subtitle={`Olá, ${user?.nome ?? 'Usuário'}`} showBack={false} />
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Resumo rápido</Text>
          <Button label="Sair" variant="danger" size="sm" onPress={logout} />
        </View>
        <Card style={styles.card}><Text>Vendas do mês: R$ {stats?.vendas_mes ?? 0}</Text></Card>
        <Card style={styles.card}><Text>Estoque baixo: {stats?.estoque_baixo ?? 0}</Text></Card>
        <Card style={styles.card}><Text>Pedidos hoje: {stats?.pedidos_hoje ?? 0}</Text></Card>
        <Card style={styles.card}><Text>Lucro do mês: R$ {stats?.lucro_mes ?? 0}</Text></Card>

        {roleLevel >= 2 ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Módulos de Gestão</Text>
            <View style={styles.grid}>
              <Button label="Usuários" size="sm" onPress={() => navigation.navigate('Usuários')} />
              <Button label="Cadastros" size="sm" onPress={() => navigation.navigate('Cadastros')} />
              {roleLevel >= 3 ? (
                <Button label="Configurações" size="sm" onPress={() => navigation.navigate('Configurações')} />
              ) : null}
              {roleLevel >= 3 ? (
                <Button label="Auditoria" size="sm" onPress={() => navigation.navigate('Auditoria')} />
              ) : null}
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.colors.background },
  content: { padding: 16, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '700' },
  card: { padding: 14 },
  sectionCard: { padding: 14, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
