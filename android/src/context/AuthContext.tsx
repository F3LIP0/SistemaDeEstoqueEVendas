import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, LoginResponse } from '../services/api';
import { AuthState, User } from '../types';

type LoginInput = {
  emailOrUsername: string;
  senha: string;
};

type AuthContextValue = AuthState & {
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
};

const TOKEN_KEY = '@estoque:token';
const USER_KEY = '@estoque:user';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } finally {
        setInitialized(true);
      }
    })();
  }, []);

  const login = useCallback(async ({ emailOrUsername, senha }: LoginInput) => {
    const response = await apiRequest<LoginResponse>('/login', {
      method: 'POST',
      body: {
        email: emailOrUsername,
        username: emailOrUsername,
        senha,
      },
    });

    setToken(response.token);
    setUser(response.usuario);

    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, response.token),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(response.usuario)),
    ]);
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await Promise.all([AsyncStorage.removeItem(TOKEN_KEY), AsyncStorage.removeItem(USER_KEY)]);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ token, user, initialized, login, logout }),
    [token, user, initialized, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
