import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { Button, Card, EmptyState, Input } from '../components';
import { apiRequest } from '../services/api';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { UI } from '../theme/ui';

type Movement = {
  movement_id: number;
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  movement_date: string;
  notes?: string;
  product_name?: string;
  sku?: string;
  usuario_nome?: string;
};

type MovementResponse = {
  movimentacoes: Movement[];
};

type Product = {
  product_id: number;
  product_name: string;
  current_stock: number;
};

type ProductResponse = {
  produtos: Product[];
};

const MOV_TYPES: Array<'IN' | 'OUT' | 'ADJUSTMENT'> = ['IN', 'OUT', 'ADJUSTMENT'];

export function MovimentacoesScreen() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [productQuery, setProductQuery] = useState('');
  const [showProductOptions, setShowProductOptions] = useState(false);
  const [movementType, setMovementType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [listTypeFilter, setListTypeFilter] = useState<'ALL' | 'IN' | 'OUT' | 'ADJUSTMENT'>('ALL');
  const [listQuery, setListQuery] = useState('');

  const canCreate = (user?.role_level ?? 0) >= 2;
  const debouncedListQuery = useDebouncedValue(listQuery, 250);

  const selectedProduct = useMemo(
    () => products.find((product) => product.product_id === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  const filteredProducts = useMemo(() => {
    const term = productQuery.trim().toLowerCase();
    if (!term) return products.slice(0, 8);
    return products
      .filter((product) => product.product_name.toLowerCase().includes(term) || String(product.product_id).includes(term))
      .slice(0, 8);
  }, [products, productQuery]);

  const filteredMovements = useMemo(() => {
    const term = debouncedListQuery.trim().toLowerCase();
    return items.filter((item) => {
      const typeMatch = listTypeFilter === 'ALL' ? true : item.movement_type === listTypeFilter;
      const textMatch =
        !term ||
        (item.product_name || '').toLowerCase().includes(term) ||
        (item.sku || '').toLowerCase().includes(term) ||
        String(item.movement_id).includes(term);
      return typeMatch && textMatch;
    });
  }, [items, listTypeFilter, debouncedListQuery]);

  const movementSummary = useMemo(() => {
    const summary = { IN: 0, OUT: 0, ADJUSTMENT: 0 };
    for (const item of filteredMovements) {
      summary[item.movement_type] += 1;
    }
    return summary;
  }, [filteredMovements]);

  const load = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const [data, productsData] = await Promise.all([
        apiRequest<MovementResponse>('/movimentacoes?limit=30', { token }),
        apiRequest<ProductResponse>('/produtos'),
      ]);
      setItems(data.movimentacoes || []);
      setProducts(productsData.produtos || []);
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  async function createMovement() {
    if (!token || !canCreate) {
      Alert.alert('Permissão', 'Apenas gerentes e administradores podem criar movimentações.');
      return;
    }

    const parsedProductId = Number(selectedProductId);
    const parsedQuantity = Number(quantity);
    if (!parsedProductId || !parsedQuantity || parsedQuantity <= 0) {
      Alert.alert('Validação', 'Selecione produto e quantidade > 0');
      return;
    }

    try {
      setSubmitting(true);
      await apiRequest('/movimentacoes', {
        method: 'POST',
        token,
        body: {
          product_id: parsedProductId,
          movement_type: movementType,
          quantity: parsedQuantity,
          notes: notes.trim() || null,
        },
      });

      setSelectedProductId(null);
      setProductQuery('');
      setShowProductOptions(false);
      setQuantity('1');
      setMovementType('IN');
      setNotes('');
      await load();
      Alert.alert('Sucesso', 'Movimentação registrada com sucesso');
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao criar movimentação');
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
      <FlatList
        data={filteredMovements}
        keyExtractor={(item) => String(item.movement_id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        ListHeaderComponent={
          <View style={{ gap: 8 }}>
            {canCreate ? (
              <Card style={styles.formCard}>
                <Text style={styles.formTitle}>Nova movimentação</Text>
                <Input
                  value={productQuery}
                  onChangeText={setProductQuery}
                  placeholder="Buscar produto por nome ou ID"
                  onFocus={() => setShowProductOptions(true)}
                />
                {selectedProduct ? (
                  <Text style={styles.selectedText}>
                    Produto: {selectedProduct.product_name} (Estoque: {selectedProduct.current_stock})
                  </Text>
                ) : null}
                {showProductOptions ? (
                  <View style={styles.optionsBox}>
                    {filteredProducts.map((product) => (
                      <Pressable
                        key={product.product_id}
                        style={styles.optionItem}
                        onPress={() => {
                          setSelectedProductId(product.product_id);
                          setProductQuery(product.product_name);
                          setShowProductOptions(false);
                        }}
                      >
                        <Text style={styles.optionText}>{product.product_name}</Text>
                        <Text style={styles.optionSubText}>ID: {product.product_id} • Estoque: {product.current_stock}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                <View style={styles.typeRow}>
                  {MOV_TYPES.map((type) => (
                    <Pressable
                      key={type}
                      style={[styles.typeChip, movementType === type && styles.typeChipActive]}
                      onPress={() => setMovementType(type)}
                    >
                      <Text style={styles.typeChipText}>{type}</Text>
                    </Pressable>
                  ))}
                </View>

                <Input type="number" value={quantity} onChangeText={setQuantity} placeholder="Quantidade" keyboardType="numeric" />
                <Input value={notes} onChangeText={setNotes} placeholder="Observações" />

                <Button label="Registrar movimentação" onPress={createMovement} loading={submitting} />
              </Card>
            ) : null}

            <Card style={styles.formCard}>
              <Text style={styles.formTitle}>Filtro de listagem</Text>
              <Input
                value={listQuery}
                onChangeText={setListQuery}
                placeholder="Buscar por produto, SKU ou ID"
              />
              <View style={styles.typeRow}>
                {(['ALL', ...MOV_TYPES] as const).map((type) => (
                  <Pressable
                    key={type}
                    style={[styles.typeChip, listTypeFilter === type && styles.typeChipActive]}
                    onPress={() => setListTypeFilter(type)}
                  >
                    <Text style={styles.typeChipText}>{type}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.selectedText}>
                Resumo: {filteredMovements.length} mov. • IN {movementSummary.IN} • OUT {movementSummary.OUT} • ADJ {movementSummary.ADJUSTMENT}
              </Text>
            </Card>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.name}>Mov. #{item.movement_id}</Text>
            <Text>Produto: {item.product_name || '-'}</Text>
            <Text style={styles.typeInfo}>Tipo: {item.movement_type}</Text>
            <Text style={[styles.quantityInfo, item.quantity >= 0 ? styles.qtyIn : styles.qtyOut]}>Quantidade: {item.quantity}</Text>
            <Text>Data: {item.movement_date ? new Date(item.movement_date).toLocaleString('pt-BR') : '-'}</Text>
            <Text>Usuário: {item.usuario_nome || '-'}</Text>
            {!!item.notes && <Text>Observações: {item.notes}</Text>}
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            title="Sem movimentações"
            message={refreshing ? 'Carregando movimentações...' : 'Nenhuma movimentação encontrada com os filtros atuais.'}
            type="empty"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.colors.background },
  formCard: { backgroundColor: UI.colors.card, borderRadius: UI.radius.md, padding: 12, marginBottom: 12, gap: 8 },
  formTitle: { fontSize: 16, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: UI.colors.border,
    borderRadius: UI.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  selectedText: { fontSize: 12, color: UI.colors.textSecondary, fontWeight: '600' },
  optionsBox: {
    borderWidth: 1,
    borderColor: UI.colors.border,
    borderRadius: UI.radius.sm,
    backgroundColor: UI.colors.card,
    maxHeight: 210,
    overflow: 'hidden',
  },
  optionItem: { paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: UI.colors.borderSoft },
  optionText: { fontSize: 14, color: UI.colors.textPrimary, fontWeight: '600' },
  optionSubText: { fontSize: 12, color: UI.colors.textMuted },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: {
    borderWidth: 1,
    borderColor: UI.colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: UI.colors.chipBg,
  },
  typeChipActive: { backgroundColor: UI.colors.chipActiveBg, borderColor: UI.colors.chipActiveBorder },
  typeChipText: { fontSize: 12, fontWeight: '600' },
  card: { padding: 12 },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  typeInfo: { fontWeight: '700', color: UI.colors.textSecondary },
  quantityInfo: { fontWeight: '700' },
  qtyIn: { color: UI.colors.success },
  qtyOut: { color: UI.colors.dangerText },
});
