import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  PressableProps,
  PressableStateCallbackType,
} from 'react-native';
import { UI } from '../theme/ui';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const getVariantStyles = (variant: ButtonVariant) => {
  switch (variant) {
    case 'primary':
      return { bg: UI.colors.primary, text: UI.colors.white };
    case 'secondary':
      return { bg: UI.colors.secondary, text: UI.colors.white };
    case 'danger':
      return { bg: UI.colors.danger, text: UI.colors.white };
    case 'ghost':
      return { bg: 'transparent', text: UI.colors.primary };
    default:
      return { bg: UI.colors.primary, text: UI.colors.white };
  }
};

const getSizeStyles = (size: ButtonSize) => {
  switch (size) {
    case 'sm':
      return { padding: 8, fontSize: 12 };
    case 'lg':
      return { padding: 16, fontSize: 16 };
    default:
      return { padding: 12, fontSize: 14 };
  }
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  disabled = false,
  style: incomingStyle,
  ...props
}: ButtonProps) {
  const variantStyles = getVariantStyles(variant);
  const sizeStyles = getSizeStyles(size);

  return (
    <Pressable
      style={(state: PressableStateCallbackType) => [
        styles.button,
        {
          backgroundColor: variantStyles.bg,
          paddingVertical: sizeStyles.padding,
          width: fullWidth ? '100%' : 'auto',
          opacity: disabled || loading ? 0.6 : 1,
          paddingHorizontal: sizeStyles.padding * 1.5,
          borderRadius: UI.radius.md,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: variant === 'ghost' ? UI.colors.primary : 'transparent',
        },
        typeof incomingStyle === 'function' ? incomingStyle(state) : incomingStyle,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={variantStyles.text} />
        ) : (
          <>
            {icon && <View style={styles.icon}>{icon}</View>}
            <Text style={[styles.text, { color: variantStyles.text, fontSize: sizeStyles.fontSize }]}>
              {label}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontWeight: '600',
  },
});
