# useUsers

**Arquivo:** `app/app/hooks/useUsers.tsx`
**Tipo:** React Hook customizado

## Descrição

Hook principal da tela inicial. Gerencia o estado dos registros (`todos`) e da fila de sincronização (`outbox`). Dispara sync automaticamente após cada escrita. O estado do formulário (campo `name`) é gerenciado pelo `react-hook-form` no `HeaderInsert` — este hook não expõe `title`/`setTitle`.

## Retorno

```ts
{
  todos: UserDB[];
  outboxItems: OutboxItem[];
  error: string | null;
  loading: boolean;
  addTodo: (name: string) => Promise<boolean>;
  deleteTodo: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  fetchUsers: () => Promise<UserInfo[]>;
}
```

## Funções

### `addTodo(name: string): Promise<boolean>`

Persiste o nome no banco e retorna `true` em sucesso ou `false` em falha. A tela usa esse retorno para exibir o Toast.

**Fluxo:**
1. Escreve localmente (`todos` + `outbox` em transação).
2. Recarrega `todos` e `outboxItems` — UI atualiza imediatamente.
3. Dispara `sync()` em background; ao concluir, recarrega `outboxItems`.
4. Retorna `true`.

### `deleteTodo(id: string)`

Soft delete + outbox entry. Recarrega listas e dispara sync.

### `refresh()`

Recarrega `todos` e `outboxItems` em paralelo.

## Ciclo de sync

```
Escrita local (atômica) → UI atualiza (PENDING)
      ↓ (background)
sync() → processa outbox → recarrega outboxItems (DONE)
```

## Dependências

- `../data/user-repository` — `UserRepository`
- `../data/outbox-repository` — `OutboxRepository`
- `../interfaces/user` — `UserDB`
- `../interfaces/outbox` — `OutboxItem`
- `../services/users` — `getInfos`
- `./useSync` — `useSync`
