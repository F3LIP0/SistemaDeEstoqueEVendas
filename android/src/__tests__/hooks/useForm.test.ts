import { renderHook, act } from '@testing-library/react-native';
import { useForm } from '../../../src/hooks';
import { Validators } from '../../../src/utils';

describe('useForm Hook', () => {
  test('initializes with correct default values', () => {
    const { result } = renderHook(() =>
      useForm(
        { email: '', password: '' },
        { email: {}, password: {} }
      )
    );

    expect(result.current.values.email).toBe('');
    expect(result.current.values.password).toBe('');
  });

  test('updates field value correctly', () => {
    const { result } = renderHook(() =>
      useForm(
        { email: '' },
        { email: {} }
      )
    );

    act(() => {
      result.current.setFieldValue('email', 'test@email.com');
    });

    expect(result.current.values.email).toBe('test@email.com');
  });

  test('validates required field', () => {
    const { result } = renderHook(() =>
      useForm(
        { email: '' },
        { email: { required: 'Email é obrigatório' } }
      )
    );

    act(() => {
      const isValid = result.current.validate();
      expect(isValid).toBe(false);
    });

    expect(result.current.errors.email).toBe('Email é obrigatório');
  });

  test('validates email format', () => {
    const { result } = renderHook(() =>
      useForm(
        { email: '' },
        { email: { email: 'Email inválido' } }
      )
    );

    act(() => {
      result.current.setFieldValue('email', 'invalid-email');
    });

    act(() => {
      result.current.validate();
    });

    expect(result.current.errors.email).toBe('Email inválido');

    act(() => {
      result.current.setFieldValue('email', 'valid@email.com');
    });

    act(() => {
      const isValid = result.current.validate();
      expect(isValid).toBe(true);
    });
  });

  test('resets form to initial values', () => {
    const { result } = renderHook(() =>
      useForm(
        { email: '', name: '' },
        { email: {}, name: {} }
      )
    );

    act(() => {
      result.current.setFieldValue('email', 'test@email.com');
      result.current.setFieldValue('name', 'John');
      result.current.reset();
    });

    expect(result.current.values.email).toBe('');
    expect(result.current.values.name).toBe('');
  });

  test('tracks dirty state correctly', () => {
    const { result } = renderHook(() =>
      useForm(
        { email: '' },
        { email: {} }
      )
    );

    expect(result.current.isDirty).toBe(false);

    act(() => {
      result.current.setFieldValue('email', 'test@email.com');
    });

    expect(result.current.isDirty).toBe(true);
  });

  test('handles multiple field validation', () => {
    const { result } = renderHook(() =>
      useForm(
        { email: '', password: '', name: '' },
        {
          email: { required: 'Email obrigatório', email: 'Email inválido' },
          password: { required: 'Senha obrigatória', minLength: { value: 8, message: 'Mín 8 chars' } },
          name: { required: 'Nome obrigatório' },
        }
      )
    );

    act(() => {
      result.current.validate();
    });

    expect(result.current.isValid).toBe(false);
    expect(result.current.errors.email).toBe('Email obrigatório');
    expect(result.current.errors.password).toBe('Senha obrigatória');
    expect(result.current.errors.name).toBe('Nome obrigatório');
  });

  test('supports custom validation', () => {
    const { result } = renderHook(() =>
      useForm(
        { age: '' },
        {
          age: {
            custom: (value) => {
              const num = parseInt(value, 10);
              return num >= 18 ? null : 'Deve ser maior de 18 anos';
            },
          },
        }
      )
    );

    act(() => {
      result.current.setFieldValue('age', '17');
    });

    act(() => {
      result.current.validate();
    });

    expect(result.current.errors.age).toBe('Deve ser maior de 18 anos');

    act(() => {
      result.current.setFieldValue('age', '20');
    });

    act(() => {
      result.current.validate();
    });

    expect(result.current.errors.age).toBeNull();
  });
});
