import { useState, useCallback } from 'react';

export interface ValidationRules {
  required?: string | boolean;
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
  custom?: (value: string) => string | null;
  email?: string | boolean;
}

export interface FormField {
  value: string;
  error: string | null;
  touched: boolean;
}

export interface FormState {
  [key: string]: FormField;
}

export interface UseFormReturn {
  form: FormState;
  getFieldProps: (name: string) => any;
  setFieldValue: (name: string, value: string) => void;
  setFieldTouched: (name: string, touched: boolean) => void;
  setFieldError: (name: string, error: string | null) => void;
  validate: () => boolean;
  reset: () => void;
  isValid: boolean;
  isDirty: boolean;
  values: { [key: string]: string };
  errors: { [key: string]: string | null };
}

export function useForm(
  initialValues: { [key: string]: string },
  rules: { [key: string]: ValidationRules },
  onSubmit?: (values: { [key: string]: string }) => void
): UseFormReturn {
  const [form, setForm] = useState<FormState>(() => {
    const initial: FormState = {};
    Object.keys(initialValues).forEach((key) => {
      initial[key] = { value: initialValues[key], error: null, touched: false };
    });
    return initial;
  });

  const validateField = useCallback(
    (name: string, value: string): string | null => {
      const fieldRules = rules[name];
      if (!fieldRules) return null;

      // Required validation
      if (fieldRules.required) {
        if (!value.trim()) {
          return typeof fieldRules.required === 'string'
            ? fieldRules.required
            : 'Campo obrigatório';
        }
      }

      // Email validation
      if (fieldRules.email && value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return typeof fieldRules.email === 'string'
            ? fieldRules.email
            : 'Email inválido';
        }
      }

      // Min length
      if (fieldRules.minLength && value.length < fieldRules.minLength.value) {
        return fieldRules.minLength.message;
      }

      // Max length
      if (fieldRules.maxLength && value.length > fieldRules.maxLength.value) {
        return fieldRules.maxLength.message;
      }

      // Pattern
      if (fieldRules.pattern && value.trim()) {
        if (!fieldRules.pattern.value.test(value)) {
          return fieldRules.pattern.message;
        }
      }

      // Custom validation
      if (fieldRules.custom) {
        return fieldRules.custom(value);
      }

      return null;
    },
    [rules]
  );

  const setFieldValue = useCallback((name: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        value,
      },
    }));
  }, []);

  const setFieldTouched = useCallback((name: string, touched: boolean) => {
    setForm((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        touched,
        error: touched ? validateField(name, prev[name].value) : prev[name].error,
      },
    }));
  }, [validateField]);

  const setFieldError = useCallback((name: string, error: string | null) => {
    setForm((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        error,
      },
    }));
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: { [key: string]: string | null } = {};
    let isValid = true;

    Object.keys(form).forEach((name) => {
      const error = validateField(name, form[name].value);
      newErrors[name] = error;
      if (error) isValid = false;
    });

    setForm((prev) => {
      const next = { ...prev };
      Object.keys(newErrors).forEach((name) => {
        next[name] = { ...next[name], error: newErrors[name], touched: true };
      });
      return next;
    });

    return isValid;
  }, [form, validateField]);

  const reset = useCallback(() => {
    const initial: FormState = {};
    Object.keys(initialValues).forEach((key) => {
      initial[key] = { value: initialValues[key], error: null, touched: false };
    });
    setForm(initial);
  }, [initialValues]);

  const isValid = Object.values(form).every((field) => !field.error);
  const isDirty = Object.entries(form).some(
    ([key, field]) => field.value !== initialValues[key]
  );

  const values = Object.keys(form).reduce(
    (acc, key) => {
      acc[key] = form[key].value;
      return acc;
    },
    {} as { [key: string]: string }
  );

  const errors = Object.keys(form).reduce(
    (acc, key) => {
      acc[key] = form[key].error;
      return acc;
    },
    {} as { [key: string]: string | null }
  );

  const getFieldProps = (name: string) => ({
    value: form[name]?.value || '',
    error: form[name]?.error || null,
    onChangeText: (value: string) => setFieldValue(name, value),
    onBlur: () => setFieldTouched(name, true),
  });

  return {
    form,
    getFieldProps,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    validate,
    reset,
    isValid,
    isDirty,
    values,
    errors,
  };
}
