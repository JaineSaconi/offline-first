# useSync

**Arquivo:** `app/app/hooks/useSync.tsx`
**Tipo:** React Hook customizado

## Descrição

Hook que expõe a funcionalidade de sincronização da fila `outbox` para os componentes React. Encapsula uma instância singleton do `SyncEngine` (via `useRef`) e disponibiliza a função `sync` para disparo manual ou automático.

## Retorno

```ts
{
  sync: () => Promise<void>;
}
```

| Propriedade | Tipo                    | Descrição                                              |
|-------------|-------------------------|--------------------------------------------------------|
| `sync`      | `() => Promise<void>`   | Dispara um ciclo completo de sincronização do outbox   |

## Uso

```tsx
import { useSync } from "../hooks/useSync";

function MyComponent() {
  const { sync } = useSync();

  return (
    <Button onPress={sync} title="Sincronizar" />
  );
}
```

## Comportamento

- O `SyncEngine` é instanciado uma única vez via `useRef` e reaproveitado entre renders.
- `sync` é estabilizada via `useCallback` para não causar re-renders desnecessários em componentes filhos.
- Se `sync` for chamado enquanto um ciclo já estiver em andamento, o `SyncEngine` retorna imediatamente sem processamento duplicado (`isRunning` guard).

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

- `../sync/sync-engine` — `SyncEngine`
