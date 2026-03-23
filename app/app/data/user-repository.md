# user-repository

**Arquivo:** `app/app/data/user-repository.ts`
**Tipo:** Funções puras — Repositório de dados (tabela `todos`)

## Descrição

Responsável por todas as operações de leitura e escrita na tabela `todos` do banco SQLite local. Toda escrita (insert/delete) é atômica com a criação de uma entrada na tabela `outbox`, garantindo que nenhuma operação seja perdida sem registro de sincronização.

Obtém a conexão com o banco internamente via `getDatabase()` (singleton). Todas as operações são funções puras exportadas — sem classes ou instâncias.

## Funções

### `loadAllUsers(): Promise<UserDB[]>`

Retorna todos os registros da tabela `todos` ordenados pelo mais recente.

```ts
const users = await loadAllUsers();
```

---

### `addUser(name: string): Promise<string>`

Insere um novo registro em `todos` e cria a entrada correspondente no `outbox` dentro de uma única transação atômica.

```ts
const id = await addUser("João Silva");
```

**Fluxo interno:**
1. Gera UUID via `expo-crypto`.
2. `withTransactionAsync`:
   - INSERT em `todos` com `name`, `dirty = 0`, `deleted = 0`.
   - INSERT em `outbox` com `type = 'UPSERT'`, payload `{ id, name }`.
3. Retorna o `id` gerado.

---

### `markDeleted(id: string): Promise<void>`

Aplica soft delete e enfileira operação de DELETE no `outbox`, de forma atômica.

```ts
await markDeleted("uuid-do-registro");
```

---

### `markSynced(todoId: string, serverVersion: number | null): Promise<void>`

Atualiza o registro após sincronização bem-sucedida. Define `dirty = 0` e salva `serverVersion`.

```ts
await markSynced(item.entityId, null);
```

## Dependências

- `@/db/db` — `getDatabase()`
- `expo-crypto` — geração de UUID
- `../interfaces/user` — `UserDB`
