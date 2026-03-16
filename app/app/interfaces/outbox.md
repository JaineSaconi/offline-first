# OutboxItem

**Arquivo:** `app/app/interfaces/outbox.ts`
**Tipo:** Interface TypeScript

## Descrição

Define o contrato de um registro da tabela `outbox`, que representa uma operação pendente de sincronização com o servidor. É o coração do padrão Outbox para arquitetura offline-first.

## Interface

```ts
export interface OutboxItem {
  id: string;
  entity: string;
  entityId: string;
  type: string;
  payload: string;
  createdAt: number;
  attempts: number;
  nextRetryAt: number;
  status: string;
  lastError: string | null;
  dedupeKey: string | null;
  doneAt: number | null;
}
```

## Campos

| Campo        | Tipo             | Obrigatório | Descrição                                                                    |
|--------------|------------------|-------------|------------------------------------------------------------------------------|
| `id`         | `string`         | Sim         | UUID único do item na fila (TEXT PRIMARY KEY)                                |
| `entity`     | `string`         | Sim         | Nome da entidade afetada (ex: `"user"`)                                      |
| `entityId`   | `string`         | Sim         | ID da entidade alvo na tabela local                                          |
| `type`       | `string`         | Sim         | Tipo da operação: `"UPSERT"` ou `"DELETE"`                                   |
| `payload`    | `string`         | Sim         | JSON serializado com os dados a enviar para a API                            |
| `createdAt`  | `number`         | Sim         | Timestamp de criação em milissegundos                                        |
| `attempts`   | `number`         | Sim         | Contador de tentativas de envio (começa em `0`)                              |
| `nextRetryAt`| `number`         | Sim         | Timestamp mínimo para próxima tentativa (epoch ms)                           |
| `status`     | `string`         | Sim         | Estado atual do item na fila (ver abaixo)                                    |
| `lastError`  | `string \| null` | Não         | Mensagem do último erro ocorrido durante o processamento                     |
| `dedupeKey`  | `string \| null` | Não         | Chave de deduplicação para evitar operações duplicadas (ex: `user:{id}:upsert`) |
| `doneAt`     | `number \| null` | Não         | Timestamp de conclusão quando `status = 'DONE'`                              |

## Ciclo de vida do status

```
PENDING → IN_FLIGHT → DONE
                    ↘ PENDING (retry com backoff)
                    ↘ FAILED (erro permanente, sem retry)
```

| Status      | Descrição                                              |
|-------------|--------------------------------------------------------|
| `PENDING`   | Aguardando processamento (respeita `nextRetryAt`)      |
| `IN_FLIGHT` | Sendo processado pelo SyncEngine no momento            |
| `DONE`      | Sincronizado com sucesso                               |
| `FAILED`    | Falhou definitivamente (erro permanente, ex: 4xx)      |

## Tabela correspondente

```sql
CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY NOT NULL,
  entity TEXT NOT NULL,
  entityId TEXT NOT NULL,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  nextRetryAt INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  lastError TEXT,
  dedupeKey TEXT,
  doneAt INTEGER
);
```
