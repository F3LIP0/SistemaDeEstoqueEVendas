/**
 * EXEMPLO COMPLETO: Tela de Cadastro de Produto
 * 
 * Este arquivo demonstra como usar todos os sistemas implementados:
 * - Componentes reutilizáveis
 * - Formulário com validação
 * - Sistema de ícones
 * - Toast notificações
 * - Offline support
 * - Testes
 * 
 * Localização: src/screens/ProductFormScreen.tsx
 */

import React, { useCallback, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Componentes
import {
  Button,
  Card,
  Header,
  Input,
  ModalDialog,
  Icon,
  Icons,
  EmptyState,
} from '@/components';

// Hooks
import { useForm, useNetworkStatus } from '@/hooks';
import { Validators } from '@/utils';

// Services
import { apiRequest } from '@/services/api';
import { useToast } from '@/components/Toast';
import { syncQueue } from '@/services/cache';

// Auth
import { useAuth } from '@/context/AuthContext';

// Theme
import { UI } from '@/theme/ui';

/**
 * Interface do produto
 */
interface Product {
  sku: string;
  product_name: string;
  cost_price: string;
  selling_price: string;
  current_stock: string;
  minimum_stock: string;
}

/**
 * Tela Principal
 */
export function ProductFormScreen() {
  const navigation = useNavigation();
  const { token } = useAuth();
  const { isOnline } = useNetworkStatus();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ============================================================
  // VALIDAÇÃO DE FORMULÁRIO COM useForm
  // ============================================================
  const { getFieldProps, validate, values, isDirty, reset } = useForm(
    // Valores iniciais
    {
      sku: '',
      product_name: '',
      cost_price: '',
      selling_price: '',
      current_stock: '0',
      minimum_stock: '0',
    },
    // Regras de validação
    {
      sku: {
        required: 'SKU obrigatório',
        minLength: { value: 3, message: 'Mínimo 3 caracteres' },
        maxLength: { value: 20, message: 'Máximo 20 caracteres' },
      },
      product_name: {
        required: 'Nome do produto obrigatório',
        minLength: { value: 2, message: 'Mínimo 2 caracteres' },
      },
      cost_price: {
        required: 'Preço de custo obrigatório',
        custom: Validators.positive,
      },
      selling_price: {
        required: 'Preço de venda obrigatório',
        custom: Validators.positive,
      },
      current_stock: {
        required: 'Estoque atual obrigatório',
        custom: (value: string) => {
          const num = parseInt(value, 10);
          if (Number.isNaN(num) || num < 0) {
            return 'Estoque deve ser um número positivo';
          }
          return null;
        },
      },
      minimum_stock: {
        required: 'Estoque mínimo obrigatório',
        custom: Validators.positive,
      },
    }
  );

  // ============================================================
  // HANDLERS
  // ============================================================

  /**
   * Validar e mostrar confirmação
   */
  const handleSubmitClick = useCallback(() => {
    if (!validate()) {
      toast.error('Preencha todos os campos corretamente');
      return;
    }

    // Validação adicional de negócio
    const costPrice = parseFloat(values.cost_price);
    const sellingPrice = parseFloat(values.selling_price);

    if (sellingPrice <= costPrice) {
      toast.warning('Preço de venda deve ser maior que custo');
      return;
    }

    // Mostrar modal de confirmação
    setShowConfirm(true);
  }, [validate, values, toast]);

  /**
   * Criar produto (online ou offline)
   */
  const handleConfirmCreate = useCallback(async () => {
    setShowConfirm(false);
    setLoading(true);

    try {
      const productData: Product = {
        sku: values.sku.toUpperCase(),
        product_name: values.product_name,
        cost_price: values.cost_price,
        selling_price: values.selling_price,
        current_stock: values.current_stock,
        minimum_stock: values.minimum_stock,
      };

      if (isOnline) {
        // Online: enviar direto
        const response = await apiRequest('/produtos', {
          method: 'POST',
          body: productData,
          token,
        });

        toast.success('Produto criado com sucesso!');
        reset();

        // Navegar de volta
        setTimeout(() => {
          navigation.goBack();
        }, 1000);
      } else {
        // Offline: adicionar à fila de sincronização
        await syncQueue.add({
          endpoint: '/produtos',
          method: 'POST',
          data: productData,
        });

        toast.info('Produto salvo localmente. Será enviado quando online.');
        reset();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao criar';

      if (!isOnline) {
        // Tentar adicionar à fila mesmo se falhar
        await syncQueue.add({
          endpoint: '/produtos',
          method: 'POST',
          data: values,
        });
        toast.warning('Será sincronizado quando online');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [values, isOnline, token, reset, navigation, toast]);

  /**
   * Cancelar e resetar
   */
  const handleCancel = useCallback(() => {
    if (isDirty) {
      // Mostrar confirmação se tem dados
      setShowConfirm(true);
    } else {
      navigation.goBack();
    }
  }, [isDirty, navigation]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <SafeAreaView style={styles.container}>
      {/* Header com volta */}
      <Header
        title="Novo Produto"
        showBack
        onBackPress={handleCancel}
      />

      {/* Status offline */}
      {!isOnline && (
        <View style={styles.offlineBar}>
          <Icon name={Icons.info} size="sm" color={UI.colors.warning} />
          <Text style={styles.offlineText}>
            Offline - mudanças serão sincronizadas
          </Text>
        </View>
      )}

      {/* Formulário */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card padding={16} gap={14}>
          {/* SKU */}
          <Input
            label="SKU"
            placeholder="EX-001"
            {...getFieldProps('sku')}
            helperText="Código único do produto"
          />

          {/* Nome */}
          <Input
            label="Nome do Produto"
            placeholder="Ex: Mouse Gamer RGB"
            {...getFieldProps('product_name')}
          />

          {/* Preço de Custo */}
          <Input
            label="Preço de Custo"
            placeholder="0.00"
            type="number"
            keyboardType="decimal-pad"
            {...getFieldProps('cost_price')}
            helperText="Para cálculo de margem"
          />

          {/* Preço de Venda */}
          <Input
            label="Preço de Venda"
            placeholder="0.00"
            type="number"
            keyboardType="decimal-pad"
            {...getFieldProps('selling_price')}
            helperText="Deve ser maior que custo"
          />

          {/* Estoque Atual */}
          <Input
            label="Estoque Atual"
            placeholder="0"
            type="number"
            {...getFieldProps('current_stock')}
          />

          {/* Estoque Mínimo */}
          <Input
            label="Estoque Mínimo"
            placeholder="0"
            type="number"
            {...getFieldProps('minimum_stock')}
            helperText="Alertar quando atingir este nível"
          />
        </Card>

        {/* Info box */}
        <Card
          padding={12}
          gap={8}
          style={styles.infoCard}
        >
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Margem de Lucro:</Text>
            <Text style={styles.infoValue}>
              {values.cost_price && values.selling_price
                ? (((parseFloat(values.selling_price) - parseFloat(values.cost_price)) /
                    parseFloat(values.cost_price)) *
                    100).toFixed(1) + '%'
                : '-'}
            </Text>
          </View>
        </Card>

        {/* Ajuda */}
        <EmptyState
          title="📝 Dicas"
          message="Preencha todos os campos com atencao. O SKU deve ser unico para cada produto."
          type="empty"
        />
      </ScrollView>

      {/* Botões de ação */}
      <View style={styles.footer}>
        <Button
          label="Cancelar"
          variant="ghost"
          onPress={handleCancel}
          disabled={loading}
          style={styles.cancelButton}
        />
        <Button
          label={loading ? 'Criando...' : 'Criar Produto'}
          variant="primary"
          loading={loading}
          onPress={handleSubmitClick}
          style={styles.submitButton}
        />
      </View>

      {/* Modal de confirmação */}
      <ModalDialog
        visible={showConfirm && !loading}
        title="Confirmar Criação"
        message={`Tem certeza que deseja criar o produto "${values.product_name}"?`}
        type="info"
        confirmText="Sim, Criar"
        cancelText="Cancelar"
        onConfirm={handleConfirmCreate}
        onCancel={() => setShowConfirm(false)}
        loading={loading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.colors.background,
  },
  offlineBar: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
  },
  offlineText: {
    color: UI.colors.warningText || '#b45309',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 100,
  },
  infoCard: {
    backgroundColor: UI.colors.chipBg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: UI.colors.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    color: UI.colors.primary,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: UI.colors.card,
    borderTopWidth: 1,
    borderTopColor: UI.colors.borderSoft,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});

/**
 * TESTES PARA ESTA TELA
 */

/**
 * Arquivo: src/__tests__/screens/ProductForm.test.tsx
 * 
 * import { render, fireEvent, waitFor } from '@testing-library/react-native';
 * import { ProductFormScreen } from '@/screens/ProductFormScreen';
 * 
 * jest.mock('@/services/api');
 * jest.mock('@/services/cache');
 * 
 * describe('ProductFormScreen', () => {
 *   test('valida SKU obrigatório', async () => {
 *     const { getByText } = render(<ProductFormScreen />);
 *     
 *     const submitButton = getByText('Criar Produto');
 *     fireEvent.press(submitButton);
 *     
 *     await waitFor(() => {
 *       expect(getByText('SKU obrigatório')).toBeTruthy();
 *     });
 *   });
 * 
 *   test('valida preço de venda > custo', async () => {
 *     const { getByPlaceholderText, getByText } = render(<ProductFormScreen />);
 *     
 *     fireEvent.changeText(getByPlaceholderText('EX-001'), 'TEST-001');
 *     fireEvent.changeText(getByPlaceholderText('Ex: Mouse Gamer RGB'), 'Mouse');
 *     fireEvent.changeText(getByPlaceholderText('0.00')[0], '100');
 *     fireEvent.changeText(getByPlaceholderText('0.00')[1], '50');
 *     
 *     fireEvent.press(getByText('Criar Produto'));
 *     
 *     await waitFor(() => {
 *       expect(getByText(/Preço de venda deve ser maior/i)).toBeTruthy();
 *     });
 *   });
 * });
 */
