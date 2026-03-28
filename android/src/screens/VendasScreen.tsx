import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { Button, Card, EmptyState, Input } from '../components';
import { ApiError, apiRequest } from '../services/api';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { UI } from '../theme/ui';

type Sale = {
  order_id: number;
  order_number?: string;
  order_date: string;
  total_amount: number;
  payment_status: string;
  status?: string;
  customer_name?: string | null;
};

type SaleResponse = {
  vendas: Sale[];
};

type Customer = {
  customer_id: number;
  full_name: string;
};

type CustomerResponse = {
  clientes: Customer[];
};

type Product = {
  product_id: number;
  product_name: string;
  current_stock: number;
};

type ProductResponse = {
  produtos: Product[];
};

type SaleItemDraft = {
  product_id: number;
  product_name: string;
  quantity: number;
  current_stock: number;
};

export function VendasScreen() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<Sale[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [customerQuery, setCustomerQuery] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [showCustomerOptions, setShowCustomerOptions] = useState(false);
  const [showProductOptions, setShowProductOptions] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [saleItems, setSaleItems] = useState<SaleItemDraft[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [notes, setNotes] = useState('');
  const [salesQuery, setSalesQuery] = useState('');

  const canCreate = (user?.role_level ?? 0) >= 2;
  const debouncedSalesQuery = useDebouncedValue(salesQuery, 250);

  const filteredCustomers = useMemo(() => {
    const term = customerQuery.trim().toLowerCase();
    if (!term) return customers.slice(0, 8);
    return customers
      .filter((customer) => customer.full_name.toLowerCase().includes(term) || String(customer.customer_id).includes(term))
      .slice(0, 8);
  }, [customers, customerQuery]);

  const filteredProducts = useMemo(() => {
    const term = productQuery.trim().toLowerCase();
    if (!term) return products.slice(0, 8);
    return products
      .filter((product) => product.product_name.toLowerCase().includes(term) || String(product.product_id).includes(term))
      .slice(0, 8);
  }, [products, productQuery]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.customer_id === selectedCustomerId) ?? null,
    [customers, selectedCustomerId],
  );

  const selectedProduct = useMemo(
    () => products.find((product) => product.product_id === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  const totalItems = useMemo(() => saleItems.reduce((acc, item) => acc + item.quantity, 0), [saleItems]);

  const filteredSales = useMemo(() => {
    const term = debouncedSalesQuery.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (sale) =>
        (sale.order_number || String(sale.order_id)).toLowerCase().includes(term) ||
        (sale.customer_name || '').toLowerCase().includes(term),
    );
  }, [items, debouncedSalesQuery]);

  const salesTotal = useMemo(
    () => filteredSales.reduce((acc, sale) => acc + Number(sale.total_amount || 0), 0),
    [filteredSales],
  );

  const load = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const data = await apiRequest<SaleResponse>('/vendas?limit=30', { token });
      setItems(data.vendas || []);

      if (canCreate) {
        const [clientesData, produtosData] = await Promise.all([
          apiRequest<CustomerResponse>('/clientes', { token }),
          apiRequest<ProductResponse>('/produtos'),
        ]);
        setCustomers(clientesData.clientes || []);
        setProducts(produtosData.produtos || []);
      }

      setError(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Falha ao carregar vendas');
      }
    } finally {
      setRefreshing(false);
    }
  }, [token, canCreate]);

  function addSaleItem() {
    const parsedProduct = Number(selectedProductId);
    const parsedQty = Number(quantity);

    if (!parsedProduct || !selectedProduct || !parsedQty || parsedQty <= 0) {
      Alert.alert('Validação', 'Selecione produto e quantidade > 0 para adicionar item');
      return;
    }

    if (parsedQty > Number(selectedProduct.current_stock || 0)) {
      Alert.alert('Validação', 'Quantidade maior que o estoque disponível');
      return;
    }

    setSaleItems((previousItems) => {
      const existingIndex = previousItems.findIndex((item) => item.product_id === parsedProduct);
      if (existingIndex >= 0) {
        const nextItems = [...previousItems];
        nextItems[existingIndex] = {
          ...nextItems[existingIndex],
          quantity: nextItems[existingIndex].quantity + parsedQty,
        };
        return nextItems;
      }

      return [
        ...previousItems,
        {
          product_id: parsedProduct,
          product_name: selectedProduct.product_name,
          quantity: parsedQty,
          current_stock: selectedProduct.current_stock,
        },
      ];
    });

    setSelectedProductId(null);
    setProductQuery('');
    setQuantity('1');
    setShowProductOptions(false);
  }

  function removeSaleItem(productId: number) {
    setSaleItems((previousItems) => previousItems.filter((item) => item.product_id !== productId));
  }

  async function createSale() {
    if (!token || !canCreate) {
      Alert.alert('Permissão', 'Apenas gerentes e administradores podem criar vendas.');
      return;
    }

    const parsedCustomer = Number(selectedCustomerId);

    if (!parsedCustomer || saleItems.length === 0) {
      Alert.alert('Validação', 'Selecione cliente e adicione pelo menos um item');
      return;
    }

    try {
      setSubmitting(true);
      await apiRequest('/vendas', {
        method: 'POST',
        token,
        body: {
          customer_id: parsedCustomer,
          payment_method: paymentMethod,
          notes: notes || null,
          items: saleItems.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
        },
      });

      setSelectedCustomerId(null);
      setSelectedProductId(null);
      setCustomerQuery('');
      setProductQuery('');
      setQuantity('1');
      setSaleItems([]);
      setPaymentMethod('PIX');
      setNotes('');
      Alert.alert('Sucesso', 'Venda criada com sucesso');
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao criar venda';
      Alert.alert('Erro', message);
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
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={filteredSales}
        keyExtractor={(item) => String(item.order_id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        ListHeaderComponent={
          canCreate ? (
            <Card style={styles.formCard}>
              <Text style={styles.formTitle}>Nova venda</Text>
              <Input
                value={customerQuery}
                onChangeText={setCustomerQuery}
                placeholder="Buscar cliente por nome ou ID"
                onFocus={() => setShowCustomerOptions(true)}
              />
              {selectedCustomer ? <Text style={styles.selectedText}>Cliente: {selectedCustomer.full_name}</Text> : null}
              {showCustomerOptions ? (
                <View style={styles.optionsBox}>
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <Pressable
                        key={customer.customer_id}
                        style={styles.optionItem}
                        onPress={() => {
                          setSelectedCustomerId(customer.customer_id);
                          setCustomerQuery(customer.full_name);
                          setShowCustomerOptions(false);
                        }}
                      >
                        <Text style={styles.optionText}>{customer.full_name}</Text>
                        <Text style={styles.optionSubText}>ID: {customer.customer_id}</Text>
                      </Pressable>
                    ))
                  ) : (
                    <Text style={styles.optionEmpty}>Nenhum cliente encontrado.</Text>
                  )}
                </View>
              ) : null}

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
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
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
                        <Text style={styles.optionSubText}>
                          ID: {product.product_id} • Estoque: {product.current_stock}
                        </Text>
                      </Pressable>
                    ))
                  ) : (
                    <Text style={styles.optionEmpty}>Nenhum produto encontrado.</Text>
                  )}
                </View>
              ) : null}

              <Input
                type="number"
                value={quantity}
                onChangeText={setQuantity}
                placeholder="Quantidade"
                keyboardType="numeric"
              />
              <Button variant="secondary" label="Adicionar item" onPress={addSaleItem} />

              {saleItems.length > 0 ? (
                <View style={styles.itemsBox}>
                  <Text style={styles.itemsTitle}>Itens da venda ({totalItems})</Text>
                  {saleItems.map((saleItem) => (
                    <View key={saleItem.product_id} style={styles.saleItemRow}>
                      <View style={styles.saleItemInfo}>
                        <Text style={styles.saleItemName}>{saleItem.product_name}</Text>
                        <Text style={styles.saleItemSubText}>
                          Qtd: {saleItem.quantity} • ID: {saleItem.product_id}
                        </Text>
                      </View>
                      <Pressable style={styles.removeItemButton} onPress={() => removeSaleItem(saleItem.product_id)}>
                        <Text style={styles.removeItemText}>Remover</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.hint}>Nenhum item adicionado</Text>
              )}

              <Input style={styles.input} value={paymentMethod} onChangeText={setPaymentMethod} placeholder="Forma de pagamento" />
              <Input style={styles.input} value={notes} onChangeText={setNotes} placeholder="Observações" />

              <Button label="Criar venda" onPress={createSale} loading={submitting} />

              <Input
                value={salesQuery}
                onChangeText={setSalesQuery}
                placeholder="Buscar vendas por número/cliente"
              />
              <Text style={styles.hint}>Resumo: {filteredSales.length} venda(s) • Total R$ {salesTotal.toFixed(2)}</Text>
            </Card>
          ) : (
            <Card style={styles.formCard}>
              <Text style={styles.hint}>Seu perfil possui apenas leitura de vendas.</Text>
              <Input
                value={salesQuery}
                onChangeText={setSalesQuery}
                placeholder="Buscar vendas por número/cliente"
              />
              <Text style={styles.hint}>Resumo: {filteredSales.length} venda(s) • Total R$ {salesTotal.toFixed(2)}</Text>
            </Card>
          )
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.name}>Venda {item.order_number || `#${item.order_id}`}</Text>
            <Text>Total: R$ {Number(item.total_amount || 0).toFixed(2)}</Text>
            <Text style={[styles.statusText, item.payment_status === 'PAID' ? styles.statusOk : styles.statusWarn]}>
              Pagamento: {item.payment_status || 'N/A'}
            </Text>
            <Text style={[styles.statusText, item.status === 'CANCELLED' ? styles.statusCritical : styles.statusOk]}>
              Situação: {item.status || 'N/A'}
            </Text>
            <Text>Cliente: {item.customer_name || 'N/A'}</Text>
            <Text>Data: {item.order_date ? new Date(item.order_date).toLocaleString('pt-BR') : '-'}</Text>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            title="Sem vendas"
            message={refreshing ? 'Carregando vendas...' : 'Nenhuma venda encontrada com os filtros atuais.'}
            type="empty"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.colors.background },
  error: { color: UI.colors.danger, textAlign: 'center', marginTop: 10 },
  formCard: { backgroundColor: UI.colors.card, borderRadius: UI.radius.md, padding: 12, marginBottom: 10, gap: 8 },
  formTitle: { fontSize: 16, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: UI.colors.border,
    borderRadius: UI.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  hint: { fontSize: 12, color: UI.colors.textMuted },
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
  optionEmpty: { fontSize: 12, color: UI.colors.textMuted, padding: 10, textAlign: 'center' },
  itemsBox: { borderWidth: 1, borderColor: UI.colors.border, borderRadius: UI.radius.sm, padding: 8, gap: 8 },
  itemsTitle: { fontSize: 13, fontWeight: '700', color: UI.colors.textPrimary },
  saleItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: UI.colors.borderSoft,
    borderRadius: UI.radius.sm,
    padding: 8,
  },
  saleItemInfo: { flex: 1, paddingRight: 10 },
  saleItemName: { fontSize: 13, color: UI.colors.textPrimary, fontWeight: '600' },
  saleItemSubText: { fontSize: 12, color: UI.colors.textMuted },
  removeItemButton: { backgroundColor: UI.colors.dangerBg, borderRadius: UI.radius.xs, paddingHorizontal: 10, paddingVertical: 6 },
  removeItemText: { color: UI.colors.dangerText, fontSize: 12, fontWeight: '600' },
  card: { padding: 12 },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  statusText: { fontWeight: '700', marginTop: 2 },
  statusOk: { color: UI.colors.success },
  statusWarn: { color: UI.colors.warningText },
  statusCritical: { color: UI.colors.dangerText },
});
