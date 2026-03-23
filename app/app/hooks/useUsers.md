# useUsers

**Arquivo:** `app/app/hooks/useUsers.tsx`
**Tipo:** React Hook customizado

## Descrição

Hook de conveniência que delega para `useUsersContext()`. Mantém a mesma interface de antes para que os componentes não precisem conhecer o contexto diretamente.

Todo o estado e lógica vivem no `UsersProvider` (`app/app/context/UsersContext.tsx`).

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

## Uso

```tsx
import { useUsers } from "./hooks/useUsers";

function MyScreen() {
  const { todos, addTodo, loading } = useUsers();
}
```

> Requer que o componente esteja dentro de `<UsersProvider>`, que é montado no `_layout.tsx`.

## Dependências

- `../context/UsersContext` — `useUsersContext`
