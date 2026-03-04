import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { UI } from '../theme/ui';

type Category = {
  category_id: number;
  category_name: string;
  description?: string;
};

type Brand = {
  brand_id: number;
  brand_name: string;
  description?: string;
};

type Unit = {
  unit_id: number;
  unit_name: string;
  abbreviation: string;
};

type CategoriesResponse = { categorias: Category[] };
type BrandsResponse = { marcas: Brand[] };
type UnitsResponse = { unidades: Unit[] };

export function CadastrosScreen() {
  const { token, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandDescription, setBrandDescription] = useState('');
  const [unitName, setUnitName] = useState('');
  const [unitAbbreviation, setUnitAbbreviation] = useState('');

  const canCreate = (user?.role_level ?? 0) >= 2;
  const canDelete = (user?.role_level ?? 0) >= 3;

  const load = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const [categoriesData, brandsData, unitsData] = await Promise.all([
        apiRequest<CategoriesResponse>('/categorias', { token }),
        apiRequest<BrandsResponse>('/marcas', { token }),
        apiRequest<UnitsResponse>('/unidades', { token }),
      ]);
      setCategories(categoriesData.categorias || []);
      setBrands(brandsData.marcas || []);
      setUnits(unitsData.unidades || []);
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao carregar cadastros');
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function createCategory() {
    if (!token || !canCreate) {
      Alert.alert('Permissão', 'Apenas gerentes e administradores podem criar categorias.');
      return;
    }
    if (!categoryName.trim()) {
      Alert.alert('Validação', 'Nome da categoria é obrigatório');
      return;
    }
    try {
      await apiRequest('/categorias', {
        method: 'POST',
        token,
        body: {
          category_name: categoryName.trim(),
          description: categoryDescription.trim() || null,
        },
      });
      setCategoryName('');
      setCategoryDescription('');
      await load();
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao criar categoria');
    }
  }

  async function createBrand() {
    if (!token || !canCreate) {
      Alert.alert('Permissão', 'Apenas gerentes e administradores podem criar marcas.');
      return;
    }
    if (!brandName.trim()) {
      Alert.alert('Validação', 'Nome da marca é obrigatório');
      return;
    }
    try {
      await apiRequest('/marcas', {
        method: 'POST',
        token,
        body: {
          brand_name: brandName.trim(),
          description: brandDescription.trim() || null,
        },
      });
      setBrandName('');
      setBrandDescription('');
      await load();
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao criar marca');
    }
  }

  async function createUnit() {
    if (!token || !canCreate) {
      Alert.alert('Permissão', 'Apenas gerentes e administradores podem criar unidades.');
      return;
    }
    if (!unitName.trim() || !unitAbbreviation.trim()) {
      Alert.alert('Validação', 'Nome e abreviação são obrigatórios');
      return;
    }
    try {
      await apiRequest('/unidades', {
        method: 'POST',
        token,
        body: {
          unit_name: unitName.trim(),
          abbreviation: unitAbbreviation.trim(),
        },
      });
      setUnitName('');
      setUnitAbbreviation('');
      await load();
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao criar unidade');
    }
  }

  async function removeCategory(item: Category) {
    if (!token || !canDelete) return;
    try {
      await apiRequest(`/categorias/${item.category_id}`, { method: 'DELETE', token });
      await load();
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao excluir categoria');
    }
  }

  async function removeBrand(item: Brand) {
    if (!token || !canDelete) return;
    try {
      await apiRequest(`/marcas/${item.brand_id}`, { method: 'DELETE', token });
      await load();
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao excluir marca');
    }
  }

  async function removeUnit(item: Unit) {
    if (!token || !canDelete) return;
    try {
      await apiRequest(`/unidades/${item.unit_id}`, { method: 'DELETE', token });
      await load();
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao excluir unidade');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        contentContainerStyle={styles.content}
      >
        <View style={styles.section}>
          <Text style={styles.title}>Categorias</Text>
          <TextInput style={styles.input} value={categoryName} onChangeText={setCategoryName} placeholder="Nome da categoria" />
          <TextInput
            style={styles.input}
            value={categoryDescription}
            onChangeText={setCategoryDescription}
            placeholder="Descrição"
          />
          <Pressable style={[styles.button, styles.primary]} onPress={createCategory}>
            <Text style={styles.buttonText}>Adicionar categoria</Text>
          </Pressable>
          {categories.map((item) => (
            <View key={item.category_id} style={styles.rowItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.category_name}</Text>
                <Text style={styles.rowSub}>{item.description || '-'}</Text>
              </View>
              {canDelete ? (
                <Pressable style={[styles.button, styles.danger]} onPress={() => removeCategory(item)}>
                  <Text style={styles.buttonText}>Excluir</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Marcas</Text>
          <TextInput style={styles.input} value={brandName} onChangeText={setBrandName} placeholder="Nome da marca" />
          <TextInput style={styles.input} value={brandDescription} onChangeText={setBrandDescription} placeholder="Descrição" />
          <Pressable style={[styles.button, styles.primary]} onPress={createBrand}>
            <Text style={styles.buttonText}>Adicionar marca</Text>
          </Pressable>
          {brands.map((item) => (
            <View key={item.brand_id} style={styles.rowItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.brand_name}</Text>
                <Text style={styles.rowSub}>{item.description || '-'}</Text>
              </View>
              {canDelete ? (
                <Pressable style={[styles.button, styles.danger]} onPress={() => removeBrand(item)}>
                  <Text style={styles.buttonText}>Excluir</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Unidades</Text>
          <TextInput style={styles.input} value={unitName} onChangeText={setUnitName} placeholder="Nome da unidade" />
          <TextInput style={styles.input} value={unitAbbreviation} onChangeText={setUnitAbbreviation} placeholder="Abreviação" />
          <Pressable style={[styles.button, styles.primary]} onPress={createUnit}>
            <Text style={styles.buttonText}>Adicionar unidade</Text>
          </Pressable>
          {units.map((item) => (
            <View key={item.unit_id} style={styles.rowItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.unit_name}</Text>
                <Text style={styles.rowSub}>{item.abbreviation}</Text>
              </View>
              {canDelete ? (
                <Pressable style={[styles.button, styles.danger]} onPress={() => removeUnit(item)}>
                  <Text style={styles.buttonText}>Excluir</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.colors.background },
  content: { padding: 12, gap: 12 },
  section: { backgroundColor: UI.colors.card, borderRadius: UI.radius.md, padding: 12, gap: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: UI.colors.border,
    borderRadius: UI.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: UI.colors.borderSoft,
    borderRadius: UI.radius.sm,
    padding: 8,
  },
  rowTitle: { fontSize: 14, fontWeight: '700', color: UI.colors.textPrimary },
  rowSub: { fontSize: 12, color: UI.colors.textMuted },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: UI.radius.sm,
    alignItems: 'center',
  },
  primary: { backgroundColor: UI.colors.primary },
  danger: { backgroundColor: UI.colors.danger },
  buttonText: { color: UI.colors.white, fontWeight: '600' },
});
