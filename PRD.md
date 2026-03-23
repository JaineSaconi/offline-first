# PRD — Backend Express + SQLite para Aplicativo Offline-First

**Data:** 2026-03-23
**Branch:** feat/version-1
**Referências:**
- [Express.js Best Practice Performance](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Offline-First Architecture — RxDB](https://rxdb.info/offline-first.html)
- [Introduction to Node.js](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)

---

## 1. Visão Geral

O aplicativo React Native já implementa o **Outbox Pattern** com persistência local em SQLite via `expo-sqlite`. O objetivo deste PRD é especificar a criação do **backend Node.js/Express com SQLite** que servirá como fonte de verdade remota, e alinhar o app para completar o ciclo de sincronização bidirecional.

A arquitetura segue o princípio **local-first**: o app escreve localmente sempre, enfileira na tabela `outbox`, e o `sync-engine` drena a fila enviando ao servidor. O servidor persiste em seu próprio SQLite e devolve o `serverVersion` para o cliente confirmar o sync.

---

## 2. Estrutura de Pastas do Backend

```
express/
├── src/
│   ├── index.js               # Entry point — instancia app e server
│   ├── app.js                 # Configura Express (middlewares, rotas)
│   ├── db/
│   │   ├── db.js              # Conexão SQLite (better-sqlite3)
│   │   └── migrations/
│   │       ├── 001_users.js   # Tabela users (espelho do app)
│   │       └── 002_outbox.js  # Tabela outbox_log (auditoria)
│   ├── routes/
│   │   ├── users.js           # GET /users, POST /users, DELETE /users/:id
│   │   ├── sync.js            # POST /sync/push, GET /sync/pull
│   │   └── infos.js           # GET /infos (mock — já existente)
│   ├── controllers/
│   │   ├── users.controller.js
│   │   └── sync.controller.js
│   ├── middleware/
│   │   ├── error-handler.js   # Middleware global de erros
│   │   ├── rate-limiter.js    # express-rate-limit (OWASP API3)
│   │   └── validate.js        # Validação de input (OWASP API6)
│   └── utils/
│       └── logger.js          # Pino logger
├── .env.example
├── package.json
└── README.md
```

---

## 3. Schema do Banco de Dados — Servidor

### 3.1 Tabela `users`
Espelho da tabela `todos` do app, com campos adicionais para controle de versão e conflito.

```sql
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY NOT NULL,
  name        TEXT NOT NULL,
  createdAt   INTEGER NOT NULL,
  updatedAt   INTEGER NOT NULL,
  deleted     INTEGER NOT NULL DEFAULT 0,
  version     INTEGER NOT NULL DEFAULT 1   -- serverVersion devolvido ao app
);

CREATE INDEX idx_users_updatedAt ON users(updatedAt);
CREATE INDEX idx_users_deleted   ON users(deleted);
```

### 3.2 Tabela `outbox_log`
Auditoria de todas as operações recebidas pelo servidor.

```sql
CREATE TABLE IF NOT EXISTS outbox_log (
  id          TEXT PRIMARY KEY NOT NULL,
  entity      TEXT NOT NULL,
  entityId    TEXT NOT NULL,
  type        TEXT NOT NULL,       -- 'UPSERT' | 'DELETE'
  payload     TEXT NOT NULL,
  receivedAt  INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'OK'  -- 'OK' | 'CONFLICT' | 'ERROR'
);
```

---

## 4. API Endpoints

### 4.1 `GET /infos`
> Já implementado em `express/index.js` como mock. Deve ser migrado para `routes/infos.js`.

Retorna lista estática de usuários de exemplo.

**Response 200:**
```json
[
  { "id": 1, "name": "Alice Johnson", "email": "alice.johnson@example.com" }
]
```

---

### 4.2 `GET /users`
Lista todos os usuários não deletados no servidor.

**Query params:**
- `since` (opcional, integer) — timestamp Unix; retorna apenas usuários com `updatedAt > since`

**Response 200:**
```json
[
  {
    "id": "uuid",
    "name": "Fulano",
    "createdAt": 1710000000000,
    "updatedAt": 1710000000000,
    "deleted": 0,
    "version": 3
  }
]
```

**Uso no app (sync pull):** app chama `GET /users?since=<lastSyncAt>` para buscar mudanças do servidor que ainda não possui localmente.

---

### 4.3 `POST /sync/push`
Recebe um lote de itens da fila `outbox` do app e os processa.

**Request body:**
```json
{
  "items": [
    {
      "outboxId": "uuid-outbox",
      "entity": "user",
      "entityId": "uuid-user",
      "type": "UPSERT",
      "payload": "{\"id\":\"uuid\",\"name\":\"Fulano\",\"createdAt\":...,\"updatedAt\":...}"
    },
    {
      "outboxId": "uuid-outbox-2",
      "entity": "user",
      "entityId": "uuid-user-2",
      "type": "DELETE"
    }
  ]
}
```

**Response 200 — resultado por item:**
```json
{
  "results": [
    { "outboxId": "uuid-outbox",   "status": "ok",       "version": 4 },
    { "outboxId": "uuid-outbox-2", "status": "ok",       "version": 2 },
    { "outboxId": "uuid-outbox-3", "status": "conflict", "serverData": { ... } }
  ]
}
```

**Lógica de conflito:** se o cliente envia `updatedAt` menor que o `updatedAt` do servidor, o servidor retorna `status: "conflict"` com os dados atuais — o app decide (last-write-wins ou UI de resolução).

---

### 4.4 `GET /sync/pull`
Alternativa ao `GET /users` — semântica explícita de sync.

**Query params:**
- `since` (obrigatório, integer) — timestamp da última sincronização

**Response:** idêntico ao `GET /users?since=`.

---

## 5. Arquivos do App que Precisam ser Modificados

### 5.1 `app/app/services/users.ts`
**Motivo:** URL hardcoded em `localhost:3000` e ausência de endpoints de sync.

**Alterações:**
- Trocar `http://localhost:3000` por variável de ambiente (`process.env.EXPO_PUBLIC_API_URL`)
- Adicionar função `pushOutboxItems(items)` → `POST /sync/push`
- Adicionar função `pullChanges(since: number)` → `GET /sync/pull`
- Tratar erros HTTP com tipagem adequada (HTTP 4xx = permanente, 5xx = transiente)

```typescript
// Adicionar:
export async function pushOutboxItems(items: OutboxPushItem[]): Promise<SyncResult[]>
export async function pullChanges(since: number): Promise<UserDB[]>
```

---

### 5.2 `app/app/sync/sync-engine.ts`
**Motivo:** As chamadas de API estão comentadas (linhas 62–66) e `isTransientError()` sempre retorna `true`.

**Alterações:**
- Descomentar e implementar a chamada a `pushOutboxItems()` no `processItem()`
- Implementar `isTransientError(error)` de forma real:
  - HTTP 5xx, timeout, `NetworkError` → `true` (transiente)
  - HTTP 400, 404, 409 → `false` (permanente)
- Implementar `handlePullSync()`: após processar a fila, chamar `pullChanges(lastSyncAt)` e aplicar dados remotos ao SQLite local
- Passar `serverVersion` retornado pela API para `markSynced(entityId, version)`

---

### 5.3 `app/app/data/user-repository.ts`
**Motivo:** Falta função para aplicar registros vindos do servidor (sync pull).

**Alterações:**
- Adicionar `upsertFromServer(user: UserDB): Promise<void>` — INSERT OR REPLACE na tabela `todos` sem criar entrada no `outbox` (dado já vem do servidor)
- Adicionar `applyServerDeletes(ids: string[]): Promise<void>` — marcar como `deleted=1` sem criar entrada no `outbox`
- Ambas devem verificar `serverVersion` antes de sobrescrever (não sobrescrever se local é mais novo)

---

### 5.4 `app/app/context/UsersContext.tsx`
**Motivo:** `fetchUsers()` busca apenas o mock `/infos` e não persiste dados. Precisa integrar o pull de sync.

**Alterações:**
- Substituir chamada isolada a `getInfos()` por chamada ao fluxo completo de sync (push + pull)
- Após pull, chamar `upsertFromServer()` para cada registro recebido
- Expor `lastSyncAt` no contexto para exibição na UI
- Remover estado `fetchUsers` separado — unificar com o ciclo de sync

---

### 5.5 `app/app/store/sync-store.ts`
**Motivo:** Falta chave para `LAST_SYNC_AT` persistida — necessária para o pull incremental.

**Alterações:**
- Adicionar `LAST_SYNC_AT` ao objeto `SYNC_KEYS` (pode já existir; verificar se está sendo persistida após cada sync)
- Adicionar `SYNC_ERROR` para expor último erro na UI

---

### 5.6 `app/app/interfaces/outbox.ts`  *(e `outbox.md`)*
**Motivo:** Interface precisa refletir o campo `dedupeKey` em uso e adicionar tipo para o resultado do push.

**Alterações:**
- Documentar e usar o campo `dedupeKey` no payload de push
- Criar interface `SyncPushResult` e `OutboxPushItem` para tipagem da comunicação com o servidor

---

### 5.7 `app/app/interfaces/user.ts`  *(e `user.md`)*
**Motivo:** Adicionar campo `serverVersion` ao tipo de forma obrigatória após primeiro sync.

**Sem mudanças críticas no tipo**, mas a documentação deve descrever o ciclo de vida do campo `dirty` e `serverVersion`.

---

## 6. Novos Arquivos no App

| Arquivo | Propósito |
|---|---|
| `app/app/services/sync-api.ts` | Funções de comunicação HTTP separadas dos services de domínio |
| `app/app/hooks/useNetworkSync.ts` | Hook que ouve eventos de rede (`NetInfo`) e aciona `runSync()` automaticamente ao reconectar |

---

## 7. Dependências do Backend

```json
{
  "dependencies": {
    "express": "^4.x",
    "better-sqlite3": "^9.x",
    "compression": "^1.x",
    "express-rate-limit": "^7.x",
    "pino": "^9.x",
    "pino-http": "^10.x",
    "dotenv": "^16.x",
    "uuid": "^9.x"
  },
  "devDependencies": {
    "nodemon": "^3.x"
  }
}
```

**Por que `better-sqlite3` e não `sqlite3`?**
API síncrona e bloqueante — mais simples e performática em Express onde cada request já roda em seu próprio ciclo de event loop; evita callback hell em operações de banco simples.

---

## 8. Segurança (OWASP API Security Top 10)

| Risco OWASP | Mitigação Implementada |
|---|---|
| API1 — Broken Object Level Authorization | Validar que o `entityId` do payload pertence ao contexto da requisição |
| API2 — Broken Authentication | Autenticação via JWT em header `Authorization: Bearer <token>` |
| API3 — Broken Property Level Authorization | Whitelist de campos aceitos no `payload` do push — rejeitar campos extras |
| API4 — Unrestricted Resource Consumption | `express-rate-limit`: 100 req/min por IP; tamanho máximo de batch: 50 itens |
| API6 — Unrestricted Access to Sensitive Flows | Middleware `validate.js` com JSON Schema em todos os endpoints de escrita |
| API8 — Security Misconfiguration | CORS restrito à origin do app; remover header `X-Powered-By`; Helmet.js |

---

## 9. Performance (Express.js Best Practices)

- `compression` middleware habilitado para todas as respostas
- `NODE_ENV=production` definido no `.env`
- Logger Pino em vez de `console.log()` (10x mais rápido)
- Todas as operações de banco usam `better-sqlite3` de forma síncrona mas não bloqueiam o event loop em operações rápidas
- Em produção: PM2 em modo cluster (`pm2 start src/index.js -i max`)
- Nginx como reverse proxy na frente do Express (compressão, TLS, cache de estáticos)

---

## 10. Fluxo de Sincronização Completo (após implementação)

```
App (offline) → Usuário cria/deleta registro
  ├─ Escrita local: INSERT INTO todos + INSERT INTO outbox (PENDING)
  └─ UI atualiza imediatamente

App (online) → runSync() é acionado
  ├─ PUSH: POST /sync/push com itens PENDING da outbox
  │   ├─ Servidor persiste em users + outbox_log
  │   ├─ Retorna { outboxId, status, version } por item
  │   └─ App: markSynced(entityId, version) + markDone(outboxId)
  │
  └─ PULL: GET /sync/pull?since=<lastSyncAt>
      ├─ Servidor retorna registros com updatedAt > since
      ├─ App: upsertFromServer(record) para cada item
      └─ App: LAST_SYNC_AT = now
```

---

## 11. Critérios de Aceite

- [ ] `POST /sync/push` processa lote de até 50 itens em transação única
- [ ] `GET /sync/pull?since=X` retorna apenas registros modificados após `X`
- [ ] App não faz chamada de rede no fluxo de escrita — apenas enfileira
- [ ] Após reconexão de rede, sync é acionado automaticamente via `useNetworkSync`
- [ ] Falhas HTTP 5xx geram retry com backoff; HTTP 4xx marcam item como `FAILED`
- [ ] `serverVersion` é persistido no SQLite local após sync bem-sucedido
- [ ] Rate limiting: 429 retornado após 100 req/min do mesmo IP
- [ ] Todos os endpoints de escrita validam schema do body

---

## 12. O que NÃO está no escopo deste PRD

- Autenticação de usuários (login/cadastro) — fase futura
- Sincronização de outros tipos de entidade além de `user`/`todo`
- Interface de resolução de conflitos na UI — versão 1 usa last-write-wins
- Deploy em produção (Nginx, PM2, TLS) — documentado mas não implementado aqui
