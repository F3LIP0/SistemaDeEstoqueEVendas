# Testes Automatizados 🧪

Guia para executar, escrever e manter testes no projeto.

## Setup

Dependências já foram adicionadas ao `package.json`:
- `jest` - Test runner
- `@testing-library/react-native` - Utilities para testar componentes
- `@types/jest` - Type definitions

### Instalação

```bash
cd android
npm install
```

## Executando Testes

```bash
# Rodar todos os testes
npm test

# Rodar em watch mode (reexecuta ao salvar arquivo)
npm test -- --watch

# Rodar apenas um arquivo de teste
npm test -- Button.test.tsx

# Rodar com cobertura
npm test -- --coverage

# Atualizar snapshots
npm test -- -u
```

## Estrutura de Testes

```
src/
├── __tests__/
│   ├── components/
│   │   ├── Button.test.tsx
│   │   ├── Card.test.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useForm.test.ts
│   │   ├── useAsync.test.ts
│   │   └── ...
│   └── utils/
│       ├── validators.test.ts
│       └── ...
```

## Escrevendo Testes

### Teste Básico de Componente

```typescript
import { render } from '@testing-library/react-native';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  test('renderiza corretamente', () => {
    const { getByText } = render(<MyComponent testProp="value" />);
    expect(getByText('Expected Text')).toBeTruthy();
  });
});
```

### Teste de Interação

```typescript
import { render, fireEvent } from '@testing-library/react-native';

test('chama callback ao clicar', () => {
  const mockFn = jest.fn();
  const { getByRole } = render(
    <Button label="Click" onPress={mockFn} />
  );

  fireEvent.press(getByRole('button'));
  expect(mockFn).toHaveBeenCalled();
});
```

### Teste de Hook

```typescript
import { renderHook, act } from '@testing-library/react-native';

test('hook atualiza estado', () => {
  const { result } = renderHook(() => useMyHook());

  act(() => {
    result.current.setValue('novo valor');
  });

  expect(result.current.value).toBe('novo valor');
});
```

### Teste com Async

```typescript
import { waitFor } from '@testing-library/react-native';

test('carrega dados', async () => {
  const { getByText } = render(<MyAsyncComponent />);

  await waitFor(() => {
    expect(getByText('Dados carregados')).toBeTruthy();
  });
});
```

### Teste com Mock

```typescript
jest.mock('@/services/api', () => ({
  fetchData: jest.fn().mockResolvedValue({ data: 'mocked' }),
}));

test('usa dados mockados', async () => {
  const { getByText } = render(<MyComponent />);
  
  await waitFor(() => {
    expect(getByText('mocked')).toBeTruthy();
  });
});
```

## Boas Práticas

### ✅ Faça

- **Test behavior, not implementation** - Teste o que o usuário vê/faz, não detalhes internos
- **Use meaningful test names** - "deve renderizar com label correto" > "test1"
- **Arrange-Act-Assert** - Organize testes em 3 partes claras
- **Mock external dependencies** - APIs, AsyncStorage, etc.
- **Keep tests isolated** - Cada teste é independente
- **Use beforeEach/afterEach** - Limpe estado entre testes

### ❌ Evite

- Testes muito acoplados à implementação
- Testes que dependem um do outro
- Múltiplas assertions sem contexto
- Fixtures complexas e compartilhadas
- Ignorar testes com `.skip` ou `.only`

## Padrões Comuns

### Teste de Validação

```typescript
test('valida email obrigatório', () => {
  const { result } = renderHook(() =>
    useForm({ email: '' }, { email: { required: true } })
  );

  act(() => {
    result.current.validate();
  });

  expect(result.current.errors.email).toBeTruthy();
});
```

### Teste de Lista

```typescript
test('renderiza lista de itens', () => {
  const { getAllByTestId } = render(
    <ItemList items={[{ id: 1 }, { id: 2 }]} />
  );

  const items = getAllByTestId('list-item');
  expect(items).toHaveLength(2);
});
```

### Teste de Erro

```typescript
test('mostra erro quando API falha', async () => {
  jest.mock('@/services/api', () => ({
    fetchData: jest.fn().mockRejectedValue(new Error('Network error')),
  }));

  const { getByText } = render(<MyComponent />);

  await waitFor(() => {
    expect(getByText('Error')).toBeTruthy();
  });
});
```

## Cobertura de Testes

Verifique o que está sendo testado:

```bash
npm test -- --coverage
```

Visualize o relatório HTML:

```bash
open coverage/lcov-report/index.html
```

Metas de cobertura por categoria:
- **Componentes**: 80%+ cobertura
- **Hooks**: 85%+ cobertura
- **Utils/Validators**: 95%+ cobertura
- **Screens**: 50%+ cobertura (complexas)

## Debugging Testes

### Imprimir valores

```typescript
test('debug', () => {
  const { debug, getByText } = render(<MyComponent />);
  debug(); // Imprime tree inteira
  
  const element = getByText('text');
  console.log(element.props); // Inspeciona props
});
```

### Pausar execução

```typescript
test('debug com breakpoint', () => {
  const { getByText } = render(<MyComponent />);
  
  debugger; // Pausa aqui ao rodar com --inspect
  
  expect(getByText('text')).toBeTruthy();
});
```

### Rodar com inspect

```bash
node --inspect-brk node_modules/.bin/jest --runInBand MyComponent.test.tsx
```

## Testes de Snapshot

Para UI que muda frequentemente, use snapshots com cuidado:

```typescript
test('renderiza corretamente', () => {
  const { toJSON } = render(<MyComponent />);
  expect(toJSON()).toMatchSnapshot();
});
```

**Atualizar snapshots após intenção mudança:**

```bash
npm test -- -u
```

## Exemplo Completo: Teste de Form Login

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '@/screens/LoginScreen';
import * as api from '@/services/api';

jest.mock('@/services/api');

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('valida campos vazios', async () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    const button = getByText('Entrar');
    fireEvent.press(button);

    await waitFor(() => {
      expect(getByText('Email obrigatório')).toBeTruthy();
      expect(getByText('Senha obrigatória')).toBeTruthy();
    });
  });

  test('faz login com credenciais válidas', async () => {
    const mockLogin = jest.fn().mockResolvedValue({ token: 'abc123' });
    (api.login as jest.Mock).mockImplementation(mockLogin);

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Senha');
    const button = getByText('Entrar');

    fireEvent.changeText(emailInput, 'user@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        'user@example.com',
        'password123'
      );
    });
  });

  test('mostra erro de rede', async () => {
    const mockLogin = jest.fn()
      .mockRejectedValue(new Error('Network error'));
    (api.login as jest.Mock).mockImplementation(mockLogin);

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Senha');
    const button = getByText('Entrar');

    fireEvent.changeText(emailInput, 'user@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(button);

    await waitFor(() => {
      expect(getByText('Erro ao fazer login')).toBeTruthy();
    });
  });
});
```

## Checklist de Testes para Features

- [ ] Renderiza corretamente
- [ ] Callbacks são chamados
- [ ] Validação funciona
- [ ] Estados de erro mostram
- [ ] Estados de loading mostram
- [ ] Dados são exibidos
- [ ] Múltiplos usuários/contextos
- [ ] Edge cases cobertos

## Recursos

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Common mistakes and solutions](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
