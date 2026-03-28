import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UI } from '../theme/ui';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  type?: 'empty' | 'error' | 'no-permission';
}

export function EmptyState({
  title,
  message,
  icon,
  actionLabel,
  onAction,
  type = 'empty',
}: EmptyStateProps) {
  const getTypeColor = () => {
    switch (type) {
      case 'error':
        return UI.colors.danger;
      case 'no-permission':
        return UI.colors.warning;
      default:
        return UI.colors.textMuted;
    }
  };

  const getTypeIcon = () => {
    if (icon) return icon;
    switch (type) {
      case 'error':
        return '❌';
      case 'no-permission':
        return '🔒';
      default:
        return '📭';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.icon, { color: getTypeColor() }]}>{getTypeIcon()}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          variant="primary"
          size="md"
          onPress={onAction}
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  icon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: UI.colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: UI.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: 12,
  },
});
