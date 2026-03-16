# HeaderInsert

**Arquivo:** `app/app/components/HeaderInsert.tsx`
**Tipo:** Componente React Native — Formulário de inserção

## Descrição

Componente de formulário controlado com `react-hook-form`. Gerencia o campo `name` com validação em tempo real, exibe feedback visual de erros no `TextInput` e controla o estado do botão Add baseado na validade do formulário.

## Props

```ts
type HeaderInsertProps = {
  loading: boolean;
  onAdd: (name: string) => Promise<boolean>;
  onRefresh: () => void;
};
```

| Prop        | Tipo                              | Descrição                                                       |
|-------------|-----------------------------------|-----------------------------------------------------------------|
| `loading`   | `boolean`                         | Desabilita interações durante operações em andamento            |
| `onAdd`     | `(name: string) => Promise<boolean>` | Callback chamado com o nome validado; `true` = sucesso, reseta o form |
| `onRefresh` | `() => void`                      | Callback do botão Refresh                                       |

## Formulário (react-hook-form)

```ts
useForm<{ name: string }>({
  mode: "onChange",          // valida a cada keystroke
  defaultValues: { name: "" },
})
```

### Regras de validação

| Regra       | Valor | Mensagem             |
|-------------|-------|----------------------|
| `required`  | true  | (campo obrigatório)  |
| `minLength` | 3     | "Mínimo 3 caracteres" |

## Comportamentos visuais

### TextInput — borda vermelha
Quando `errors.name` existe (usuário digitou menos de 3 caracteres):
```ts
style={[styles.input, hasError && { borderColor: "#f44336", borderWidth: 2 }]}
```

### Mensagem de erro inline
Exibida abaixo do TextInput quando `hasError = true`:
```
Mínimo 3 caracteres
```

### Botão Add — cinza e desabilitado
Desabilitado quando `loading = true` OU `isValid = false`:
```ts
disabled={isDisabled}
style={[styles.button, isDisabled && { backgroundColor: "#d0d0d0", opacity: 0.7 }]}
```

### Reset automático
Após `onAdd` retornar `true`, o formulário é resetado via `reset()`.

## Estrutura visual

```
HeaderInsert
├── ThemedView (row)
│   ├── Controller → TextInput (borda vermelha se erro)
│   └── Pressable "Add" (cinza/desabilitado se form inválido)
├── ThemedText (mensagem de erro, se houver)
└── ThemedView (actionsRow)
    └── Pressable "Refresh"
```

## Dependências

- `react-hook-form` — `useForm`, `Controller`
- `react-native` — `Pressable`, `TextInput`, `StyleSheet`
- `@/components/themed-text`, `@/components/themed-view`
- `@/styles/sqlite`
