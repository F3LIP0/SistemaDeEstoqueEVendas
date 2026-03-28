import React, { createContext, useCallback, useContext, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { UI } from '../theme/ui';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  show: (message: string, type: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const show = useCallback((message: string, type: ToastType, duration = 3000) => {
    const id = generateId();
    const toast: Toast = { id, message, type, duration };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    show(message, 'success', duration);
  }, [show]);

  const error = useCallback((message: string, duration?: number) => {
    show(message, 'error', duration);
  }, [show]);

  const info = useCallback((message: string, duration?: number) => {
    show(message, 'info', duration);
  }, [show]);

  const warning = useCallback((message: string, duration?: number) => {
    show(message, 'warning', duration);
  }, [show]);

  const value: ToastContextValue = { show, success, error, info, warning };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
}

function ToastContainer({ toasts }: ToastContainerProps) {
  const getTypeStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return { bg: UI.colors.success, icon: '✓' };
      case 'error':
        return { bg: UI.colors.danger, icon: '✕' };
      case 'warning':
        return { bg: UI.colors.warning, icon: '⚠' };
      default:
        return { bg: UI.colors.primary, icon: 'ℹ' };
    }
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {toasts.map((toast) => {
        const { bg, icon } = getTypeStyles(toast.type);
        return (
          <View key={toast.id} style={[styles.toast, { backgroundColor: bg }]}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.message}>{toast.message}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: UI.radius.md,
    gap: 12,
  },
  icon: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  message: {
    fontSize: 14,
    color: 'white',
    flex: 1,
  },
});
