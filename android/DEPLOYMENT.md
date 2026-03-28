# 🚀 Deployment - Play Store & App Store

Guia completo para publicar o app em produção.

## Pre-Deployment Checklist

- [ ] Todas as telas testadas manualmente
- [ ] Não há console.errors em production
- [ ] Versão atualizada em `app.json`
- [ ] Ícones e splash screens configurados
- [ ] Privacidade e ToS preparados
- [ ] Screenshots prontas para store
- [ ] Descrição da app escrita
- [ ] Testes automatizados passando
- [ ] Performance otimizada
- [ ] Sem chaves/tokens hardcoded

## Setup com EAS (Expo Application Services)

### Instalação

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurar projeto (cria eas.json)
eas build:configure
```

### Configuração (eas.json)

```json
{
  "build": {
    "development": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "aab" },
      "ios": { "simulator": true }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccount": "path/to/service-account.json"
      },
      "ios": {
        "appleId": "your-apple-id@example.com"
      }
    }
  }
}
```

## Android - Google Play Store

### Requisitos

1. **Google Play Console Account**
   - Acesso em: https://play.google.com/console
   - Taxa: $25 uma vez

2. **Keystore (Chave de Assinatura)**
   ```bash
   # Gerar chave (primeira vez)
   eas build --platform android --profile production --create-service-account
   
   # Ou restore de arquivo existente
   eas build --platform android --profile production
   ```

3. **App Bundle (AAB)**
   ```bash
   # Build optimizado para Play Store
   eas build --platform android --profile production
   ```

### Publicar no Play Store

#### 1. Primeira Publicação

```bash
# Build e upload automático
eas submit --platform android --latest
```

Será solicitado:
- Tracks (internal, alpha, beta, production)
- Release notes

#### 2. Configuração na Console

1. Acesse [Google Play Console](https://play.google.com/console)
2. Crie nova app
3. Preencha:
   - **Nome da app**: Fluxa
   - **Categoria**: Business
   - **Idiomas**: Português, English
   - **Email de contato**

4. Vá para "Releases"
   - Selecione "Production"
   - Clique "New Release"
   - Selecione AAB gerado

5. Preencha:
   - **Release notes**: "Versão 1.0.0 - Lançamento"
   - **Países**: Selecione todos
   - **Revisar conteúdo**

6. Enviar para análise

### Versioning Android

Em `app.json`:
```json
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "versionCode": 1
    }
  }
}
```

- `version`: Semântico (1.0.0)
- `versionCode`: Inteiro incremental (1, 2, 3...)
- **Deve incrementar a cada build**

### Prints para Play Store

Tamanhos requeridos:
- Phone (3.5"): 1080x1920 px
- Tablet (7"): 1440x2560 px

Mínimo 2, máximo 8 imagens

Recomendação:
1. Login
2. Dashboard
3. Produtos
4. Criar venda
5. Offline badge

## iOS - App Store

### Requisitos

1. **Apple Developer Account**
   - Acesso em: https://developer.apple.com
   - Taxa: $99/ano

2. **Xcode Installed**
   ```bash
   # Verificar/instalar
   xcode-select --install
   ```

3. **Provisioning Profile**
   - Gerado automaticamente por EAS
   - Ou manual no Developer Portal

### Publicar no App Store

#### 1. Preparar Certificados

```bash
# EAS gerencia automático
eas build --platform ios --profile production

# Primeira vez: será solicitado criar certificates
```

#### 2. Build para App Store

```bash
# Build otimizado (leva ~20 min)
eas build --platform ios --profile production

# Download do arquivo .ipa
```

#### 3. Enviar para App Store Connect

```bash
# Upload automático
eas submit --platform ios --latest
```

Será solicitado:
- Apple ID
- Senha app-specific (gerar em 2FA)

#### 4. Configurar na App Store Connect

1. Acesse [App Store Connect](https://appstoreconnect.apple.com)
2. Crie nova app:
   - **Name**: Fluxa
   - **Bundle ID**: com.empresa.fluxa (configurar em app.json)
   - **Category**: Business
   - **Content Rights**: Select all

3. Vá para "Builds"
   - Build deve aparecer automaticamente
   - Aguarde processamento (5-20 min)

4. Vá para "App Information"
   - Preencha descrição
   - Selecione categoria
   - Adicione keywords

5. Vá para "Pricing and Availability"
   - Grátis ou pago
   - Países

6. Clique "Submit for Review"

#### 5. Revisão da Apple

Tempo típico: 24-48 horas

Se rejeitado:
- Corrigir issues
- Reenviar

## Versionamento

### Semântico

```
v1.2.3
  ↑ ↑ ↑
  | | └─ PATCH (bug fixes)
  | └─── MINOR (features)
  └───── MAJOR (breaking changes)
```

Exemplos:
- 1.0.0 - Release inicial
- 1.0.1 - Bug fix
- 1.1.0 - Nova feature
- 2.0.0 - Redesign completo

### Em App.json

```json
{
  "expo": {
    "version": "1.0.0",
    "android": { "versionCode": 1 },
    "ios": { "buildNumber": "1" }
  }
}
```

Incrementar:
- **version**: Sempre
- **versionCode**: +1 cada build Android
- **buildNumber**: +1 cada build iOS

## Environment de Produção

### App.json Production

```json
{
  "expo": {
    "name": "Fluxa",
    "slug": "fluxa",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png"
      },
      "versionCode": 1,
      "package": "com.empresa.fluxa"
    },
    "ios": {
      "supportsTabletMode": true,
      "bundleIdentifier": "com.empresa.fluxa",
      "buildNumber": "1"
    }
  }
}
```

### Variáveis de Ambiente

```bash
# .env.production
EXPO_PUBLIC_API_URL=https://api-prod.example.com/api
EXPO_PUBLIC_APP_ENV=production
```

No código:
```typescript
// src/config.ts
const API_URL = process.env.EXPO_PUBLIC_API_URL;
```

### Build Production Script

```bash
#!/bin/bash

# Incrementar versão
npm version patch

# Build Android
eas build --platform android --profile production

# Build iOS
eas build --platform ios --profile production

# Aguardar e fazer download

# Submit ambos
eas submit --platform android --latest
eas submit --platform ios --latest

echo "Apps enviados para revisão!"
```

## Monitoramento em Produção

### Crash Reporting

```bash
npm install sentry-expo
```

Configurar em App.tsx:
```typescript
import * as Sentry from "sentry-expo";

Sentry.init({
  dsn: "https://your-dsn@sentry.io/project-id"
});
```

### Analytics

```bash
npm install react-native-firebase
```

Rastrear eventos importantes:
- Login/logout
- Criar venda
- Erro de sincronização
- Modo offline ativado

### Performance Monitoring

```typescript
import { PerformanceLogger } from '@/config/performance';

PerformanceLogger.mark('screen-load');
// Carregar dados...
PerformanceLogger.measure('Screen Load', 'screen-load');
```

## Troubleshooting

### Build falha

```bash
# Limparhache
eas build --platform android --profile production --clear-cache

# Ver detalhes
eas build --platform android --profile production --verbose
```

### App rejeitado na App Store

Causas comuns:
- Usando APIs privadas
- Não declarando permissões
- UI quebrada em iPad
- Crashing ao iniciar

Solução:
- Ver message de rejeição
- Corrigir issue
- Reenviar

### Build muito lento

Causas:
- Primeiro build é mais lento (+20 min)
- Problema com internet
- Server em manutenção

Solução:
- Tentar depois
- Verificar status: https://status.expo.io

## Checklist Final

- [ ] App.json versionado corretamente
- [ ] Ícones 1024x1024 PNG
- [ ] Splash screen 1242x2436
- [ ] Screenshots 1080x1920 (minimo 2, 5+)
- [ ] Descrição completa (50-80 chars)
- [ ] Body descrição clara (80-4000 chars)
- [ ] Keywords relevados (máximo 30)
- [ ] Privacy policy link válido
- [ ] Support email válido
- [ ] Nenhum hardcoded secret/token
- [ ] Sem console.log em release build
- [ ] Testes passando
- [ ] Performance otimizada

## Próximas Atualizações

```bash
# Preparar novo build
npm version minor  # ou patch/major

# Build e submit
eas build --platform android --profile production
eas submit --platform android --latest

eas build --platform ios --profile production
eas submit --platform ios --latest
```

## Referências

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)
