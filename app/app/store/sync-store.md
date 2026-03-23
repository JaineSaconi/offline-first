# sync-store

**Arquivo:** `app/app/store/sync-store.ts`
**Tipo:** MMKV Store — Estado persistente de sincronização

## Descrição

Define a instância MMKV e as chaves tipadas usadas para controlar o estado do ciclo de sincronização. Utilizado pelo `sync-engine` para guardar o flag de execução e pelo `useSync` para leitura reativa.

O MMKV é síncrono, o que garante que a leitura e escrita do flag `IS_RUNNING` sejam atômicas sem necessidade de `await`, evitando condições de corrida entre múltiplas chamadas de `runSync`.

## Exports

### `syncStorage`

Instância MMKV isolada com id `"sync-store"`.

```ts
import { syncStorage } from "../store/sync-store";

syncStorage.set(SYNC_KEYS.IS_RUNNING, true);
const running = syncStorage.getBoolean(SYNC_KEYS.IS_RUNNING); // true
```

### `SYNC_KEYS`

Objeto com as chaves tipadas do store.

| Chave         | Valor               | Tipo      | Descrição                                      |
|---------------|---------------------|-----------|------------------------------------------------|
| `IS_RUNNING`  | `"sync.isRunning"`  | `boolean` | `true` enquanto `runSync` está em execução     |
| `LAST_SYNC_AT`| `"sync.lastSyncAt"` | `number`  | Timestamp (ms) do último sync concluído        |

## Uso com hook reativo

```tsx
import { useMMKVBoolean } from "react-native-mmkv";
import { syncStorage, SYNC_KEYS } from "../store/sync-store";

const [isRunning] = useMMKVBoolean(SYNC_KEYS.IS_RUNNING, syncStorage);
```

## Dependências

- `react-native-mmkv` — `MMKV`
