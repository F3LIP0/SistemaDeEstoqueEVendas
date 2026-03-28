import { Validators, Sanitizers } from '../../../src/utils';

describe('Validators', () => {
  describe('email', () => {
    test('válida email correto', () => {
      expect(Validators.email('user@example.com')).toBeNull();
      expect(Validators.email('test.name+tag@domain.co.uk')).toBeNull();
    });

    test('invalida email incorreto', () => {
      expect(Validators.email('invalid')).not.toBeNull();
      expect(Validators.email('invalid@')).not.toBeNull();
      expect(Validators.email('@domain.com')).not.toBeNull();
    });
  });

  describe('phone', () => {
    test('válida telefone brasileiro', () => {
      expect(Validators.phone('11987654321')).toBeNull();
      expect(Validators.phone('(11) 98765-4321')).toBeNull();
      expect(Validators.phone('+5511987654321')).toBeNull();
    });

    test('invalida telefone incorreto', () => {
      expect(Validators.phone('123')).not.toBeNull();
      expect(Validators.phone('abcdefghijk')).not.toBeNull();
    });
  });

  describe('cpf', () => {
    test('válida CPF com 11 dígitos', () => {
      expect(Validators.cpf('12345678901')).toBeNull();
    });

    test('invalida CPF com menos dígitos', () => {
      expect(Validators.cpf('1234567890')).not.toBeNull();
    });

    test('invalida CPF com todos os mesmos dígitos', () => {
      expect(Validators.cpf('11111111111')).not.toBeNull();
    });
  });

  describe('password', () => {
    test('válida senha forte', () => {
      expect(Validators.password('SecurePass123')).toBeNull();
    });

    test('invalida senha curta', () => {
      expect(Validators.password('Short1')).not.toBeNull();
    });

    test('invalida sem maiúsculas', () => {
      expect(Validators.password('insecurepass123')).not.toBeNull();
    });

    test('invalida sem números', () => {
      expect(Validators.password('InsecurePass')).not.toBeNull();
    });
  });

  describe('url', () => {
    test('válida URL correta', () => {
      expect(Validators.url('https://example.com')).toBeNull();
      expect(Validators.url('http://localhost:3000')).toBeNull();
    });

    test('invalida URL incorreta', () => {
      expect(Validators.url('not a url')).not.toBeNull();
      expect(Validators.url('htp://invalid')).not.toBeNull();
    });
  });

  describe('positive', () => {
    test('válida número positivo', () => {
      expect(Validators.positive('100')).toBeNull();
      expect(Validators.positive('0.1')).toBeNull();
    });

    test('invalida número negativo ou zero', () => {
      expect(Validators.positive('0')).not.toBeNull();
      expect(Validators.positive('-10')).not.toBeNull();
    });
  });

  describe('minValue', () => {
    test('válida valor acima do mínimo', () => {
      const validator = Validators.minValue(10);
      expect(validator('10')).toBeNull();
      expect(validator('20')).toBeNull();
    });

    test('invalida valor abaixo do mínimo', () => {
      const validator = Validators.minValue(10);
      expect(validator('5')).not.toBeNull();
    });
  });

  describe('between', () => {
    test('válida valor entre limites', () => {
      const validator = Validators.between(10, 20);
      expect(validator('10')).toBeNull();
      expect(validator('15')).toBeNull();
      expect(validator('20')).toBeNull();
    });

    test('invalida valor fora dos limites', () => {
      const validator = Validators.between(10, 20);
      expect(validator('5')).not.toBeNull();
      expect(validator('25')).not.toBeNull();
    });
  });

  describe('match', () => {
    test('válida campos que correspondem', () => {
      const validator = Validators.match('password123');
      expect(validator('password123')).toBeNull();
    });

    test('invalida campos que não correspondem', () => {
      const validator = Validators.match('password123');
      expect(validator('differentPass')).not.toBeNull();
    });
  });
});

describe('Sanitizers', () => {
  describe('phone', () => {
    test('formata número de telefone', () => {
      expect(Sanitizers.phone('11987654321')).toBe('(11) 98765-4321');
      expect(Sanitizers.phone('5511987654321')).toBe('+55 (11) 98765-4321');
    });
  });

  describe('cpf', () => {
    test('formata CPF', () => {
      expect(Sanitizers.cpf('12345678901')).toBe('123.456.789-01');
    });
  });

  describe('cnpj', () => {
    test('formata CNPJ', () => {
      expect(Sanitizers.cnpj('12345678000190')).toBe('12.345.678/0001-90');
    });
  });

  describe('currency', () => {
    test('formata como moeda', () => {
      expect(Sanitizers.currency('100')).toBe('R$ 1,00');
      expect(Sanitizers.currency('123456')).toBe('R$ 1.234,56');
    });
  });

  describe('uppercase', () => {
    test('converte para maiúsculas', () => {
      expect(Sanitizers.uppercase('hello')).toBe('HELLO');
    });
  });

  describe('lowercase', () => {
    test('converte para minúsculas', () => {
      expect(Sanitizers.lowercase('HELLO')).toBe('hello');
    });
  });

  describe('trim', () => {
    test('remove espaços', () => {
      expect(Sanitizers.trim('  hello  ')).toBe('hello');
    });
  });
});
