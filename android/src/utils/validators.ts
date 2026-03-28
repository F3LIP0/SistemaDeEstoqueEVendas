/**
 * Validadores reutilizáveis para formulários
 */

export const Validators = {
  // String validators
  email: (value: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Email inválido';
  },

  phone: (value: string): string | null => {
    const digits = value.replace(/\D/g, '');
    const phoneRegex = /^(55)?\d{10,11}$/;
    return phoneRegex.test(digits) ? null : 'Telefone inválido';
  },

  cpf: (value: string): string | null => {
    const cpf = value.replace(/\D/g, '');
    if (cpf.length !== 11) return 'CPF deve ter 11 dígitos';
    
    // Validação simples de CPF
    const allSame = Array.from(cpf).every((digit) => digit === cpf[0]);
    if (allSame) return 'CPF inválido';
    
    return null;
  },

  cnpj: (value: string): string | null => {
    const cnpj = value.replace(/\D/g, '');
    return cnpj.length === 14 ? null : 'CNPJ deve ter 14 dígitos';
  },

  password: (value: string): string | null => {
    if (value.length < 8) return 'Senha deve ter no mínimo 8 caracteres';
    if (!/[A-Z]/.test(value)) return 'Senha deve conter letras maiúsculas';
    if (!/[a-z]/.test(value)) return 'Senha deve conter letras minúsculas';
    if (!/[0-9]/.test(value)) return 'Senha deve conter números';
    return null;
  },

  url: (value: string): string | null => {
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol) ? null : 'URL inválida';
    } catch {
      return 'URL inválida';
    }
  },

  // Number validators
  positive: (value: string): string | null => {
    const num = parseFloat(value);
    return num > 0 ? null : 'Valor deve ser positivo';
  },

  integer: (value: string): string | null => {
    const num = parseInt(value, 10);
    return Number.isInteger(num) ? null : 'Deve ser um número inteiro';
  },

  // Range validators
  minValue: (min: number) => (value: string): string | null => {
    const num = parseFloat(value);
    return num >= min ? null : `Valor mínimo é ${min}`;
  },

  maxValue: (max: number) => (value: string): string | null => {
    const num = parseFloat(value);
    return num <= max ? null : `Valor máximo é ${max}`;
  },

  between: (min: number, max: number) => (value: string): string | null => {
    const num = parseFloat(value);
    return num >= min && num <= max ? null : `Valor deve estar entre ${min} e ${max}`;
  },

  // String length
  minLength: (length: number) => (value: string): string | null => {
    return value.length >= length ? null : `Mínimo ${length} caracteres`;
  },

  maxLength: (length: number) => (value: string): string | null => {
    return value.length <= length ? null : `Máximo ${length} caracteres`;
  },

  // Complex validators
  match: (fieldValue: string, message?: string) => (value: string): string | null => {
    return value === fieldValue ? null : message || 'Os valores não correspondem';
  },

  contains: (substring: string, message?: string) => (value: string): string | null => {
    return value.includes(substring)
      ? null
      : message || `Deve conter "${substring}"`;
  },

  // Composed validators
  passwordStrength: (value: string): string | null => {
    if (value.length < 8) return 'Senha muito fraca (mín. 8 caracteres)';
    if (!/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/[0-9]/.test(value)) {
      return 'Senha deve conter maiúsculas, minúsculas e números';
    }
    return null;
  },

  creditCard: (value: string): string | null => {
    const cc = value.replace(/\D/g, '');
    if (cc.length < 13 || cc.length > 19) return 'Número de cartão inválido';
    // Luhn algorithm
    let sum = 0;
    for (let i = 0; i < cc.length; i++) {
      let digit = parseInt(cc[cc.length - 1 - i], 10);
      if (i % 2) digit *= 2;
      if (digit > 9) digit -= 9;
      sum += digit;
    }
    return sum % 10 === 0 ? null : 'Cartão inválido';
  },
};

/**
 * Regras de validação comuns
 */
export const CommonRules = {
  required: { required: 'Campo obrigatório' },
  
  email: {
    required: 'Email obrigatório',
    email: 'Email inválido',
  },

  password: {
    required: 'Senha obrigatória',
    minLength: { value: 8, message: 'Mínimo 8 caracteres' },
  },

  phone: {
    required: 'Telefone obrigatório',
    custom: Validators.phone,
  },

  cpf: {
    required: 'CPF obrigatório',
    custom: Validators.cpf,
  },

  number: {
    required: 'Campo obrigatório',
    custom: Validators.integer,
  },

  positiveNumber: {
    required: 'Campo obrigatório',
    custom: Validators.positive,
  },

  url: {
    custom: Validators.url,
  },
};

/**
 * Sanitizadores de input
 */
export const Sanitizers = {
  phone: (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9, 13)}`;
  },

  cpf: (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  },

  cnpj: (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    }
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
  },

  currency: (value: string): string => {
    const digits = value.replace(/\D/g, '');
    const num = parseInt(digits || '0', 10) / 100;
    const [integer, decimal] = num.toFixed(2).split('.');
    const integerWithThousands = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `R$ ${integerWithThousands},${decimal}`;
  },

  uppercase: (value: string): string => value.toUpperCase(),

  lowercase: (value: string): string => value.toLowerCase(),

  trim: (value: string): string => value.trim(),
};
