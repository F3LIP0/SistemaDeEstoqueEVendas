# 🆘 TROUBLESHOOTING & FAQ

**Soluções Rápidas**  
**Problema? Solução aqui!**

---

## 🔴 ERROS COMUNS

### ❌ "npm install" Falha

**Erro:**
```
npm ERR! code E404
npm ERR! 404 Not Found - GET https://registry.npmjs.org/...
```

**Solução:**
```bash
# 1. Limpe cache
npm cache clean --force

# 2. Delete node_modules
rm -rf node_modules
rm package-lock.json

# 3. Reinstale
npm install

# 4. Se ainda não funcionar:
npm install --legacy-peer-deps
```

---

### ❌ Testes Quebram

**Erro:**
```
TypeError: Cannot read property 'AsyncStorage' of undefined
ReferenceError: fetch is not defined
```

**Solução:**
```bash
# 1. Clear cache jest
npm test -- --clearCache

# 2. Rerun
npm test

# 3. Se problema persistir, verify jest.setup.js existe
# Veja: src/__tests__/jest.setup.js
```

---

### ❌ "Module not found" Error

**Erro:**
```
Cannot find module '@/components'
Cannot find module '@/hooks'
```

**Solução:**

1. Verifique tsconfig.json tem:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

2. Se não tem, adicione (depois rode `npm install`)

---

### ❌ Componentes não Renderizam

**Erro:**
```
Element type is invalid: expected object but got undefined
```

**Solução:**

1. Verifique import:
```tsx
// ✅ Correto
import { Button } from '@/components';

// ❌ Errado
import Button from '@/components/Button';
```

2. Verifique exports em [src/components/index.ts](src/components/index.ts):
```tsx
export { Button } from './Button';
export { Card } from './Card';
// ... etc
```

---

### ❌ Validação de Formulário Não Funciona

**Erro:**
```
errors.email é undefined
values não atualiza
```

**Solução:**

1. Verifique uso:
```tsx
// ✅ Correto
const { values, errors, getFieldProps } = useForm(
  { email: '', password: '' },
  { 
    email: CommonRules.email,
    password: CommonRules.password 
  }
);

// Use getFieldProps, NÃO value + onChangeText
<Input {...getFieldProps('email')} />

// ❌ Errado - não funciona assim:
<Input value={values.email} onChangeText={...} />
```

2. Verifique CommonRules importação:
```tsx
// ✅ Correto
import { CommonRules } from '@/utils';

// ❌ Errado
import CommonRules from '@/utils/validators';
```

---

### ❌ Offline Não Funciona

**Erro:**
```
useOfflineData sempre mostra isOffline: true
Cache persiste não mata
```

**Solução:**

1. Verifique AsyncStorage foi instalado:
```bash
npm install @react-native-async-storage/async-storage
```

2. Verifique uso:
```tsx
// ✅ Correto
const { data, isOffline } = useOfflineData(
  'unique-key',
  async () => await api.get('/products'),
  { ttl: 5 * 60 * 1000 }
);

// ❌ Errado - sem TTL pode não cachear
```

3. Para testar offline:
   - Desabilitou Wi-Fi e dados móveis
   - Abriu app
   - Dados devem vir do cache
   - Reabilite conexão
   - Dados devem sincronizar

---

### ❌ Toast Não Aparece

**Erro:**
```
toast.success() não mostra nada
useToast() undefined
```

**Solução:**

1. Verifique se App.tsx tem ToastProvider:
```tsx
// Em App.tsx
import { ToastProvider } from '@/components/Toast';

export default function App() {
  return (
    <ToastProvider>
      <AppNavigator />
    </ToastProvider>
  );
}
```

2. Verifique usa useToast inside ToastProvider:
```tsx
// ✅ Correto (inside App)
const { useToast } from '@/components/Toast';
const CustomScreen = () => {
  const toast = useToast(); // Funciona!
};

// ❌ Errado (outside App)
// Se usarToast ANTES de ToastProvider, falha
```

---

### ❌ Build Falha

**Erro:**
```
eas build falha
typechec erro
```

**Solução:**

```bash
# 1. Verify TypeScript errors
npx tsc --noEmit

# 2. Fix erros
# Geralmente é import wrong ou tipo missing

# 3. Try local build
npx eas build --platform android --local

# 4. Se ainda não funcionar, clean:
rm -rf node_modules
rm package-lock.json
npm install
npx eas build --platform android --local
```

---

## ❓ FAQ - PERGUNTAS COMUNS

### P: Como adicionar novo componente?

**R:**
```
1. Crie: src/components/MeuComp.tsx
2. Exporte em: src/components/index.ts
   export { MeuComp } from './MeuComp';
3. Use em qualquer tela:
   import { MeuComp } from '@/components';
```

---

### P: Como adicionar novo validador?

**R:**
```
1. Adicione em: src/utils/validators.ts
   export const MyValidator = (value): string | null => {
     if (invalid) return 'Mensagem de erro';
     return null; // Valid
   }

2. Use:
   const rules = { field: MyValidator };

3. Ou adicione em CommonRules:
   export const CommonRules = {
     email: ...,
     myValidator: MyValidator
   }
```

---

### P: Como fazer teste?

**R:**
```
1. Crie: src/__tests__/MyFeature.test.ts
2. Escreva:
   describe('MyFeature', () => {
     test('should work', () => {
       expect(true).toBe(true);
     });
   });
3. Rode:
   npm test
```

**Exemplos:**
- [Button.test.tsx](src/__tests__/components/Button.test.tsx)
- [validators.test.ts](src/__tests__/utils/validators.test.ts)
- [useForm.test.ts](src/__tests__/hooks/useForm.test.ts)

---

### P: Qual a estrutura de pasta ideal?

**R:**
```
src/
├── components/      ← UI reusable
├── hooks/          ← Custom hooks
├── screens/        ← Telas/Pages
├── services/       ← API, cache
├── utils/          ← Helpers
├── context/        ← AuthContext
├── types.ts        ← Tipos globais
├── config.ts       ← Config
└── theme/          ← Design tokens

__tests__/
├── components/     ← Componentes
├── hooks/          ← Custom hooks
└── utils/          ← Utils
```

---

### P: Como debugar?

**R:**

**Chrome DevTools:**
```
1. `npm start`
2. Abra Expo app no celular
3. Aperte `j` no terminal
4. Chrome abrirá DevTools
5. Console.log vira no Chrome console
```

**Debugger React Native:**
```
1. `npm start`
2. Pressione `d` no terminal
3. Selecione debugger
```

**Logs:**
```tsx
console.log('Data:', data);      // Chrome console
console.warn('Warning!');        // Orange warning
console.error('Error!');         // Red error
```

---

### P: Como testar offline?

**R:**

**No Simulador:**
```
Android:
1. Abra Android Emulator Settings
2. Ache network settings
3. Disable network
4. Teste app
5. Enable network
6. Verifique sync

iPhone:
1. Settings > Airplane Mode ON
2. Teste app
3. Airplane Mode OFF
4. Verifique sync
```

**No Dispositivo Real:**
```
1. Desabilite Wi-Fi e dados móveis
2. Abra app
3. Interaja com dados
4. Verifique toast "Offline"
5. Verifique dados em cache
6. Reabilite Internet
7. Verifique sincronização automática
```

---

### P: Como fazer deploy?

**R:**
```bash
# Automático
./scripts/deploy.sh patch  # versão 1.0.1

# Manual
1. Atualize version em package.json
   "version": "1.0.1"

2. Build
   eas build --platform android

3. Submit
   eas submit --platform android

4. Aguarde aprovação na Play Store
```

**Mais detalhes:** [DEPLOYMENT.md](DEPLOYMENT.md)

---

### P: Quais são os commits de git?

**R:**
```bash
# Seguir padrão:
git commit -m "feat: adicione novo componente Button"
git commit -m "fix: corrija validação de email"
git commit -m "docs: atualize README"
git commit -m "test: adicione testes para Modal"

# Types comuns:
feat:   Nova feature
fix:    Bug fix
docs:   Documentação
test:   Testes
style:  Formatação
refactor: Refatoração
```

---

### P: Qual versão de React Native?

**R:**
```json
{
  "dependencies": {
    "react": "18.3.1",
    "react-native": "0.81.5",
    "expo": "~54.0.0"
  }
}
```

Verifique em [package.json](package.json)

---

### P: Quanto tempo leva integração?

**R:**

```
Leitura & Setup:    2-3 horas
Integração:         3-5 horas por tela
Testes:            2-3 horas
Deploy:            1-2 horas

TOTAL:             ~20-30 horas
                   ~4-6 dias com 6h/dia
```

---

### P: Preciso de ajuda, quem contato?

**R:**

```
1. Leia a documentação
   ├─ 00-START-HERE.md  (visão geral)
   ├─ README.md         (quick start)
   ├─ ARCHITECTURE.md   (design)
   └─ Seu documento específico

2. Veja exemplos
   ├─ EXAMPLE_SCREEN.tsx (tela completa)
   ├─ src/__tests__/*.test.ts (testes)
   └─ CHEAT-SHEET.md (cópia/cola)

3. Se erro:
   ├─ Procure aqui em TROUBLESHOOTING
   ├─ Veja console.log output
   └─ Veja jest errors

4. Se não resolver:
   ├─ Abra GitHub issue
   ├─ Descreva o erro
   ├─ Cola o log
   └─ Anexe o código
```

---

## 🧰 TOOLKIT

### Comandos Rápidos

```bash
# Development
npm start              # Inicia Expo
npm test              # Rodaestes
npm test -- --watch  # Watch mode

# Build
eas build --platform android --local
eas build --platform ios --local

# Deploy
./scripts/deploy.sh patch    # 1.0.1
./scripts/deploy.sh minor    # 1.1.0
./scripts/deploy.sh major    # 2.0.0

# Limpeza
rm -rf node_modules
npm cache clean --force
npm install

# TypeScript check
npx tsc --noEmit
```

---

### Extensões VS Code Recomendadas

```
1. ES7+ React/Redux/React-Native snippets
2. Prettier - Code Formatter
3. ESLint
4. Thunder Client (para testar API)
5. Expo Tools (oficial)
```

---

### Checklists Finais

```
ANTES DE INTEGRAR:
☑ npm install funcionou?
☑ npm test passou?
☑ npm start abriu Expo?
☑ Leu ARCHITECTURE.md?
☑ Viu EXAMPLE_SCREEN.tsx?

ANTES DE DEPLOY:
☑ Todos testes passam?
☑ Sem console errors?
☑ Testou offline?
☑ Version bumped?
☑ CHANGELOG atualizado?

ANTES DE LIBERAR:
☑ Beta testing 7 dias?
☑ Feedback de usuários?
☑ Performance metrics OK?
☑ Sentry sem alertas?
```

---

## 🎯 REFERÊNCIA RÁPIDA

| Problema | Solução |
|----------|---------|
| npm install falha | `npm cache clean --force && rm -rf node_modules && npm install` |
| Testes quebram | `npm test -- --clearCache` |
| Módulo não found | Verifique tsconfig paths |
| Toast não aparece | App.tsx com ToastProvider |
| Validação não funciona | Use `getFieldProps`, não `value+onChange` |
| Offline não cachea | Verifique AsyncStorage |
| Build falha | `npx tsc --noEmit` para TypeScript errors |
| Componente undefined | Verifique export em index.ts |

---

## 📞 SUPORTE

**Recursos:**
- 📖 [README.md](README.md) - Começar
- 🏗️ [ARCHITECTURE.md](ARCHITECTURE.md) - Entender
- 📋 [CHECKLIST.md](CHECKLIST.md) - Planejar
- 💡 [CHEAT-SHEET.md](CHEAT-SHEET.md) - Copiar/Colar
- 🆘 [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Este arquivo!
- 🎨 [EXAMPLE_SCREEN.tsx](EXAMPLE_SCREEN.tsx) - Ver funcionando

**URLs Úteis:**
- [React Native Docs](https://reactnative.dev)
- [Expo Docs](https://docs.expo.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Jest Testing](https://jestjs.io)

---

**Sucesso! 🚀**

Qualquer dúvida, volte aqui!
