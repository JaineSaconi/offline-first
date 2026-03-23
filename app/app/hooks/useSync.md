# useSync

**Arquivo:** `app/app/hooks/useSync.tsx`
**Tipo:** React Hook customizado

## Descrição

Hook que expõe a funcionalidade de sincronização da fila `outbox` para os componentes React. Chama `runSync()` do sync engine e expõe reativamente o estado `isRunning` via MMKV store.

## Retorno

```ts
{
  sync: () => Promise<void>;
  isRunning: boolean;
}
```

| Propriedade | Tipo                  | Descrição                                                        |
|-------------|-----------------------|------------------------------------------------------------------|
| `sync`      | `() => Promise<void>` | Dispara um ciclo completo de sincronização do outbox             |
| `isRunning` | `boolean`             | `true` enquanto o sync está em execução (reativo via MMKV)       |

## Uso

```tsx
import { useSync } from "../hooks/useSync";

function MyComponent() {
  const { sync, isRunning } = useSync();

  return (
    <Button onPress={sync} disabled={isRunning} title="Sincronizar" />
  );
}
```

## Comportamento

- `isRunning` é lido do MMKV store via `useMMKVBoolean`, tornando-o reativo: qualquer componente que consuma este hook re-renderiza automaticamente quando o sync inicia ou termina.
- Se `sync` for chamado enquanto um ciclo já estiver em andamento, `runSync()` retorna imediatamente sem processamento duplicado (guard via `syncStorage.getBoolean(IS_RUNNING)`).
- `sync` é estabilizada via `useCallback` para não causar re-renders desnecessários.

## Integração recomendada

Combinar com eventos de rede para sincronização automática:

```tsx
useEffect(() => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      void sync();
    }
  });
  return unsubscribe;
}, [sync]);
```

## Dependências

- `../sync/sync-engine` — `runSync`
- `../store/sync-store` — `syncStorage`, `SYNC_KEYS`
- `react-native-mmkv` — `useMMKVBoolean`
