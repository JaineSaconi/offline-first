# UsersContext

**Arquivo:** `app/app/context/UsersContext.tsx`
**Tipo:** React Context + Provider

## Descrição

Centraliza todo o estado e lógica de dados da aplicação: registros de usuários (`todos`), fila de sincronização (`outboxItems`), estados de loading/erro e as actions de escrita. Disponibiliza esses valores para qualquer componente da árvore via `useUsersContext`.

Montado no `_layout.tsx` após o banco estar pronto, garantindo acesso seguro ao SQLite.

## Interface do contexto

```ts
interface UsersContextValue {
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

## Provider

### `<UsersProvider>`

Envolve a árvore de componentes que precisam de acesso aos dados.

```tsx
// _layout.tsx
<UsersProvider>
  <Stack />
</UsersProvider>
```

## Hook de consumo

### `useUsersContext(): UsersContextValue`

Retorna o valor do contexto. Lança erro se usado fora do `UsersProvider`.

```tsx
const { todos, addTodo, loading } = useUsersContext();
```

## Actions

### `addTodo(name: string): Promise<boolean>`

Persiste o nome no banco e retorna `true` em sucesso ou `false` em falha. A tela usa esse retorno para exibir o Toast.

**Fluxo:**
1. Escreve localmente via `addUser(name)` (`todos` + `outbox` em transação atômica).
2. Recarrega `todos` e `outboxItems` — UI atualiza imediatamente.
3. Dispara `sync()` em background; ao concluir, recarrega `outboxItems`.
4. Retorna `true`.

### `deleteTodo(id: string): Promise<void>`

Soft delete via `markDeleted(id)` + entrada no outbox. Recarrega listas e dispara sync em background.

### `refresh(): Promise<void>`

Recarrega `todos` e `outboxItems` em paralelo.

### `fetchUsers(): Promise<UserInfo[]>`

Busca usuários da API remota (`GET /infos`). Não altera estado local.

## Ciclo de sync

```
Escrita local (atômica) → UI atualiza (PENDING)
      ↓ (background)
sync() → processa outbox → recarrega outboxItems (DONE)
```

## Dependências

- `../data/user-repository` — `loadAllUsers`, `addUser`, `markDeleted`
- `../data/outbox-repository` — `loadAllOutboxItems`
- `../interfaces/user` — `UserDB`
- `../interfaces/outbox` — `OutboxItem`
- `../services/users` — `getInfos`, `UserInfo`
- `../hooks/useSync` — `useSync`
