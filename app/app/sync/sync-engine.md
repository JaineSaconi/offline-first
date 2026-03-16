# SyncEngine

**Arquivo:** `app/app/sync/sync-engine.ts`
**Tipo:** Classe — Motor de sincronização offline-first

## Descrição

Orquestra o processamento da fila de sincronização (`outbox`). Lê itens pendentes, executa as chamadas de API correspondentes e atualiza o estado local (tabelas `todos` e `outbox`) de forma atômica.

Possui proteção contra execução concorrente via flag `isRunning`.

## Métodos públicos

### `run(): Promise<void>`

Ponto de entrada do ciclo de sincronização. Deve ser chamado quando:
- O app volta ao foreground.
- A conexão de rede é restabelecida.
- O usuário aciona sync manualmente.

```ts
const engine = new SyncEngine();
await engine.run();
```

Retorna imediatamente sem fazer nada se já houver um ciclo em andamento (`isRunning = true`).

## Fluxo interno

```
run()
 └─ processQueue()
      └─ outboxRepo.getPendingItems()   → até 20 itens PENDING com nextRetryAt <= now
           └─ for each item:
                processItem(item)
                  ├─ markInFlight(item.id)
                  ├─ [chamada de API — comentada, aguarda implementação]
                  └─ sucesso → markSuccess(item)
                             └─ withTransactionAsync:
                                  ├─ userRepo.markSynced(entityId, serverVersion)
                                  └─ outboxRepo.markDone(id)
                  └─ falha   → markFailure(item, error)
                             ├─ transitório → outboxRepo.updateRetry(...)
                             └─ permanente  → outboxRepo.markFailed(...)
```

## Estratégia de retry (backoff exponencial com jitter)

```
tentativa 1 → ~1s
tentativa 2 → ~2s
tentativa 3 → ~4s
tentativa 4 → ~8s
...
máximo     → ~2min
```

O jitter (±30%) evita thundering herd — múltiplos dispositivos tentando sincronizar ao mesmo tempo.

```ts
function computeBackoffMs(attempts: number): number {
  const base = 1000;
  const cap = 2 * 60 * 1000;
  const exp = Math.min(cap, base * 2 ** Math.max(0, attempts - 1));
  const jitter = Math.random() * 0.3 * exp;
  return Math.floor(exp + jitter);
}
```

## Classificação de erros

| Tipo        | Exemplos                        | Ação              |
|-------------|----------------------------------|-------------------|
| Transitório | Timeout, 5xx, offline            | Retry com backoff |
| Permanente  | 400, 401, 403, 404, payload inválido | `FAILED`     |

> **TODO:** A função `isTransientError` atualmente retorna `true` para todos os erros. Implementar classificação real baseada no HTTP status code quando a API for integrada.

## Atomicidade do `markSuccess`

O sucesso é gravado dentro de `withTransactionAsync`, garantindo que `todos.dirty = 0` e `outbox.status = 'DONE'` sejam escritos juntos. Se qualquer escrita falhar, ambas são revertidas e o item volta ao estado `IN_FLIGHT`, sendo reprocessado no próximo ciclo.

## Entidades suportadas

| `entity` | `type`    | Ação futura                  |
|----------|-----------|------------------------------|
| `user`   | `UPSERT`  | `api.upsertUser(payload)`    |
| `user`   | `DELETE`  | `api.deleteUser(entityId)`   |

## Dependências

- `@/db/db` — `getDatabase()` para transações atômicas
- `../data/outbox-repository` — `OutboxRepository`
- `../data/user-repository` — `UserRepository`
- `../interfaces/outbox` — `OutboxItem`
