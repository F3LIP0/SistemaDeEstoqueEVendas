import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { AuditoriaScreen } from '../screens/AuditoriaScreen';
import { CadastrosScreen } from '../screens/CadastrosScreen';
import { ConfiguracoesScreen } from '../screens/ConfiguracoesScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { MovimentacoesScreen } from '../screens/MovimentacoesScreen';
import { PontoScreen } from '../screens/PontoScreen';
import { ProdutosScreen } from '../screens/ProdutosScreen';
import { UsuariosScreen } from '../screens/UsuariosScreen';
import { VendasScreen } from '../screens/VendasScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Produtos" component={ProdutosScreen} />
      <Tab.Screen name="Vendas" component={VendasScreen} />
      <Tab.Screen name="Movimentações" component={MovimentacoesScreen} />
      <Tab.Screen name="Ponto" component={PontoScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { token, initialized } = useAuth();

  if (!initialized) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {token ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="Usuários" component={UsuariosScreen} />
          <Stack.Screen name="Cadastros" component={CadastrosScreen} />
          <Stack.Screen name="Configurações" component={ConfiguracoesScreen} />
          <Stack.Screen name="Auditoria" component={AuditoriaScreen} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}
