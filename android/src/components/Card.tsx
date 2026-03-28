import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { UI } from '../theme/ui';

interface CardProps extends ViewProps {
  padding?: number;
  gap?: number;
  shadow?: boolean;
  onPress?: () => void;
}

export function Card({
  padding = 16,
  gap = 12,
  shadow = true,
  style,
  children,
  ...props
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        {
          padding,
          gap,
          backgroundColor: UI.colors.card,
          borderRadius: UI.radius.md,
        },
        shadow && styles.shadow,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: UI.colors.border,
    borderWidth: 1,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
