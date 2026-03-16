# UserDB

**Arquivo:** `app/app/interfaces/user.ts`
**Tipo:** Interface TypeScript

## Descrição

Define o contrato de um registro da tabela `todos` retornado pelo banco de dados SQLite local. Reflete diretamente o schema da migration.

## Interface

```ts
export interface UserDB {
  id: string;
  name: string;
  createdAt: number;
  dirty: 0 | 1;
  updatedAt?: number;
  deleted?: 0 | 1;
  serverVersion?: number;
}
```

## Campos

| Campo           | Tipo      | Obrigatório | Descrição                                                              |
|-----------------|-----------|-------------|------------------------------------------------------------------------|
| `id`            | `string`  | Sim         | UUID gerado no cliente (TEXT PRIMARY KEY no SQLite)                    |
| `name`          | `string`  | Sim         | Nome do registro                                                       |
| `createdAt`     | `number`  | Sim         | Timestamp de criação em milissegundos (epoch)                         |
| `dirty`         | `0 \| 1`  | Sim         | Flag de sincronização: `1` = tem alterações não sincronizadas          |
| `updatedAt`     | `number`  | Não         | Timestamp da última modificação em milissegundos                      |
| `deleted`       | `0 \| 1`  | Não         | Soft delete: `1` = registro marcado como deletado                     |
| `serverVersion` | `number`  | Não         | Versão recebida do servidor após sincronização (conflict resolution)  |

## Observações

- `id` é do tipo `string` (UUID v4) gerado via `crypto.randomUUID()` no cliente.
- `name` substituiu o campo `title` (renomeado via migration `ALTER TABLE todos RENAME COLUMN title TO name`).
- `dirty` e `deleted` usam `0 | 1` por limitação do SQLite (sem tipo booleano nativo).
- `serverVersion` é `null` enquanto o registro ainda não foi sincronizado com o servidor.

## Tabela correspondente

```sql
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  dirty INTEGER NOT NULL DEFAULT 0,
  deleted INTEGER NOT NULL DEFAULT 0,
  serverVersion INTEGER
);
```
