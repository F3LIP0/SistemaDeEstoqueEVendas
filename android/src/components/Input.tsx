import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { UI } from '../theme/ui';

type InputType = 'text' | 'email' | 'password' | 'number' | 'phone';

interface InputProps extends Omit<TextInputProps, 'editable'> {
  label?: string;
  error?: string;
  type?: InputType;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  validation?: (value: string) => string | null;
  onChangeTextValidated?: (value: string, isValid: boolean) => void;
}

export function Input({
  label,
  error: externalError,
  type = 'text',
  required = false,
  disabled = false,
  helperText,
  validation,
  onChangeTextValidated,
  style,
  value,
  onChangeText,
  ...props
}: InputProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const getKeyboardType = () => {
    switch (type) {
      case 'email':
        return 'email-address';
      case 'number':
        return 'numeric';
      case 'phone':
        return 'phone-pad';
      default:
        return 'default';
    }
  };

  const validateInput = (text: string) => {
    let validationError: string | null = null;

    if (required && !text.trim()) {
      validationError = 'Campo obrigatório';
    } else if (type === 'email' && text && !isValidEmail(text)) {
      validationError = 'Email inválido';
    } else if (validation) {
      validationError = validation(text);
    }

    setLocalError(validationError);
    if (onChangeTextValidated) {
      onChangeTextValidated(text, !validationError);
    }

    if (onChangeText) {
      onChangeText(text);
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const error = externalError || localError;
  const hasError = !!error;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}

      <TextInput
        style={[
          styles.input,
          {
            borderColor: hasError
              ? UI.colors.danger
              : isFocused
              ? UI.colors.primary
              : UI.colors.border,
            backgroundColor: disabled ? UI.colors.borderSoft : UI.colors.card,
          },
          style,
        ]}
        placeholderTextColor={UI.colors.textMuted}
        editable={!disabled}
        secureTextEntry={type === 'password'}
        keyboardType={getKeyboardType()}
        value={value}
        onChangeText={validateInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />

      {error && <Text style={styles.error}>{error}</Text>}
      {!error && helperText && <Text style={styles.helperText}>{helperText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: UI.colors.textPrimary,
  },
  required: {
    color: UI.colors.danger,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderRadius: UI.radius.md,
    color: UI.colors.textPrimary,
  },
  error: {
    fontSize: 12,
    color: UI.colors.danger,
  },
  helperText: {
    fontSize: 12,
    color: UI.colors.textMuted,
  },
});
