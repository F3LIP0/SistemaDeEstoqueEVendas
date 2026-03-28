import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../services/api';
import { Button, Card, EmptyState, Input } from '../components';
import { useAuth } from '../context/AuthContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { UI } from '../theme/ui';

const RECENT_SCANS_STORAGE_KEY = 'produtos:recent-scans';
const MAX_RECENT_SCANS = 5;

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
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [scannerFeedback, setScannerFeedback] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<string[]>([]);
  const [permission, requestPermission] = useCameraPermissions();
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const [scanLineSuccessFlash, setScanLineSuccessFlash] = useState(false);
  const scanCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    if (!isScannerVisible) {
      scanLineAnim.stopAnimation();
      scanLineAnim.setValue(0);
      return;
    }

    const scanAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    scanAnimation.start();

    return () => {
      scanAnimation.stop();
    };
  }, [isScannerVisible, scanLineAnim]);

  useEffect(() => {
    return () => {
      if (scanCloseTimeoutRef.current) {
        clearTimeout(scanCloseTimeoutRef.current);
        scanCloseTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadRecentScans = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(RECENT_SCANS_STORAGE_KEY);
        if (!storedValue || !mounted) return;

        const parsed = JSON.parse(storedValue);
        if (!Array.isArray(parsed)) return;

        const sanitized = parsed
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .map((item) => item.trim().toUpperCase())
          .slice(0, MAX_RECENT_SCANS);

        if (sanitized.length > 0) {
          setRecentScans(sanitized);
        }
      } catch {
        // Ignora erro de leitura para não interromper o fluxo da tela.
      }
    };

    loadRecentScans();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(RECENT_SCANS_STORAGE_KEY, JSON.stringify(recentScans)).catch(() => {
      // Ignora erro de persistência para manter a experiência de uso.
    });
  }, [recentScans]);

  function clearForm() {
    setEditingId(null);
    setSku('');
    setProductName('');
    setCostPrice('0');
    setSellingPrice('0');
    setCurrentStock('0');
    setMinimumStock('0');
  }

  async function openScanner() {
    if (!canManage) {
      Alert.alert('Permissão', 'Apenas gerentes e administradores podem cadastrar produtos.');
      return;
    }

    if (editingId) {
      Alert.alert('Edição', 'Para escanear novo código, clique em Limpar antes de editar outro produto.');
      return;
    }

    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Câmera', 'Permita acesso à câmera para escanear código de barras.');
        return;
      }
    }

    setHasScanned(false);
    setScannerFeedback(null);
    setIsScannerVisible(true);
  }

  function closeScanner() {
    if (scanCloseTimeoutRef.current) {
      clearTimeout(scanCloseTimeoutRef.current);
      scanCloseTimeoutRef.current = null;
    }
    setIsScannerVisible(false);
    setHasScanned(false);
    setScannerFeedback(null);
    setScanLineSuccessFlash(false);
  }

  function pushRecentScan(scannedSku: string) {
    setRecentScans((previous) =>
      [scannedSku, ...previous.filter((item) => item !== scannedSku)].slice(0, MAX_RECENT_SCANS),
    );
  }

  function useRecentScan(scannedSku: string) {
    if (!canManage || editingId) return;
    Vibration.vibrate(35);
    setSku(scannedSku);
    setScannerFeedback(null);
    setIsScannerVisible(false);
    setHasScanned(false);
    setScanLineSuccessFlash(false);
  }

  function clearRecentScans() {
    Alert.alert('Limpar recentes', 'Deseja remover os SKUs recentes do scanner?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpar',
        style: 'destructive',
        onPress: () => {
          setRecentScans([]);
          setScannerFeedback(null);
        },
      },
    ]);
  }

  function onBarcodeScanned(result: BarcodeScanningResult) {
    if (hasScanned) return;
    setHasScanned(true);

    const scannedCode = result.data?.trim();
    if (!scannedCode) {
      setHasScanned(false);
      setScannerFeedback('Não foi possível ler o código. Tente novamente.');
      return;
    }

    const normalizedScannedCode = scannedCode.toUpperCase();
    const duplicatedProduct = items.find(
      (item) => item.sku.trim().toUpperCase() === normalizedScannedCode,
    );

    if (duplicatedProduct) {
      setHasScanned(false);
      Vibration.vibrate([0, 80, 50, 80]);
      setScannerFeedback(`${normalizedScannedCode} já existe para ${duplicatedProduct.product_name}.`);
      return;
    }

    Vibration.vibrate(50);
    setSku(normalizedScannedCode);
    pushRecentScan(normalizedScannedCode);
    setScannerFeedback(null);
    setScanLineSuccessFlash(true);

    scanCloseTimeoutRef.current = setTimeout(() => {
      setIsScannerVisible(false);
      setHasScanned(false);
      setScanLineSuccessFlash(false);
      scanCloseTimeoutRef.current = null;
      Alert.alert('Código lido', `SKU preenchido: ${normalizedScannedCode}`);
    }, 220);
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

    const normalizedSku = sku.trim().toUpperCase();
    const hasDuplicateSku = items.some(
      (item) => item.product_id !== editingId && item.sku.trim().toUpperCase() === normalizedSku,
    );

    if (hasDuplicateSku) {
      Alert.alert('Validação', 'Já existe um produto com este SKU. Use um código diferente.');
      return;
    }

    const payload = {
      sku: normalizedSku,
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
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>{editingId ? 'Editar Produto' : 'Novo Produto'}</Text>
            <Input
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar por nome ou SKU"
              autoCapitalize="none"
            />
            <View style={styles.skuRow}>
              <Input
                style={[styles.input, styles.skuInput]}
                value={sku}
                onChangeText={(value) => setSku(value.toUpperCase())}
                placeholder="SKU"
                disabled={!!editingId}
                autoCapitalize="characters"
              />
              <Button
                style={styles.scanButton}
                variant="secondary"
                size="sm"
                label="Escanear"
                onPress={openScanner}
                disabled={!!editingId || submitting || !canManage}
              />
            </View>
            <Input style={styles.input} value={productName} onChangeText={setProductName} placeholder="Nome do produto" />
            <Input
              type="number"
              value={costPrice}
              onChangeText={setCostPrice}
              placeholder="Preço de custo"
              keyboardType="numeric"
            />
            <Input
              type="number"
              value={sellingPrice}
              onChangeText={setSellingPrice}
              placeholder="Preço de venda"
              keyboardType="numeric"
            />
            <Input
              type="number"
              value={currentStock}
              onChangeText={setCurrentStock}
              placeholder="Estoque atual"
              keyboardType="numeric"
            />
            <Input
              type="number"
              value={minimumStock}
              onChangeText={setMinimumStock}
              placeholder="Estoque mínimo"
              keyboardType="numeric"
            />

            <View style={styles.formActions}>
              <Button
                style={styles.actionButton}
                label={editingId ? 'Atualizar' : 'Criar'}
                onPress={onSubmit}
                loading={submitting}
              />
              <Button style={styles.actionButton} variant="secondary" label="Limpar" onPress={clearForm} />
            </View>

            {!canManage ? (
              <Text style={styles.hint}>Seu perfil só permite visualização de produtos.</Text>
            ) : null}
          </Card>
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
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
              <Button style={styles.actionButton} variant="secondary" size="sm" label="Editar" onPress={() => onEdit(item)} />
              <Button style={styles.actionButton} variant="danger" size="sm" label="Excluir" onPress={() => onDelete(item)} />
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            title="Sem produtos"
            message={refreshing ? 'Carregando produtos...' : 'Nenhum produto encontrado com os filtros atuais.'}
            type="empty"
          />
        }
      />

      <Modal visible={isScannerVisible} transparent animationType="slide" onRequestClose={closeScanner}>
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerCard}>
            <Text style={styles.scannerTitle}>Escaneie o código de barras</Text>
            <Text style={styles.scannerHint}>Aponte a câmera para o código para preencher o SKU automaticamente.</Text>

            {recentScans.length > 0 ? (
              <View style={styles.recentScansSection}>
                <View style={styles.recentScansHeader}>
                  <Text style={styles.recentScansTitle}>Recentes ({recentScans.length}/{MAX_RECENT_SCANS})</Text>
                  <Pressable onPress={clearRecentScans} style={styles.clearRecentButton}>
                    <Text style={styles.clearRecentButtonText}>Limpar</Text>
                  </Pressable>
                </View>
                <View style={styles.recentScansList}>
                  {recentScans.map((item) => (
                    <Pressable key={item} style={styles.recentScanChip} onPress={() => useRecentScan(item)}>
                      <Text style={styles.recentScanChipText}>{item}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {scannerFeedback ? <Text style={styles.scannerError}>{scannerFeedback}</Text> : null}

            <View style={styles.cameraContainer}>
              <CameraView
                style={styles.cameraView}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'itf14'],
                }}
                onBarcodeScanned={hasScanned ? undefined : onBarcodeScanned}
              />
              <View pointerEvents="none" style={styles.scannerGuide}>
                <Animated.View
                  style={[
                    styles.scannerLine,
                    scanLineSuccessFlash ? styles.scannerLineSuccess : null,
                    {
                      transform: [
                        {
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 170],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <View style={[styles.scannerGuideCorner, styles.topLeftCorner]} />
                <View style={[styles.scannerGuideCorner, styles.topRightCorner]} />
                <View style={[styles.scannerGuideCorner, styles.bottomLeftCorner]} />
                <View style={[styles.scannerGuideCorner, styles.bottomRightCorner]} />
                <Text style={styles.scannerGuideText}>Centralize o código dentro da moldura</Text>
              </View>
            </View>

            <View style={styles.scannerActions}>
              <Button variant="secondary" label="Cancelar" onPress={closeScanner} />
            </View>
          </View>
        </View>
      </Modal>
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
  skuRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  skuInput: { flex: 1 },
  formActions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  card: { padding: 12 },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  stockText: { fontWeight: '700', marginTop: 2 },
  stockOk: { color: UI.colors.success },
  stockCritical: { color: UI.colors.dangerText },
  statusText: { fontWeight: '700', marginTop: 2 },
  statusActive: { color: UI.colors.success },
  statusInactive: { color: UI.colors.dangerText },
  itemActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionButton: { flex: 1 },
  scanButton: { minWidth: 98 },
  buttonDisabled: { opacity: 0.6 },
  hint: { fontSize: 12, color: UI.colors.textMuted },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  scannerCard: {
    backgroundColor: UI.colors.card,
    borderRadius: UI.radius.md,
    padding: 12,
    gap: 10,
  },
  scannerTitle: { fontSize: 16, fontWeight: '700', color: UI.colors.textPrimary },
  scannerHint: { color: UI.colors.textMuted, fontSize: 13 },
  recentScansSection: {
    gap: 6,
  },
  recentScansHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentScansTitle: {
    color: UI.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  clearRecentButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearRecentButtonText: {
    color: UI.colors.dangerText,
    fontSize: 12,
    fontWeight: '700',
  },
  recentScansList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  recentScanChip: {
    backgroundColor: UI.colors.borderSoft,
    borderRadius: UI.radius.sm,
    borderWidth: 1,
    borderColor: UI.colors.border,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  recentScanChipText: {
    color: UI.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  scannerError: {
    color: UI.colors.dangerText,
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: UI.colors.borderSoft,
    borderRadius: UI.radius.xs,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  cameraContainer: {
    height: 300,
    borderRadius: UI.radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: UI.colors.border,
    position: 'relative',
  },
  cameraView: { flex: 1 },
  scannerGuide: {
    position: 'absolute',
    top: 24,
    left: 24,
    right: 24,
    bottom: 24,
    borderRadius: UI.radius.sm,
    borderColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
  },
  scannerGuideCorner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: UI.colors.white,
  },
  scannerLine: {
    position: 'absolute',
    top: 24,
    left: 14,
    right: 14,
    height: 2,
    backgroundColor: UI.colors.white,
    opacity: 0.9,
  },
  scannerLineSuccess: {
    backgroundColor: UI.colors.success,
  },
  topLeftCorner: {
    top: -1,
    left: -1,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: UI.radius.sm,
  },
  topRightCorner: {
    top: -1,
    right: -1,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: UI.radius.sm,
  },
  bottomLeftCorner: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: UI.radius.sm,
  },
  bottomRightCorner: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: UI.radius.sm,
  },
  scannerGuideText: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    textAlign: 'center',
    color: UI.colors.white,
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scannerActions: { flexDirection: 'row', justifyContent: 'flex-end' },
});
