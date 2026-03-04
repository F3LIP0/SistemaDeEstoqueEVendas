import React, { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
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
      <View style={styles.card}>
        <Text style={styles.title}>Fluxa</Text>
        <Text style={styles.subtitle}>Versão Android</Text>

        <TextInput
          style={styles.input}
          placeholder="Email ou usuário"
          autoCapitalize="none"
          value={emailOrUsername}
          onChangeText={setEmailOrUsername}
        />

        <TextInput
          style={styles.input}
          placeholder="Senha"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.button} onPress={onSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
        </Pressable>
      </View>
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
    backgroundColor: UI.colors.card,
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
  input: {
    borderWidth: 1,
    borderColor: UI.colors.border,
    borderRadius: UI.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: UI.colors.primary,
    paddingVertical: 12,
    borderRadius: UI.radius.md,
    alignItems: 'center',
  },
  buttonText: {
    color: UI.colors.white,
    fontWeight: '600',
  },
  error: {
    color: UI.colors.danger,
    fontSize: 13,
  },
});
