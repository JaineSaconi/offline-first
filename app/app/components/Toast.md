# Toast

**Arquivo:** `app/app/components/Toast.tsx`
**Tipo:** Componente React Native — Notificação temporária

## Descrição

Exibe uma notificação temporária no topo da tela após uma ação. Aparece com animação de fade + slide, permanece visível por 3 segundos e desaparece automaticamente. Posicionado absolutamente a 24px das bordas da SafeAreaView.

## Props

```ts
type ToastProps = {
  success: boolean;
  toastKey: number;
};
```

| Prop       | Tipo      | Descrição                                                                        |
|------------|-----------|----------------------------------------------------------------------------------|
| `success`  | `boolean` | `true` → fundo verde + texto "Sucesso"; `false` → fundo vermelho + texto "Falha" |
| `toastKey` | `number`  | Incrementar este valor re-dispara a animação (ex: `Date.now()`)                  |

## Animação

Usa `Animated` do React Native (nativo, `useNativeDriver: true`).

```
entrada (250ms): opacity 0→1 + translateY -10→0
espera (2500ms)
saída  (250ms):  opacity 1→0
total: 3000ms
```

A animação reinicia sempre que `toastKey` muda, via `useEffect([toastKey])`.

## Aparência

| Estado   | Cor de fundo | Texto    | Tamanho do texto |
|----------|--------------|----------|------------------|
| Sucesso  | `#4caf50`    | Sucesso  | 16px, bold       |
| Falha    | `#f44336`    | Falha    | 16px, bold       |

## Posicionamento

```ts
position: "absolute",
top: 24,
left: 24,
right: 24,
zIndex: 999,
```

Deve ser renderizado dentro de um container com `flex: 1` (ex: `SafeAreaView`) para que o posicionamento absoluto funcione corretamente. `pointerEvents="none"` garante que o toast não bloqueia toques nos elementos abaixo.

## Uso

```tsx
// Estado na tela pai
const [toast, setToast] = useState<{ success: boolean; toastKey: number } | null>(null);

// Disparo após ação
setToast({ success: true, toastKey: Date.now() });

// Renderização (ao final do JSX, para ficar sobre outros elementos)
{toast && <Toast success={toast.success} toastKey={toast.toastKey} />}
```

## Dependências

- `react-native` — `Animated`, `StyleSheet`, `Text`
