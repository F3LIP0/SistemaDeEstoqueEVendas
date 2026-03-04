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
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { UI } from '../theme/ui';

type Product = {
  product_id: number;
  sku: string;
  product_name: string;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  minimum_stock?: number;
  category_name?: string;
  brand_name?: string;
  abbreviation?: string;
  is_active?: boolean;
};

type ProductResponse = {
  produtos: Product[];
};

export function ProdutosScreen() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sku, setSku] = useState('');
  const [productName, setProductName] = useState('');
  const [costPrice, setCostPrice] = useState('0');
  const [sellingPrice, setSellingPrice] = useState('0');
  const [currentStock, setCurrentStock] = useState('0');
  const [minimumStock, setMinimumStock] = useState('0');

  const canManage = useMemo(() => (user?.role_level ?? 0) >= 2, [user?.role_level]);
  const canDelete = useMemo(() => (user?.role_level ?? 0) >= 3, [user?.role_level]);
  const debouncedSearch = useDebouncedValue(searchQuery, 250);

  const filteredItems = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => item.product_name.toLowerCase().includes(term) || item.sku.toLowerCase().includes(term));
  }, [items, debouncedSearch]);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await apiRequest<ProductResponse>('/produtos');
      setItems(data.produtos || []);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function clearForm() {
    setEditingId(null);
    setSku('');
    setProductName('');
    setCostPrice('0');
    setSellingPrice('0');
    setCurrentStock('0');
    setMinimumStock('0');
  }

  async function onSubmit() {
    if (!token || !canManage) {
      Alert.alert('Permissão', 'Apenas gerentes e administradores podem salvar produtos.');
      return;
    }

    if (!sku.trim() || !productName.trim()) {
      Alert.alert('Validação', 'SKU e nome são obrigatórios');
      return;
    }

    const payload = {
      sku: sku.trim(),
      product_name: productName.trim(),
      cost_price: Number(costPrice),
      selling_price: Number(sellingPrice),
      current_stock: Number(currentStock),
      minimum_stock: Number(minimumStock),
      unit_id: 1,
    };

    try {
      setSubmitting(true);
      if (editingId) {
        await apiRequest(`/produtos/${editingId}`, {
          method: 'PUT',
          token,
          body: {
            product_name: payload.product_name,
            cost_price: payload.cost_price,
            selling_price: payload.selling_price,
            current_stock: payload.current_stock,
            minimum_stock: payload.minimum_stock,
          },
        });
        Alert.alert('Sucesso', 'Produto atualizado com sucesso');
      } else {
        await apiRequest('/produtos', {
          method: 'POST',
          token,
          body: payload,
        });
        Alert.alert('Sucesso', 'Produto criado com sucesso');
      }

      clearForm();
      await load();
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao salvar produto');
    } finally {
      setSubmitting(false);
    }
  }

  function onEdit(item: Product) {
    setEditingId(item.product_id);
    setSku(item.sku ?? '');
    setProductName(item.product_name ?? '');
    setCostPrice(String(item.cost_price ?? 0));
    setSellingPrice(String(item.selling_price ?? 0));
    setCurrentStock(String(item.current_stock ?? 0));
    setMinimumStock(String(item.minimum_stock ?? 0));
  }

  function onDelete(item: Product) {
    if (!token || !canDelete) {
      Alert.alert('Permissão', 'Apenas administradores podem excluir produtos.');
      return;
    }

    Alert.alert('Confirmar', `Deseja excluir ${item.product_name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiRequest(`/produtos/${item.product_id}`, {
              method: 'DELETE',
              token,
            });
            Alert.alert('Sucesso', 'Produto excluído com sucesso');
            await load();
          } catch (error) {
            Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao excluir produto');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => String(item.product_id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        ListHeaderComponent={
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{editingId ? 'Editar Produto' : 'Novo Produto'}</Text>
            <TextInput
              style={styles.input}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar por nome ou SKU"
              autoCapitalize="none"
            />
            <TextInput style={styles.input} value={sku} onChangeText={setSku} placeholder="SKU" editable={!editingId} />
            <TextInput style={styles.input} value={productName} onChangeText={setProductName} placeholder="Nome do produto" />
            <TextInput
              style={styles.input}
              value={costPrice}
              onChangeText={setCostPrice}
              placeholder="Preço de custo"
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              value={sellingPrice}
              onChangeText={setSellingPrice}
              placeholder="Preço de venda"
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              value={currentStock}
              onChangeText={setCurrentStock}
              placeholder="Estoque atual"
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              value={minimumStock}
              onChangeText={setMinimumStock}
              placeholder="Estoque mínimo"
              keyboardType="numeric"
            />

            <View style={styles.formActions}>
              <Pressable style={[styles.button, styles.saveButton]} onPress={onSubmit} disabled={submitting}>
                <Text style={styles.buttonText}>{editingId ? 'Atualizar' : 'Criar'}</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.cancelButton]} onPress={clearForm}>
                <Text style={styles.buttonText}>Limpar</Text>
              </Pressable>
            </View>

            {!canManage ? (
              <Text style={styles.hint}>Seu perfil só permite visualização de produtos.</Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.product_name}</Text>
            <Text>SKU: {item.sku}</Text>
            <Text>Categoria: {item.category_name || '-'}</Text>
            <Text>Marca: {item.brand_name || '-'}</Text>
            <Text>Unidade: {item.abbreviation || 'un'}</Text>
            <Text>Preço custo: R$ {item.cost_price ?? 0}</Text>
            <Text>Preço venda: R$ {item.selling_price ?? 0}</Text>
            <Text style={[styles.stockText, (item.current_stock ?? 0) <= (item.minimum_stock ?? 0) ? styles.stockCritical : styles.stockOk]}>
              Estoque: {item.current_stock ?? 0} (mín: {item.minimum_stock ?? 0})
            </Text>
            <Text style={[styles.statusText, item.is_active === false ? styles.statusInactive : styles.statusActive]}>
              Status: {item.is_active === false ? 'Inativo' : 'Ativo'}
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
        ListEmptyComponent={<Text style={styles.empty}>{refreshing ? 'Carregando produtos...' : 'Nenhum produto encontrado.'}</Text>}
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
  input: {
    borderWidth: 1,
    borderColor: UI.colors.border,
    borderRadius: UI.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  formActions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  card: { backgroundColor: UI.colors.card, borderRadius: UI.radius.md, padding: 12 },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  stockText: { fontWeight: '700', marginTop: 2 },
  stockOk: { color: UI.colors.success },
  stockCritical: { color: UI.colors.dangerText },
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
