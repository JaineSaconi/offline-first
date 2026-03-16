# OutboxRepository

**Arquivo:** `app/app/data/outbox-repository.ts`
**Tipo:** Classe — Repositório de dados (tabela `outbox`)

## Descrição

Responsável por todas as operações na tabela `outbox`, que é a fila de sincronização do sistema offline-first. Gerencia o ciclo de vida completo dos itens: leitura de pendentes, controle de estado (`IN_FLIGHT`, `DONE`, `FAILED`) e retry com backoff exponencial.

Obtém a conexão com o banco internamente via `getDatabase()` (singleton).

## Métodos

### `loadAll(): Promise<OutboxItem[]>`

Retorna todos os registros do outbox, independente de status, ordenados do mais recente ao mais antigo.

```ts
const items = await outboxRepository.loadAll();
```

Usado pela UI para exibir o estado atual da fila de sincronização.

---

### `getPendingItems(): Promise<OutboxItem[]>`

Retorna até 20 itens com `status = 'PENDING'` cujo `nextRetryAt` já foi atingido.

```ts
const pending = await outboxRepository.getPendingItems();
```

- Ordenados por `createdAt ASC` (FIFO: mais antigos primeiro).
- O limite de 20 itens por ciclo protege contra travamento do SyncEngine em filas grandes.
- Respeita o backoff: itens com `nextRetryAt` no futuro são ignorados.

---

### `markInFlight(id: string): Promise<void>`

Muda o status do item para `'IN_FLIGHT'`, sinalizando que está sendo processado.

```ts
await outboxRepository.markInFlight(item.id);
```

Evita que o mesmo item seja processado duas vezes em ciclos concorrentes.

---

### `markDone(outboxId: string): Promise<void>`

Marca o item como `'DONE'` após sincronização bem-sucedida.

```ts
await outboxRepository.markDone(item.id);
```

- Define `doneAt = now`.
- Limpa `lastError`.
- Chamado dentro de `withTransactionAsync` pelo `SyncEngine` junto com `markSynced`.

---

### `updateRetry(id, attempts, nextRetryAt, lastError): Promise<void>`

Reagenda um item para retry após falha transitória (timeout, 5xx, offline).

```ts
await outboxRepository.updateRetry(id, 3, Date.now() + 8000, "Network timeout");
```

- Volta o status para `'PENDING'`.
- Incrementa `attempts`.
- Define `nextRetryAt` com o próximo tempo de retry (calculado com backoff pelo SyncEngine).
- Persiste `lastError` para diagnóstico.

---

### `markFailed(id: string, lastError: string): Promise<void>`

Marca o item como `'FAILED'` após erro permanente (ex: 4xx).

```ts
await outboxRepository.markFailed(id, "404 Not Found");
```

Itens com `FAILED` não são reprocessados automaticamente e requerem intervenção manual ou lógica específica de resolução.

## Ciclo de vida gerenciado

```
PENDING ──(getPendingItems)──► IN_FLIGHT
    ▲                              │
    │                    ┌─────────┴─────────┐
    │                 sucesso              falha
    │                    │                   │
    │               markDone           transitória?
    │                    │               /       \
    │                 DONE            sim        não
    └────────────(updateRetry)◄──────           markFailed
                                              FAILED
```

## Dependências

- `@/db/db` — `getDatabase()` para acesso ao banco SQLite
- `../interfaces/outbox` — `OutboxItem` para tipagem dos resultados
