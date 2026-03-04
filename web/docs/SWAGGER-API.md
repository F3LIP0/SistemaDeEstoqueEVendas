# 📚 DOCUMENTAÇÃO API - SWAGGER/OpenAPI 3.0

## 1. Arquivo OpenAPI YAML

Salve como `docs/openapi.yaml`:

```yaml
openapi: 3.0.0

info:
  title: Fluxa API
  description: |
    API RESTful para gerenciamento de estoque, vendas e ponto de presença.
    
    ## Autenticação
    Todos os endpoints (exceto `/login`) requerem JWT no header:
    ```
    Authorization: Bearer <token>
    ```
    
    ## Rate Limiting
    - Máximo 100 requisições por minuto por IP
    - Headers de rate limit inclusos na resposta
    
    ## Status Codes
    - 200: OK
    - 201: Created
    - 400: Bad Request
    - 401: Unauthorized
    - 403: Forbidden
    - 404: Not Found
    - 409: Conflict
    - 500: Internal Server Error
    
  version: 2.0.0
  contact:
    name: Suporte API
    email: api-support@empresa.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: http://localhost:3000/api
    description: Desenvolvimento local
  - url: https://api.empresa.com/api
    description: Produção

tags:
  - name: Autenticação
    description: Endpoints de login/logout
  - name: Usuários
    description: Gerenciamento de usuários (ADMIN)
  - name: Produtos
    description: CRUD de produtos (MANAGER+)
  - name: Vendas
    description: Registro e consulta de vendas (SELLER+)
  - name: Ponto
    description: Controle de presença (EMPLOYEE+)
  - name: Dashboard
    description: Estatísticas e KPIs (TODOS)
  - name: Movimentações
    description: Controle de estoque (MANAGER+)
  - name: Health
    description: Status do sistema

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
          example: 1
        email:
          type: string
          format: email
          example: joao@empresa.com
        usuario:
          type: string
          example: joao_silva
        nome:
          type: string
          example: João Silva
        role_id:
          type: integer
          enum: [1, 2, 3]
          description: "1=Employee, 2=Manager, 3=Admin"
          example: 2
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time
      required:
        - email
        - usuario
        - nome
        - role_id

    Produto:
      type: object
      properties:
        id:
          type: integer
          example: 10
        sku:
          type: string
          uniqueItems: true
          example: "NB001"
        nome:
          type: string
          example: "Notebook Dell"
        categoria_id:
          type: integer
          example: 1
        marca_id:
          type: integer
          example: 2
        unidade_id:
          type: integer
          example: 1
        preco_custo:
          type: number
          format: decimal
          example: 1500.00
        preco_venda:
          type: number
          format: decimal
          example: 2500.00
        estoque_atual:
          type: integer
          example: 15
        estoque_minimo:
          type: integer
          example: 5
        estoque_maximo:
          type: integer
          example: 50
        ativo:
          type: boolean
          example: true
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    Venda:
      type: object
      properties:
        id:
          type: integer
          example: 123
        user_id:
          type: integer
          example: 1
        customer_id:
          type: integer
          example: 5
        data_venda:
          type: string
          format: date
          example: "2026-01-15"
        total:
          type: number
          format: decimal
          example: 5000.00
        lucro:
          type: number
          format: decimal
          example: 1000.00
        status:
          type: string
          enum: [ativa, cancelada]
          example: "ativa"
        itens:
          type: array
          items:
            type: object
            properties:
              produto_id:
                type: integer
              quantidade:
                type: integer
              preco_unitario:
                type: number
              subtotal:
                type: number

    Erro:
      type: object
      properties:
        success:
          type: boolean
          example: false
        message:
          type: string
          example: "Produto não encontrado"
        error:
          type: string
          example: "NOT_FOUND"
        details:
          type: object

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  responses:
    UnauthorizedError:
      description: Token inválido ou expirado
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Erro'
    ForbiddenError:
      description: Permissão insuficiente
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Erro'
    NotFoundError:
      description: Recurso não encontrado
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Erro'
    ConflictError:
      description: Conflito (email/SKU duplicado)
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Erro'

paths:
  /login:
    post:
      tags:
        - Autenticação
      summary: Autenticar usuário
      description: Realiza login e retorna JWT token válido por 24h
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                  example: admin@empresa.com
                senha:
                  type: string
                  format: password
                  example: admin123
              required:
                - email
                - senha
      responses:
        '200':
          description: Login bem-sucedido
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  token:
                    type: string
                    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  user:
                    $ref: '#/components/schemas/User'
        '400':
          description: Email ou senha inválidos
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Erro'

  /usuarios:
    get:
      tags:
        - Usuários
      summary: Listar usuários
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
      responses:
        '200':
          description: Lista de usuários
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  pagination:
                    type: object
                    properties:
                      page:
                        type: integer
                      limit:
                        type: integer
                      total:
                        type: integer
        '401':
          $ref: '#/components/responses/UnauthorizedError'

    post:
      tags:
        - Usuários
      summary: Criar novo usuário (ADMIN)
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                usuario:
                  type: string
                nome:
                  type: string
                senha:
                  type: string
                  format: password
                role_id:
                  type: integer
                  enum: [1, 2, 3]
              required:
                - email
                - usuario
                - nome
                - senha
                - role_id
      responses:
        '201':
          description: Usuário criado
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    $ref: '#/components/schemas/User'
        '409':
          $ref: '#/components/responses/ConflictError'
        '403':
          $ref: '#/components/responses/ForbiddenError'

  /usuarios/{id}:
    get:
      tags:
        - Usuários
      summary: Obter usuário por ID
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: Dados do usuário
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    $ref: '#/components/schemas/User'
        '404':
          $ref: '#/components/responses/NotFoundError'

    put:
      tags:
        - Usuários
      summary: Atualizar usuário (ADMIN)
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                nome:
                  type: string
                email:
                  type: string
                usuario:
                  type: string
                role_id:
                  type: integer
      responses:
        '200':
          description: Usuário atualizado
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    $ref: '#/components/schemas/User'

    delete:
      tags:
        - Usuários
      summary: Deletar usuário (ADMIN)
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: Usuário deletado
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  message:
                    type: string

  /productos:
    get:
      tags:
        - Produtos
      summary: Listar produtos
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
        - name: limit
          in: query
          schema:
            type: integer
        - name: categoria_id
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: Lista de produtos
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Produto'

    post:
      tags:
        - Produtos
      summary: Criar novo produto (MANAGER+)
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Produto'
      responses:
        '201':
          description: Produto criado
        '409':
          $ref: '#/components/responses/ConflictError'

  /productos/{id}:
    get:
      tags:
        - Produtos
      summary: Obter produto por ID
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: Dados do produto

    put:
      tags:
        - Produtos
      summary: Atualizar produto (MANAGER+)
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: Produto atualizado

    delete:
      tags:
        - Produtos
      summary: Deletar produto (ADMIN)
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: Produto deletado

  /vendas:
    get:
      tags:
        - Vendas
      summary: Listar vendas
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
        - name: data_inicio
          in: query
          schema:
            type: string
            format: date
        - name: data_fim
          in: query
          schema:
            type: string
            format: date
      responses:
        '200':
          description: Lista de vendas

    post:
      tags:
        - Vendas
      summary: Registrar nova venda (SELLER+)
      security:
        - bearerAuth: []
      responses:
        '201':
          description: Venda registrada

  /ponto/entrada:
    post:
      tags:
        - Ponto
      summary: Registrar entrada de ponto
      security:
        - bearerAuth: []
      responses:
        '201':
          description: Entrada registrada

  /dashboard:
    get:
      tags:
        - Dashboard
      summary: Obter KPIs do dashboard
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Estatísticas e KPIs

  /health:
    get:
      tags:
        - Health
      summary: Status do sistema
      responses:
        '200':
          description: Sistema operacional
```

---

## 2. Interface Swagger UI

Para visualizar a documentação interativa, instale o Swagger UI:

```bash
npm install swagger-ui-express
```

Adicione ao `backend.js`:

```javascript
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const swaggerDocument = YAML.load('./docs/openapi.yaml');

// Antes de other routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
```

**Acesso:** http://localhost:3000/api-docs

---

## 3. Exemplos de Requisição e Resposta

### 3.1 Login

**Request:**
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empresa.com",
    "senha": "admin123"
  }'
```

**Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBlbXByZXNhLmNvbSIsInJvbGVfaWQiOjMsImlhdCI6MTY3MzY3ODAwMCwiZXhwIjoxNjczNzY0NDAwfQ.XXX",
  "user": {
    "id": 1,
    "email": "admin@empresa.com",
    "usuario": "admin",
    "nome": "Administrador",
    "role_id": 3,
    "created_at": "2026-01-10T10:00:00Z",
    "updated_at": "2026-01-10T10:00:00Z"
  }
}
```

### 3.2 Criar Produto

**Request:**
```bash
curl -X POST http://localhost:3000/api/productos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGci..." \
  -d '{
    "sku": "NB001",
    "nome": "Notebook Dell",
    "categoria_id": 1,
    "marca_id": 2,
    "unidade_id": 1,
    "preco_custo": 1500.00,
    "preco_venda": 2500.00,
    "estoque_minimo": 5,
    "estoque_maximo": 50
  }'
```

**Response (201):**
```json
{
  "success": true,
  "message": "Produto criado com sucesso",
  "data": {
    "id": 10,
    "sku": "NB001",
    "nome": "Notebook Dell",
    "categoria_id": 1,
    "marca_id": 2,
    "unidade_id": 1,
    "preco_custo": 1500.00,
    "preco_venda": 2500.00,
    "estoque_atual": 0,
    "estoque_minimo": 5,
    "estoque_maximo": 50,
    "ativo": true,
    "created_at": "2026-01-15T14:32:00Z"
  }
}
```

### 3.3 Listar Produtos

**Request:**
```bash
curl -X GET "http://localhost:3000/api/productos?page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGci..."
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "sku": "MS001",
      "nome": "Mouse Logitech",
      "categoria": "Periféricos",
      "preco_venda": 45.00,
      "estoque_atual": 2,
      "status": "CRÍTICO"
    },
    {
      "id": 2,
      "sku": "KB001",
      "nome": "Teclado Mecânico",
      "categoria": "Periféricos",
      "preco_venda": 150.00,
      "estoque_atual": 8,
      "status": "OK"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 234,
    "totalPages": 24
  }
}
```

### 3.4 Erro - Email Duplicado

**Request:**
```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGci..." \
  -d '{
    "email": "admin@empresa.com",
    "usuario": "novo_admin",
    "nome": "Novo Admin",
    "senha": "123456",
    "role_id": 3
  }'
```

**Response (409):**
```json
{
  "success": false,
  "message": "Email já está em uso",
  "error": "EMAIL_ALREADY_EXISTS",
  "details": {
    "field": "email",
    "value": "admin@empresa.com"
  }
}
```

---

## 4. Guia de Testes com Postman

### 4.1 Importar Coleção

1. Abra Postman
2. File → Import
3. Cole este JSON ou selecione `openapi.yaml`
4. Coleção é criada automaticamente

### 4.2 Configurar Variáveis Globais

1. Clique em "Environment" (engrenagem)
2. Crie novo environment "Local"
3. Adicione variáveis:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| base_url | http://localhost:3000/api | http://localhost:3000/api |
| token | (deixe vazio) | (será preenchido após login) |
| admin_email | admin@empresa.com | admin@empresa.com |
| admin_password | admin123 | admin123 |

### 4.3 Teste de Login

1. Clique em "Login"
2. Certifique-se de que é POST
3. URL: `{{base_url}}/login`
4. Body → raw → JSON:
   ```json
   {
     "email": "{{admin_email}}",
     "senha": "{{admin_password}}"
   }
   ```
5. Clique em "Send"
6. Na aba "Tests", adicione script:
   ```javascript
   if (pm.response.code === 200) {
     pm.environment.set("token", pm.response.json().token);
   }
   ```
7. O token é salvo automaticamente

### 4.4 Teste de Criar Produto

1. Clique em "Criar Produto"
2. URL: `{{base_url}}/productos`
3. Headers:
   - Authorization: `Bearer {{token}}`
4. Body:
   ```json
   {
     "sku": "TEST-001",
     "nome": "Produto Teste",
     "categoria_id": 1,
     "marca_id": 1,
     "unidade_id": 1,
     "preco_custo": 100,
     "preco_venda": 150,
     "estoque_minimo": 5,
     "estoque_maximo": 50
   }
   ```
5. Clique em "Send"

---

## 5. Checklist de Cobertura API

- [ ] Login retorna JWT válido
- [ ] Token expira após 24h
- [ ] Endpoints sem autenticação retornam 401
- [ ] Permissões por role funcionam (403 quando negado)
- [ ] Email duplicado retorna 409
- [ ] SKU duplicado retorna 409
- [ ] Validações de preço (venda >= custo)
- [ ] Validações de estoque (mín <= máx)
- [ ] Paginação funciona (limit, page)
- [ ] Filtros por data funcionam
- [ ] CORS preflight funciona
- [ ] Rate limiting ativo
- [ ] Erros retornam formato consistente
- [ ] Timestamps retornam ISO 8601

---

**Documentação Atualizada:** 15 de Janeiro de 2026  
**Versão API:** 2.0.0  
**Status:** ✅ Completo
