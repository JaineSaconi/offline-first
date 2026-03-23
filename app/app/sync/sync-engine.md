# sync-engine

**Arquivo:** `app/app/sync/sync-engine.ts`
**Tipo:** Funções puras — Motor de sincronização offline-first

## Descrição

Orquestra o processamento da fila de sincronização (`outbox`). Lê itens pendentes, executa as chamadas de API correspondentes e atualiza o estado local (tabelas `todos` e `outbox`) de forma atômica.

Toda a lógica é composta por funções puras exportadas — sem classes ou instâncias. A proteção contra execução concorrente é feita via MMKV store (`syncStorage`), que persiste o flag `IS_RUNNING` de forma síncrona.

## Função pública

### `runSync(): Promise<void>`

Ponto de entrada do ciclo de sincronização. Deve ser chamado quando:
- O app volta ao foreground.
- A conexão de rede é restabelecida.
- O usuário aciona sync manualmente.

```ts
await runSync();
```

Retorna imediatamente sem fazer nada se já houver um ciclo em andamento (verifica `syncStorage.getBoolean(SYNC_KEYS.IS_RUNNING)`). Ao finalizar, registra `LAST_SYNC_AT` no MMKV store.

## Fluxo interno

```
runSync()
 └─ processQueue()
      └─ getPendingItems()   → até 20 itens PENDING com nextRetryAt <= now
           └─ for each item:
                processItem(item)
                  ├─ markInFlight(item.id)
                  ├─ [chamada de API — comentada, aguarda implementação]
                  └─ sucesso → handleSuccess(item)
                             └─ withTransactionAsync:
                                  ├─ markSynced(entityId, serverVersion)
                                  └─ markDone(id)
                  └─ falha   → handleFailure(item, error)
                             ├─ transitório → updateRetry(...)
                             └─ permanente  → markFailed(...)
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

| Tipo        | Exemplos                             | Ação              |
|-------------|--------------------------------------|-------------------|
| Transitório | Timeout, 5xx, offline                | Retry com backoff |
| Permanente  | 400, 401, 403, 404, payload inválido | `FAILED`          |

> **TODO:** A função `isTransientError` atualmente retorna `true` para todos os erros. Implementar classificação real baseada no HTTP status code quando a API for integrada.

## Atomicidade do `handleSuccess`

O sucesso é gravado dentro de `withTransactionAsync`, garantindo que `todos.dirty = 0` e `outbox.status = 'DONE'` sejam escritos juntos. Se qualquer escrita falhar, ambas são revertidas e o item volta ao estado `IN_FLIGHT`, sendo reprocessado no próximo ciclo.

## Entidades suportadas

| `entity` | `type`   | Ação futura                |
|----------|----------|----------------------------|
| `user`   | `UPSERT` | `api.upsertUser(payload)`  |
| `user`   | `DELETE` | `api.deleteUser(entityId)` |

## Dependências

- `@/db/db` — `getDatabase()` para transações atômicas
- `../data/outbox-repository` — funções de acesso ao outbox
- `../data/user-repository` — `markSynced`
- `../interfaces/outbox` — `OutboxItem`
- `../store/sync-store` — `syncStorage`, `SYNC_KEYS`
