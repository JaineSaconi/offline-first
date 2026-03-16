# SQLiteScreen (index)

**Arquivo:** `app/app/index.tsx`
**Tipo:** Componente de tela — Tela principal (rota `/`)

## Descrição

Tela principal. Permite inserir nomes via formulário validado, visualizá-los em **Active**, deletá-los (movendo para **Deleted**) e acompanhar o estado do outbox. Exibe toast de sucesso/falha após cada inserção.

## Fluxo de uso

```
Usuário digita nome (≥3 chars) → botão Add ativo (azul)
Usuário digita <3 chars        → botão Add cinza/desabilitado + borda vermelha no input
Usuário clica Add              → registro salvo → Toast verde "Sucesso" (3s)
Usuário clica Delete           → item vai para Deleted
(background) sync              → outbox: PENDING → DONE
```

## Toast

Estado gerenciado localmente:
```ts
const [toast, setToast] = useState<{ success: boolean; toastKey: number } | null>(null);
```

`handleAdd` define o toast após cada operação:
```ts
async function handleAdd(name: string): Promise<boolean> {
  const ok = await addTodo(name);
  setToast({ success: ok, toastKey: Date.now() });
  return ok;
}
```

O `toastKey` único (`Date.now()`) garante que a animação reinicia mesmo em ações consecutivas rápidas.

## Estrutura visual

```
SafeAreaView
├── ThemedText (título)
├── ThemedText (subtítulo)
├── HeaderInsert (formulário react-hook-form)
├── ThemedText (contagem ou erro)
├── ScrollView
│   └── ThemedView (lista)
│       ├── "Active"   → nomes com botão Delete
│       ├── "Deleted"  → nomes removidos (read-only)
│       └── "Outbox"   → [STATUS] TIPO: nome
└── Toast (absoluto, topo 24px) ← renderizado por último para ficar sobre tudo
```

## Formatação do Outbox

```ts
function formatOutboxLabel(item: OutboxItem): string {
  const data = JSON.parse(item.payload) as { name?: string };
  return `[${item.status}] ${item.type}: ${data.name ?? item.entityId}`;
}
// Exemplo: "[DONE] UPSERT: João"
```

## Filtragem das listas

```ts
const activeTodos  = useMemo(() => todos.filter((t) => (t.deleted ?? 0) === 0), [todos]);
const deletedTodos = useMemo(() => todos.filter((t) => (t.deleted ?? 0) === 1), [todos]);
```

## Dependências

- `./hooks/useUsers` — dados e lógica de sync
- `./components/HeaderInsert` — formulário com react-hook-form
- `./components/ItemListHome/ItemListHome` — item de lista
- `./components/Toast` — notificação temporária
- `./interfaces/outbox` — `OutboxItem`
- `@/components/themed-text`, `@/components/themed-view`
- `@/styles/sqlite`
