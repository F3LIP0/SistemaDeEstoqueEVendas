# fluxa

Sistema de gestão de estoque e vendas com dois módulos:

- Web: backend Node.js + frontend HTML/CSS/JS
- Android: app React Native (Expo)

## Estrutura

- `web/`: API, interface web e scripts de teste
- `android/`: aplicativo mobile

## Requisitos

- Node.js 18+
- npm

## Execução Rápida

### Web

```bash
cd web
npm install
npm run start:all
```

Endpoints locais:

- Frontend: `http://localhost:8080`
- Backend/API: `http://localhost:3000`

### Android

```bash
cd android
npm install
npm start
```

## Testes

### Web

```bash
cd web
npm test
```

Observação: os testes web dependem do backend ativo em `http://localhost:3000`.

### Android

```bash
cd android
npm test
npm run typecheck
```

## Documentação

### Web

- Guia principal: `web/README.md`
- Arquitetura: `web/docs/ARQUITETURA.md`
- Requisitos: `web/docs/REQUISITOS.md`
- API: `web/docs/SWAGGER-API.md`

### Android

- Guia inicial: `android/START.md`
- Resumo geral: `android/00-START-HERE.md`
- Arquitetura: `android/ARCHITECTURE.md`
- Deploy: `android/DEPLOYMENT.md`
