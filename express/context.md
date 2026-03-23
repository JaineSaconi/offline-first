# Context — Backend Express + SQLite

## O que era antes

O servidor Express era um único arquivo (`index.js`) na raiz da pasta com:
- Um array de usuários mockados em memória
- Um único endpoint `GET /infos` que retornava esse array
- Sem banco de dados, sem validação, sem estrutura de pastas

## O que foi criado

A pasta `express/` foi completamente reestruturada para servir como **fonte de verdade remota**
do app React Native offline-first, implementando CRUD de usuários e sincronização bidirecional
via Outbox Pattern.

---

## Arquivos novos e o que cada um faz

### `db/migrations/001_users.sql`

Cria a tabela `users` com os campos:
- `id` — UUID gerado pelo app (chave primária)
- `name` — nome do usuário
- `createdAt` / `updatedAt` — timestamps em milissegundos Unix
- `deleted` — soft delete: `0` = ativo, `1` = deletado. Necessário para que o pull incremental
  consiga informar ao app que um registro foi removido no servidor
- `version` — incrementado a cada UPDATE, usado para detectar conflitos de sincronização

Cria dois índices:
- `idx_users_updatedAt` — usado no `GET /sync/pull?since=X` para filtrar registros por data
- `idx_users_deleted` — usado nas listagens que excluem registros deletados

### `db/migrations/002_outbox_log.sql`

Cria a tabela `outbox_log` para auditoria de todas as operações recebidas via `POST /sync/push`.
Registra `status` de cada operação: `OK`, `CONFLICT` ou `ERROR`.
Permite rastrear o histórico de sincronização e depurar conflitos.

---

### `src/index.js`

Entry point do servidor. Responsabilidades:
- Carrega variáveis de ambiente via `dotenv`
- Importa o app Express e o banco de dados
- Inicia o servidor na porta configurada em `PORT` (padrão: 3000)
- Roda um `setInterval` a cada 30 segundos que força o checkpoint do WAL quando o arquivo
  `.db-wal` ultrapassa 10 MB. O `.unref()` garante que esse timer não mantém o processo
  Node.js vivo caso o servidor seja encerrado

### `src/app.js`

Configura o Express com todos os middlewares e rotas. Em ordem de registro:
1. `app.disable('x-powered-by')` — remove o header que anuncia que o servidor usa Express
2. `helmet()` — define headers HTTP de segurança (CSP, X-Frame-Options, etc.)
3. CORS manual — permite apenas a origem configurada em `ALLOWED_ORIGIN`
4. Rate limiter — máximo de 100 requisições por IP a cada 15 minutos em todas as rotas `/api/`
5. `express.json({ limit: '50kb' })` — faz o parse do body JSON limitando o tamanho para
   prevenir ataques de body inflado
6. Logger de requisições — loga método e URL de cada request recebido
7. Rotas — `GET|POST|PUT|DELETE /api/users` e `POST /api/sync/push` + `GET /api/sync/pull`
8. Handler 404 — retorna JSON em vez de HTML para rotas inexistentes
9. `errorHandler` — middleware global de erros com 4 parâmetros, registrado por último

### `src/db/db.js`

Cria e configura a conexão com o banco SQLite usando `better-sqlite3`. Aplica três pragmas
na inicialização:
- `journal_mode = WAL` — permite leituras simultâneas sem bloquear escritas
- `foreign_keys = ON` — ativa chaves estrangeiras (desativadas por padrão no SQLite)
- `synchronous = NORMAL` — melhora throughput sem risco relevante de corrupção

Contém a função `runMigrations()` que:
- Cria a tabela `_migrations` se não existir
- Lê os arquivos `.sql` de `db/migrations/` em ordem alfabética
- Aplica apenas os que ainda não foram registrados na tabela `_migrations`
- Isso garante que migrations rodam uma única vez, mesmo reiniciando o servidor

---

### `src/controllers/users.controller.js`

Implementa as quatro operações de CRUD:

| Função | Endpoint | Comportamento |
|---|---|---|
| `list` | `GET /api/users` | Retorna usuários com `deleted = 0`. Aceita `?since=<ms>` para retornar apenas os modificados após o timestamp |
| `create` | `POST /api/users` | Insere novo usuário. Retorna `{ id, version: 1 }` |
| `update` | `PUT /api/users/:id` | Atualiza `name` e `updatedAt`, incrementa `version`. Retorna `{ id, version }` |
| `remove` | `DELETE /api/users/:id` | Soft delete: marca `deleted = 1`, incrementa `version`. Retorna `{ ok: true }` |

Todos os prepared statements são declarados fora das funções para serem compilados uma única
vez e reutilizados em chamadas subsequentes.

### `src/controllers/sync.controller.js`

O controller mais crítico do sistema. Implementa dois endpoints:

**`push`** — recebe o lote do outbox do app e processa em **transação única** (`db.transaction`).
Para cada item do batch:
1. Busca o registro existente no banco
2. Se o `updatedAt` do item for menor que o `updatedAt` do servidor → conflito detectado.
   Registra no `outbox_log` com `status: CONFLICT` e retorna `serverData` para o app aplicar
3. Se `type = UPSERT` → faz INSERT OR REPLACE e incrementa `version`
4. Se `type = DELETE` → soft delete e incrementa `version`
5. Registra no `outbox_log` com `status: OK`

Como é uma transação, se qualquer item falhar por erro interno, **todos são revertidos**.

**`pull`** — retorna todos os registros com `updatedAt > since`, incluindo os deletados
(`deleted = 1`), para que o app saiba quais registros remover localmente.

---

### `src/routes/users.js`

Mapeia os endpoints de usuários para os controllers, aplicando a validação Zod antes de
cada operação de escrita:
- `GET /` → `users.list`
- `POST /` → validação `userCreateSchema` → `users.create`
- `PUT /:id` → validação `userUpdateSchema` → `users.update`
- `DELETE /:id` → `users.remove`

### `src/routes/sync.js`

Mapeia os endpoints de sincronização:
- `POST /push` → validação `pushSchema` → `sync.push`
- `GET /pull` → `sync.pull`

---

### `src/middleware/validate.js`

Define os schemas Zod e o middleware `validate(schema)`.

Schemas disponíveis:
- `userCreateSchema` — valida criação de usuário: `id` (UUID), `name` (1–255 chars),
  `createdAt` e `updatedAt` (inteiros)
- `userUpdateSchema` — valida atualização: `name` opcional, `updatedAt` obrigatório
- `pushSchema` — valida o batch do push: array de 1 a 50 itens, cada um com
  `outboxId` (UUID), `entityId` (UUID), `type` (UPSERT ou DELETE) e `payload` opcional

O middleware adiciona os dados validados em `req.validatedBody` e retorna `400` com o
detalhe do erro caso a validação falhe.

### `src/middleware/error-handler.js`

Middleware global de erros com 4 parâmetros (assinatura que o Express usa para identificar
handlers de erro). Mapeia códigos de erro do SQLite para status HTTP:
- `SQLITE_CONSTRAINT_UNIQUE` → 409
- `SQLITE_CONSTRAINT_NOTNULL` → 400
- `SQLITE_CONSTRAINT_CHECK` → 400

Em produção (`NODE_ENV=production`) nunca expõe a stack trace — retorna mensagem genérica.

### `src/utils/logger.js`

Configura o `pino` como logger. Em desenvolvimento usa `pino-pretty` com cores no terminal.
Em produção gera JSON puro, compatível com agregadores de log.

---

## Arquivos modificados

### `package.json`

- `main` atualizado de `index.js` para `src/index.js`
- Scripts:
  - `start` — roda com `NODE_ENV=production`
  - `dev` — roda com nodemon e `NODE_ENV=development` (Linux/Mac)
  - `dev:win` — mesma coisa para Windows
- Dependências adicionadas: `better-sqlite3`, `dotenv`, `helmet`, `express-rate-limit`,
  `zod`, `pino`, `pino-pretty`
- Express rebaixado de `^5.x` para `^4.x` (versão LTS estável)
- devDependencies: `nodemon`

### `index.js` (raiz)

Removido. Substituído por `src/index.js`.

---

## Arquivos novos de configuração

| Arquivo | Descrição |
|---|---|
| `.env.example` | Template público com as variáveis necessárias. Deve ser commitado |
| `.gitignore` | Ignora `.env`, arquivos do banco (`*.db`, `*.db-wal`, `*.db-shm`) e `node_modules/` |
| `docker-compose.yml` | Sobe a API em container com bind mount seguro da pasta `db/` |
| `SETUP.md` | Guia de instalação e execução da API |

---

## Fluxo de sincronização implementado

```
App (offline)
└─ escreve localmente + insere no outbox (PENDING)

App (reconecta)
├─ POST /api/sync/push { items: outbox[PENDING] }
│   ├─ status "ok"       → item sincronizado, version atualizada
│   └─ status "conflict" → app aplica serverData localmente (last-write-wins)
│
└─ GET /api/sync/pull?since=LAST_SYNC_AT
    ├─ deleted = 0 → app faz upsert local
    └─ deleted = 1 → app remove localmente
```
