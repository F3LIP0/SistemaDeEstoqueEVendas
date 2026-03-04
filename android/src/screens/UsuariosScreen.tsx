import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { UI } from '../theme/ui';

type ApiUser = {
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  role_name?: string;
  role_level?: number;
  created_at?: string;
  last_login?: string | null;
};

type UserListResponse = {
  usuarios: ApiUser[];
};

const ROLE_OPTIONS = ['EMPLOYEE', 'MANAGER', 'ADMIN'] as const;

export function UsuariosScreen() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<ApiUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [senha, setSenha] = useState('123456');
  const [roleName, setRoleName] = useState<(typeof ROLE_OPTIONS)[number]>('EMPLOYEE');

  const canListAndCreate = useMemo(() => (user?.role_level ?? 0) >= 2, [user?.role_level]);
  const canEditDelete = useMemo(() => (user?.role_level ?? 0) >= 3, [user?.role_level]);

  const load = useCallback(async () => {
    if (!token || !canListAndCreate) return;
    setRefreshing(true);
    try {
      const query = includeInactive ? '/usuarios?incluir_inativos=1' : '/usuarios';
      const data = await apiRequest<UserListResponse>(query, { token });
      setItems(data.usuarios || []);
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao carregar usuários');
    } finally {
      setRefreshing(false);
    }
  }, [token, canListAndCreate, includeInactive]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function clearForm() {
    setEditingId(null);
    setFullName('');
    setUsername('');
    setEmail('');
    setPhone('');
    setSenha('123456');
    setRoleName('EMPLOYEE');
  }

  async function onSubmit() {
    if (!token || !canListAndCreate) {
      Alert.alert('Permissão', 'Apenas gerentes e administradores podem criar usuários.');
      return;
    }

    if (!fullName.trim() || !username.trim() || !email.trim()) {
      Alert.alert('Validação', 'Nome, usuário e email são obrigatórios');
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        if (!canEditDelete) {
          Alert.alert('Permissão', 'Apenas administradores podem editar usuários.');
          return;
        }

        await apiRequest(`/usuarios/${editingId}`, {
          method: 'PUT',
          token,
          body: {
            full_name: fullName.trim(),
            username: username.trim(),
            email: email.trim(),
            phone: phone.trim() || null,
            role_name: roleName,
          },
        });
        Alert.alert('Sucesso', 'Usuário atualizado com sucesso');
      } else {
        await apiRequest('/usuarios', {
          method: 'POST',
          token,
          body: {
            full_name: fullName.trim(),
            username: username.trim(),
            email: email.trim(),
            senha,
            phone: phone.trim() || null,
            role_name: roleName,
          },
        });
        Alert.alert('Sucesso', 'Usuário criado com sucesso');
      }

      clearForm();
      await load();
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao salvar usuário');
    } finally {
      setSubmitting(false);
    }
  }

  function onEdit(item: ApiUser) {
    if (!canEditDelete) {
      Alert.alert('Permissão', 'Apenas administradores podem editar usuários.');
      return;
    }

    setEditingId(item.user_id);
    setFullName(item.full_name ?? '');
    setUsername(item.username ?? '');
    setEmail(item.email ?? '');
    setPhone(item.phone ?? '');
    const nextRole = ROLE_OPTIONS.includes(item.role_name as (typeof ROLE_OPTIONS)[number])
      ? (item.role_name as (typeof ROLE_OPTIONS)[number])
      : 'EMPLOYEE';
    setRoleName(nextRole);
    setSenha('123456');
  }

  function onDelete(item: ApiUser) {
    if (!token || !canEditDelete) {
      Alert.alert('Permissão', 'Apenas administradores podem excluir usuários.');
      return;
    }

    Alert.alert('Confirmar', `Deseja excluir ${item.full_name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiRequest(`/usuarios/${item.user_id}`, { method: 'DELETE', token });
            Alert.alert('Sucesso', 'Usuário excluído com sucesso');
            await load();
          } catch (error) {
            Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao excluir usuário');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.user_id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        ListHeaderComponent={
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{editingId ? 'Editar Usuário' : 'Novo Usuário'}</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Mostrar inativos</Text>
              <Pressable
                style={[styles.toggleButton, includeInactive && styles.toggleButtonActive]}
                onPress={() => setIncludeInactive((prev) => !prev)}
              >
                <Text style={styles.toggleButtonText}>{includeInactive ? 'ON' : 'OFF'}</Text>
              </Pressable>
            </View>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Nome completo" />
            <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Usuário de acesso" />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="E-mail"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Telefone" />
            {!editingId ? (
              <TextInput style={styles.input} value={senha} onChangeText={setSenha} placeholder="Senha" secureTextEntry />
            ) : null}

            <View style={styles.roleRow}>
              {ROLE_OPTIONS.map((role) => (
                <Pressable
                  key={role}
                  style={[styles.roleChip, roleName === role && styles.roleChipActive]}
                  onPress={() => setRoleName(role)}
                >
                  <Text style={styles.roleChipText}>{role}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.formActions}>
              <Pressable style={[styles.button, styles.saveButton]} onPress={onSubmit} disabled={submitting}>
                <Text style={styles.buttonText}>{editingId ? 'Atualizar' : 'Criar'}</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.cancelButton]} onPress={clearForm}>
                <Text style={styles.buttonText}>Limpar</Text>
              </Pressable>
            </View>

            {!canListAndCreate ? (
              <Text style={styles.hint}>Seu perfil não permite gerenciar usuários.</Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.full_name}</Text>
            <Text>Usuário: {item.username}</Text>
            <Text>Email: {item.email}</Text>
            <Text>Perfil: {item.role_name || '-'}</Text>
            <Text>Criado em: {item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '-'}</Text>
            <Text>Último login: {item.last_login ? new Date(item.last_login).toLocaleString('pt-BR') : '-'}</Text>
            <Text style={[styles.statusText, item.is_active ? styles.statusActive : styles.statusInactive]}>
              Status: {item.is_active ? 'Ativo' : 'Inativo'}
            </Text>
            <View style={styles.itemActions}>
              <Pressable style={[styles.button, styles.editButton]} onPress={() => onEdit(item)}>
                <Text style={styles.buttonText}>Editar</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.deleteButton]} onPress={() => onDelete(item)}>
                <Text style={styles.buttonText}>Excluir</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{refreshing ? 'Carregando usuários...' : 'Nenhum usuário encontrado.'}</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.colors.background },
  formCard: {
    backgroundColor: UI.colors.card,
    borderRadius: UI.radius.md,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  formTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  toggleLabel: { fontSize: 13, color: UI.colors.textSecondary, fontWeight: '600' },
  toggleButton: {
    backgroundColor: UI.colors.chipBg,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  toggleButtonActive: { backgroundColor: UI.colors.chipActiveBorder },
  toggleButtonText: { fontSize: 12, fontWeight: '700', color: UI.colors.textSecondary },
  input: {
    borderWidth: 1,
    borderColor: UI.colors.border,
    borderRadius: UI.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  roleRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  roleChip: {
    borderWidth: 1,
    borderColor: UI.colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: UI.colors.chipBg,
  },
  roleChipActive: {
    backgroundColor: UI.colors.chipActiveBg,
    borderColor: UI.colors.chipActiveBorder,
  },
  roleChipText: { fontSize: 12, fontWeight: '600' },
  formActions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  card: { backgroundColor: UI.colors.card, borderRadius: UI.radius.md, padding: 12 },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  statusText: { fontWeight: '700', marginTop: 2 },
  statusActive: { color: UI.colors.success },
  statusInactive: { color: UI.colors.dangerText },
  itemActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: UI.radius.sm,
    alignItems: 'center',
  },
  saveButton: { backgroundColor: UI.colors.primary },
  cancelButton: { backgroundColor: UI.colors.neutral },
  editButton: { backgroundColor: UI.colors.secondary },
  deleteButton: { backgroundColor: UI.colors.danger },
  buttonText: { color: UI.colors.white, fontWeight: '600' },
  hint: { fontSize: 12, color: UI.colors.textMuted },
  empty: { textAlign: 'center', marginTop: 20, color: UI.colors.textMuted },
});
