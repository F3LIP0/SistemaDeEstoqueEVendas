import React, { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { UI } from '../theme/ui';

type ConfigResponse = {
  configuracoes: {
    empresa_nome?: string;
    moeda?: string;
    imposto_padrao?: string;
    estoque_minimo_padrao?: string;
    logo_url?: string;
  };
};

export function ConfiguracoesScreen() {
  const { token, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [empresaNome, setEmpresaNome] = useState('');
  const [moeda, setMoeda] = useState('BRL');
  const [impostoPadrao, setImpostoPadrao] = useState('0');
  const [estoqueMinimoPadrao, setEstoqueMinimoPadrao] = useState('0');
  const [logoUrl, setLogoUrl] = useState('');

  const isAdmin = (user?.role_level ?? 0) >= 3;

  const load = useCallback(async () => {
    if (!token || !isAdmin) return;
    setRefreshing(true);
    try {
      const data = await apiRequest<ConfigResponse>('/configuracoes', { token });
      const cfg = data.configuracoes || {};
      setEmpresaNome(String(cfg.empresa_nome || ''));
      setMoeda(String(cfg.moeda || 'BRL'));
      setImpostoPadrao(String(cfg.imposto_padrao ?? '0'));
      setEstoqueMinimoPadrao(String(cfg.estoque_minimo_padrao ?? '0'));
      setLogoUrl(String(cfg.logo_url || ''));
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao carregar configurações');
    } finally {
      setRefreshing(false);
    }
  }, [token, isAdmin]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function save() {
    if (!token || !isAdmin) {
      Alert.alert('Permissão', 'Apenas administradores podem alterar configurações.');
      return;
    }

    const impostoNumber = Number(impostoPadrao);
    const estoqueMinimoNumber = Number(estoqueMinimoPadrao);

    if (Number.isNaN(impostoNumber) || impostoNumber < 0) {
      Alert.alert('Validação', 'Imposto padrão deve ser um número maior ou igual a zero');
      return;
    }

    if (Number.isNaN(estoqueMinimoNumber) || estoqueMinimoNumber < 0) {
      Alert.alert('Validação', 'Estoque mínimo padrão deve ser um número maior ou igual a zero');
      return;
    }

    const moedaNormalizada = moeda.trim().toUpperCase();
    if (moedaNormalizada.length < 3) {
      Alert.alert('Validação', 'Moeda deve ter pelo menos 3 caracteres');
      return;
    }

    try {
      setSaving(true);
      await apiRequest('/configuracoes', {
        method: 'PUT',
        token,
        body: {
          empresa_nome: empresaNome.trim(),
          moeda: moedaNormalizada,
          imposto_padrao: String(impostoNumber),
          estoque_minimo_padrao: String(estoqueMinimoNumber),
          logo_url: logoUrl.trim(),
        },
      });
      setMoeda(moedaNormalizada);
      setImpostoPadrao(String(impostoNumber));
      setEstoqueMinimoPadrao(String(estoqueMinimoNumber));
      Alert.alert('Sucesso', 'Configurações salvas com sucesso');
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao salvar configurações');
    } finally {
      setSaving(false);
    }
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.blockedBox}>
          <Text style={styles.blockedText}>Acesso restrito a administradores.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        contentContainerStyle={styles.content}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Configurações Globais</Text>
          <TextInput style={styles.input} value={empresaNome} onChangeText={setEmpresaNome} placeholder="Nome da empresa" />
          <TextInput style={styles.input} value={moeda} onChangeText={setMoeda} placeholder="Moeda" autoCapitalize="characters" />
          <TextInput
            style={styles.input}
            value={impostoPadrao}
            onChangeText={setImpostoPadrao}
            placeholder="Imposto padrão (%)"
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={estoqueMinimoPadrao}
            onChangeText={setEstoqueMinimoPadrao}
            placeholder="Estoque mínimo padrão"
            keyboardType="numeric"
          />
          <TextInput style={styles.input} value={logoUrl} onChangeText={setLogoUrl} placeholder="URL do logo" autoCapitalize="none" />

          <Pressable style={[styles.button, styles.saveButton]} onPress={save} disabled={saving}>
            <Text style={styles.buttonText}>{saving ? 'Salvando...' : 'Salvar configurações'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.colors.background },
  content: { padding: 12 },
  card: { backgroundColor: UI.colors.card, borderRadius: UI.radius.md, padding: 12, gap: 8 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: UI.colors.border,
    borderRadius: UI.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  button: {
    paddingVertical: 10,
    borderRadius: UI.radius.sm,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButton: { backgroundColor: UI.colors.primary },
  buttonText: { color: UI.colors.white, fontWeight: '600' },
  blockedBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  blockedText: { color: UI.colors.textMuted, textAlign: 'center' },
});
