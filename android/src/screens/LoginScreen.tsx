import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Input } from '../components';
import { UI } from '../theme/ui';

export function LoginScreen() {
  const { login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('admin@empresa.com');
  const [senha, setSenha] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    if (!emailOrUsername || !senha) {
      setError('Preencha usuário/email e senha');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login({ emailOrUsername, senha });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>fluxa</Text>
        <Text style={styles.subtitle}>Versão Android</Text>

        <Input
          label="Email ou usuário"
          placeholder="Email ou usuário"
          autoCapitalize="none"
          value={emailOrUsername}
          onChangeText={setEmailOrUsername}
        />

        <Input
          label="Senha"
          type="password"
          placeholder="Senha"
          value={senha}
          onChangeText={setSenha}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Entrar" onPress={onSubmit} loading={loading} fullWidth />
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.colors.background,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 20,
    borderRadius: UI.radius.lg,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: UI.colors.textMuted,
    marginBottom: 8,
  },
  error: {
    color: UI.colors.danger,
    fontSize: 13,
  },
});
