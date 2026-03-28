# Sistema de Validação de Formulários 📋

Este documento descreve como usar o sistema robusto de validação de formulários do app.

## Quick Start

```tsx
import { useForm, CommonRules } from '@/hooks';
import { Input, Button, Card } from '@/components';
import { useToast } from '@/components/Toast';

export function MyFormScreen() {
  const toast = useToast();
  
  const { values, errors, getFieldProps, validate } = useForm(
    { email: '', password: '' },
    {
      email: CommonRules.email,
      password: CommonRules.password,
    }
  );

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Preencha os campos corretamente');
      return;
    }
    
    // Submit form...
    console.log(values);
  };

  return (
    <Card>
      <Input 
        label="Email" 
        placeholder="seu@email.com"
        {...getFieldProps('email')}
      />
      
      <Input 
        label="Senha" 
        type="password"
        placeholder="Senha"
        {...getFieldProps('password')}
      />
      
      <Button label="Entrar" onPress={handleSubmit} />
    </Card>
  );
}
```

## Usando Validadores Predefinidos

### Email
```tsx
{
  email: CommonRules.email
}
```

### Telefone
```tsx
{
  phone: CommonRules.phone
}
```

### CPF
```tsx
{
  cpf: CommonRules.cpf
}
```

### Número Positivo
```tsx
{
  quantity: CommonRules.positiveNumber
}
```

## Validadores Customizados

### Password Forte
```tsx
import { Validators } from '@/utils';

{
  password: {
    required: 'Senha obrigatória',
    custom: Validators.passwordStrength
  }
}
```

### Valores entre Min/Max
```tsx
{
  quantity: {
    required: 'Quantidade obrigatória',
    custom: Validators.between(1, 1000)
  }
}
```

### Campos que Correspondem
```tsx
const form = useForm(
  { password: '', confirmPassword: '' },
  {
    password: CommonRules.password,
    confirmPassword: {
      required: 'Confirmação obrigatória',
      custom: Validators.match(form.values.password, 'Senhas não correspondem')
    }
  }
);
```

### Regex Personalizado
```tsx
{
  sku: {
    required: 'SKU obrigatório',
    pattern: {
      value: /^[A-Z]{3}-\d{6}$/,
      message: 'Formato: ABC-123456'
    }
  }
}
```

## Sanitizadores de Input

Transforme automaticamente o valor enquanto o usuário digita:

```tsx
import { Sanitizers } from '@/utils';

// CPF com máscara automática
<Input
  {...getFieldProps('cpf')}
  onChangeText={(value) => {
    setFieldValue('cpf', Sanitizers.cpf(value));
  }}
/>

// Telefone formatado
<Input
  {...getFieldProps('phone')}
  onChangeText={(value) => {
    setFieldValue('phone', Sanitizers.phone(value));
  }}
/>

// Moeda formatada
<Input
  {...getFieldProps('price')}
  onChangeText={(value) => {
    setFieldValue('price', Sanitizers.currency(value));
  }}
/>
```

## Validadores Disponíveis

- `Validators.email` - Valida email
- `Validators.phone` - Valida telefone brasileiro
- `Validators.cpf` - Valida CPF
- `Validators.cnpj` - Valida CNPJ
- `Validators.password` - Valida senha robusta
- `Validators.url` - Valida URL
- `Validators.positive` - Valida números positivos
- `Validators.integer` - Valida números inteiros
- `Validators.creditCard` - Valida cartão de crédito
- `Validators.minValue(n)` - Valor mínimo
- `Validators.maxValue(n)` - Valor máximo
- `Validators.between(min, max)` - Entre dois valores
- `Validators.minLength(n)` - Comprimento mínimo
- `Validators.maxLength(n)` - Comprimento máximo
- `Validators.match(value)` - Corresponde outro campo
- `Validators.contains(str)` - Contém substring

## Sanitizadores Disponíveis

- `Sanitizers.phone` - Formata telefone com máscara
- `Sanitizers.cpf` - Formata CPF: 123.456.789-10
- `Sanitizers.cnpj` - Formata CNPJ: 12.345.678/0001-90
- `Sanitizers.currency` - Formata como moeda: R$ 1.234,56
- `Sanitizers.uppercase` - Converte para MAIÚSCULAS
- `Sanitizers.lowercase` - Converte para minúsculas
- `Sanitizers.trim` - Remove espaços

## API Completa do useForm

```tsx
const {
  // Estado
  form,              // Estado completo { fieldName: { value, error, touched } }
  values,            // { fieldName: value }
  errors,            // { fieldName: error || null }
  
  // Métodos
  getFieldProps,     // Retorna props para Input: { value, error, onChangeText, onBlur }
  setFieldValue,     // Muda valor do campo
  setFieldTouched,   // Marca campo como tocado (mostra erros)
  setFieldError,     // Define erro customizado
  validate,          // Valida TODOS os campos, retorna boolean
  reset,             // Volta aos valores iniciais
  
  // Flags
  isValid,           // true se sem erros
  isDirty,           // true se algum campo foi modificado
} = useForm(initialValues, rules, onSubmit);
```

## Exemplo Completo: Formulário de Registro

```tsx
import { useForm, CommonRules } from '@/hooks';
import { Validators } from '@/utils';
import { Input, Button, Card } from '@/components';
import { useToast } from '@/components/Toast';

export function RegisterScreen() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const { getFieldProps, validate, values } = useForm(
    {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
    {
      fullName: {
        required: 'Nome completo obrigatório',
        minLength: { value: 3, message: 'Mínimo 3 caracteres' },
      },
      email: CommonRules.email,
      phone: CommonRules.phone,
      password: {
        required: 'Senha obrigatória',
        custom: Validators.passwordStrength,
      },
      confirmPassword: {
        required: 'Confirmação obrigatória',
        custom: Validators.match(values.password, 'Senhas não correspondem'),
      },
    }
  );

  const handleRegister = async () => {
    if (!validate()) {
      toast.error('Preencha os campos corretamente');
      return;
    }

    setLoading(true);
    try {
      // API call
      await registerUser(values);
      toast.success('Usuário registrado com sucesso!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Input 
        label="Nome Completo"
        placeholder="João Silva"
        {...getFieldProps('fullName')}
      />
      
      <Input 
        label="Email"
        type="email"
        placeholder="joao@email.com"
        {...getFieldProps('email')}
      />
      
      <Input 
        label="Telefone"
        placeholder="(11) 98765-4321"
        {...getFieldProps('phone')}
      />
      
      <Input 
        label="Senha"
        type="password"
        placeholder="SenhaForte123"
        {...getFieldProps('password')}
        helperText="Min. 8 chars, maiúsc, minúsc, números"
      />
      
      <Input 
        label="Confirmar Senha"
        type="password"
        placeholder="SenhaForte123"
        {...getFieldProps('confirmPassword')}
      />
      
      <Button 
        label="Registrar"
        loading={loading}
        onPress={handleRegister}
        fullWidth
      />
    </ScrollView>
  );
}
```

## Boas Práticas

1. **Use CommonRules quando possível** - Validadores pré-configurados
2. **Combine múltiplos validadores** - Use `custom` para lógica complexa
3. **Forneça mensagens claras** - Usuários entendem o que está errado
4. **Sanitize ao digitar** - Formatação automática melhora UX
5. **Valide ao focar fora do campo** - Use `onBlur` para não incomodar
6. **Valide ao submeter** - Use `validate()` antes de enviar

## Troubleshooting

**Campos não atualizam:**
- Certifique-se de usar `getFieldProps()` ou spread manual das props

**Erros não desaparecem:**
- Erros aparecem após `setFieldTouched`. Toque o campo novamente.

**Validação custom não funciona:**
- Certifique-se que retorna `null` (válido) ou `"erro"` (inválido)

**Match não funciona:**
- Use `form.values.otherField` ao invés de `values.otherField`
