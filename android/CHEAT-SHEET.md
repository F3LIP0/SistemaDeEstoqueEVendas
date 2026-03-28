# 🎨 CHEAT SHEET - Componentes & APIs

**Referência Rápida**  
**Copie, Cole, Use!**

---

## 🔘 Button

```tsx
import { Button } from '@/components';

// Básico
<Button label="Clique" onPress={() => {}} />

// Com variantes
<Button label="Primário" variant="primary" />
<Button label="Secundário" variant="secondary" />
<Button label="Perigo" variant="danger" />
<Button label="Ghost" variant="ghost" />

// Tamanhos
<Button label="Pequeno" size="small" />
<Button label="Normal" size="medium" />
<Button label="Grande" size="large" />

// Com ícone
<Button 
  label="Salvar" 
  icon={Icons.Save}
  onPress={() => {}}
/>

// Loading
<Button 
  label="Salvando..." 
  loading={isLoading}
  onPress={handleSave}
/>

// Desabilitado
<Button 
  label="Desabilitado" 
  disabled={true}
/>

// Fullwidth
<Button 
  label="Login" 
  fullWidth
  onPress={handleLogin}
/>
```

---

## 📱 Card

```tsx
import { Card } from '@/components';

// Básico
<Card>
  <Text>Conteúdo aqui</Text>
</Card>

// Com estilo
<Card
  withShadow
  withBorder
>
  <Text>Com sombra e borda</Text>
</Card>

// Com espaçamento
<Card gap="large" padding="large">
  <Text>Com gaps</Text>
  <Text>Entre elementos</Text>
</Card>

// Como container
<Card
  withShadow
  padding="medium"
  gap="small"
  style={{ marginBottom: 16 }}
>
  <Text style={{ fontWeight: 'bold' }}>Título</Text>
  <Text>Descrição</Text>
  <Button label="Ação" size="small" />
</Card>
```

---

## ⌨️ Input

```tsx
import { Input } from '@/components';

// Básico
<Input
  placeholder="Digite algo"
  value={value}
  onChangeText={setValue}
/>

// Com validação (via getFieldProps do useForm)
const { getFieldProps, errors } = useForm(initial, rules);
<Input {...getFieldProps('email')} />

// Tipos
<Input type="text" placeholder="Texto" />
<Input type="email" placeholder="seu@email.com" />
<Input type="password" placeholder="Senha" />
<Input type="phone" placeholder="(11) 99999-9999" />
<Input type="number" placeholder="0,00" />

// Com label e helper
<Input
  label="Email"
  placeholder="seu@email.com"
  helperText="Nunca compartilharemos seu email"
/>

// Com erro
<Input
  label="Senha"
  value={password}
  onChangeText={setPassword}
  error={errors.password}
/>

// Desabilitado
<Input
  placeholder="Desabilitado"
  editable={false}
/>

// Full width
<Input
  placeholder="Buscar produtos"
  style={{ width: '100%' }}
/>
```

---

## 🎨 Icon

```tsx
import { Icon, Icons } from '@/components';

// Com ícone preset
<Icon preset={Icons.Home} />
<Icon preset={Icons.Settings} />
<Icon preset={Icons.ArrowBack} />

// Tamanhos
<Icon preset={Icons.Home} size="xs" />
<Icon preset={Icons.Home} size="sm" />
<Icon preset={Icons.Home} size="md" /> {/* default */}
<Icon preset={Icons.Home} size="lg" />
<Icon preset={Icons.Home} size="xl" />

// Com cor
<Icon preset={Icons.Home} color="#FF0000" />
<Icon preset={Icons.Success} color="green" />

// Ícones disponíveis
Icons.Home
Icons.Settings
Icons.ArrowBack
Icons.Add
Icons.Delete
Icons.Search
Icons.Filter
Icons.More
Icons.Close
Icons.Check
Icons.Warning
Icons.Error
Icons.Info
Icons.Success
Icons.Loading
// ... mais 30+

// Em Header
<Header title="Home" rightIcon={Icons.Settings} />

// Em Button
<Button label="Salvar" icon={Icons.Save} />
```

---

## 📋 Header

```tsx
import { Header } from '@/components';

// Básico com volta
<Header title="Produtos" />

// Custom title
<Header title="Nova Venda" showBack={true} />

// Com ação no lado direito
<Header 
  title="Configurações"
  rightComponent={<Button label="Salvar" size="small" />}
/>

// Com ícone no lado direito
<Header 
  title="Usuários"
  rightIcon={Icons.Add}
  onRightIconPress={() => navigateTo('CreateUser')}
/>

// Sem voltar (primeira tela)
<Header 
  title="Dashboard"
  showBack={false}
/>

// Custom styling
<Header
  title="Auditoria"
  style={{ backgroundColor: '#f0f0f0' }}
/>
```

---

## 🪟 Modal Dialog

```tsx
import { ModalDialog } from '@/components';

// Info modal
<ModalDialog
  type="info"
  title="Informação"
  message="Seus dados foram salvos"
  visible={visible}
  onClose={() => setVisible(false)}
/>

// Warning modal
<ModalDialog
  type="warning"
  title="Aviso"
  message="Esta ação não pode ser desfeita"
  visible={visible}
  onClose={() => setVisible(false)}
/>

// Success modal
<ModalDialog
  type="success"
  title="Sucesso!"
  message="Venda criada com sucesso"
  visible={visible}
  onClose={() => setVisible(false)}
/>

// Danger modal (confirmação)
<ModalDialog
  type="danger"
  title="Deletar Produto?"
  message="Esta ação é permanente"
  visible={showDelete}
  onClose={() => setShowDelete(false)}
  onConfirm={handleDelete}
/>

// Com botão customizado
<ModalDialog
  type="info"
  title="Deseja Continuar?"
  message="Tem certeza?"
  visible={visible}
  buttonLabel="Sim, continuar"
  onConfirm={handleContinue}
  onClose={() => setVisible(false)}
/>
```

---

## 💀 Skeleton

```tsx
import { Skeleton, SkeletonCard, SkeletonList, SkeletonForm } from '@/components';

// Skeleton genérico
{isLoading && <Skeleton width="100%" height={20} style={{ marginBottom: 8 }} />}

// Skeleton card (item list)
{isLoading && <SkeletonCard />}

// Lista de skeletons
{isLoading && (
  <SkeletonList 
    itemCount={3} 
    // cada item é um Skeleton animado
  />
)}

// Skeleton para formulário
{isLoading && (
  <SkeletonForm 
    // Shows: label skeleton, input skeleton, button skeleton
  />
)}

// Com estilo customizado
<Skeleton 
  width={100} 
  height={100} 
  borderRadius={50} {/* Avatar redondo */}
/>
```

---

## 📭 Empty State

```tsx
import { EmptyState } from '@/components';

// Sem dados
{items.length === 0 && (
  <EmptyState
    type="no-data"
    onAction={() => navigateTo('CreateProduct')}
  />
)}

// Erro ao carregar
{hasError && (
  <EmptyState
    type="error"
    onAction={refetch}
  />
)}

// Sem permissão
{!hasPermission && (
  <EmptyState
    type="no-permission"
  />
)}
```

---

## 🔔 Toast

```tsx
import { useToast } from '@/components';

const screen = () => {
  const toast = useToast();

  // Sucesso
  const handleSuccess = async () => {
    await saveProduct();
    toast.success('Produto salvo!');
  };

  // Erro
  const handleError = () => {
    toast.error('Erro ao salvar produto');
  };

  // Info
  const handleInfo = () => {
    toast.info('Operação iniciada');
  };

  // Warning
  const handleWarning = () => {
    toast.warning('Ação não pode ser desfeita');
  };

  // Custom
  const handleCustom = () => {
    toast.success('✅ Produto criado com sucesso!', {
      duration: 5000,
      position: 'top'
    });
  };

  return (
    <View>
      <Button label="Sucesso" onPress={handleSuccess} />
      <Button label="Erro" onPress={handleError} />
    </View>
  );
};
```

---

## 🎯 useForm Hook

```tsx
import { useForm } from '@/hooks';
import { CommonRules } from '@/utils';

const MyForm = () => {
  const { 
    values,      // { email: '', password: '' }
    errors,      // { email: 'Invalid email' }
    isValid,     // boolean
    isDirty,     // boolean
    setFieldValue,
    validate,
    reset,
    getFieldProps
  } = useForm(
    // Initial values
    {
      email: '',
      password: '',
      phone: ''
    },
    // Validation rules
    {
      email: CommonRules.email,
      password: CommonRules.password,
      phone: CommonRules.phone
    }
  );

  const handleSubmit = async () => {
    if (validate()) {
      // Values are valid
      const response = await api.post('/users', values);
      reset(); // Clear form
    }
  };

  return (
    <>
      <Input {...getFieldProps('email')} />
      <Input {...getFieldProps('password')} type="password" />
      <Input {...getFieldProps('phone')} type="phone" />
      
      <Button
        label="Enviar"
        onPress={handleSubmit}
        disabled={!isValid}
      />
    </>
  );
};
```

---

## 📦 useOfflineData Hook

```tsx
import { useOfflineData } from '@/services/cache';

const ProductsScreen = () => {
  const { 
    data,      // Produtos
    isLoading, // Carregando?
    error,     // Erro?
    isOffline, // Sem internet?
    isStale,   // Dados antigos?
    refetch    // Recarregar
  } = useOfflineData(
    'products', // Cache key
    async () => {
      const response = await api.get('/products');
      return response.data;
    },
    {
      ttl: 5 * 60 * 1000 // 5 minutos
    }
  );

  if (isLoading) return <SkeletonList />;
  if (error) return <EmptyState type="error" />;

  return (
    <FlatList
      data={data}
      renderItem={renderProduct}
      ListEmptyComponent={<EmptyState type="no-data" />}
    />
  );
};
```

---

## 🌐 useNetworkStatus Hook

```tsx
import { useNetworkStatus } from '@/hooks';

const MyScreen = () => {
  const isOnline = useNetworkStatus();

  return (
    <View>
      {!isOnline && (
        <Card style={{ backgroundColor: '#FFF3CD' }}>
          <Text>⚠️ Você está offline</Text>
        </Card>
      )}

      <Button 
        label="Salvar"
        onPress={handleSave}
        disabled={!isOnline}
      />
    </View>
  );
};
```

---

## ✅ CommonRules (Validators)

```tsx
import { CommonRules } from '@/utils';

const rules = {
  email: CommonRules.email,              // email@example.com
  password: CommonRules.password,        // Min 8 chars, uppercase, number
  phone: CommonRules.phone,              // (11) 99999-9999
  cpf: CommonRules.cpf,                  // 111.444.777-35
  cnpj: CommonRules.cnpj,                // 11.222.333/0001-81
  url: CommonRules.url,                  // https://example.com
  required: CommonRules.required,        // Não vazio
  minLength8: CommonRules.minLength(8),  // Min 8 caracteres
  negativeAllowed: CommonRules.negative, // Permite negativos
};
```

---

## 📚 ESTRUTURA PASTA

```
Seu novo arquivo em: src/screens/NovaTela.tsx

import { Button, Card, Input, Header, Icon, Icons } from '@/components';
import { useForm } from '@/hooks';
import { CommonRules } from '@/utils';
import { useToast } from '@/components/Toast';

export const NovaTela = () => {
  const toast = useToast();
  const { values, errors, getFieldProps, validate } = useForm(...);

  return (
    <>
      <Header title="Nova Tela" />
      <Card>
        <Input {...getFieldProps('name')} />
        <Button label="Salvar" onPress={handleSave} />
      </Card>
    </>
  );
};
```

---

## 🚀 TEMPLATE RÁPIDO

```tsx
// Copie e adapte!
import React, { useState } from 'react';
import { View, FlatList } from 'react-native';
import {
  Button,
  Card,
  Input,
  Header,
  Icon,
  Icons,
  EmptyState,
  SkeletonList,
  ModalDialog
} from '@/components';
import { useForm } from '@/hooks';
import { useOfflineData } from '@/services/cache';
import { useToast } from '@/components/Toast';
import { CommonRules } from '@/utils';

export const MyScreen = () => {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, error, refetch } = useOfflineData(
    'my-data',
    async () => {
      // Suas requisições aqui
    },
    { ttl: 5 * 60 * 1000 }
  );

  const { values, errors, getFieldProps, validate } = useForm(
    { name: '', email: '' },
    { email: CommonRules.email }
  );

  const handleSave = () => {
    if (validate()) {
      toast.success('Salvo com sucesso!');
      setShowModal(false);
    }
  };

  if (isLoading) return <SkeletonList />;
  if (error) return <EmptyState type="error" onAction={refetch} />;

  return (
    <>
      <Header title="Minha Tela" />
      
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <Card withShadow padding="medium" gap="small">
            <Text>{item.name}</Text>
          </Card>
        )}
        ListEmptyComponent={<EmptyState type="no-data" />}
      />

      <Button
        label="Novo"
        icon={Icons.Add}
        fullWidth
        onPress={() => setShowModal(true)}
      />

      <ModalDialog
        type="info"
        title="Novo Item"
        visible={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleSave}
      >
        <Input {...getFieldProps('name')} placeholder="Nome" />
        <Input {...getFieldProps('email')} placeholder="Email" />
      </ModalDialog>
    </>
  );
};
```

---

## 🎯 IMPORTS MAIS USADOS

```tsx
// Componentes
import { Button, Card, Input, Header, ModalDialog, Icon, Icons, EmptyState, SkeletonList, Toast } from '@/components';

// Hooks
import { useForm, useOfflineData, useNetworkStatus } from '@/hooks';

// Services
import { apiRequest } from '@/services/api';
import { useToast } from '@/components/Toast';

// Validadores
import { CommonRules, Validators } from '@/utils';

// Navigation (React Navigation)
import { useNavigation } from '@react-navigation/native';
const navigation = useNavigation();
navigation.navigate('ProductDetail', { id: 123 });
navigation.goBack();
```

---

**Pronto! Você tem tudo! 🚀**

Copie, adapte, use!
