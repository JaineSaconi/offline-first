# ModalScreen

**Arquivo:** `app/app/modal.tsx`
**Tipo:** Componente de tela — Modal (rota `/modal`)

## Descrição

Tela modal de exemplo gerada pelo template do Expo Router. Exibe um título e um link para retornar à tela principal.

## Estrutura visual

```
ModalScreen
├── ThemedText (tipo: title) — "This is a modal"
└── Link (dismissTo="/") — "Go to home screen"
```

## Comportamento

- Renderizada como modal via configuração no `_layout.tsx`:
  ```ts
  <Stack.Screen name="modal" options={{ presentation: "modal" }} />
  ```
- O link usa `dismissTo` para desempilhar o modal e retornar à rota `/` sem criar nova entrada no histórico de navegação.

## Observações

Esta tela é um placeholder do template. Pode ser adaptada para:
- Detalhes de um item selecionado.
- Formulários de edição.
- Telas de configurações.

## Dependências

- `expo-router` — `Link`
- `@/components/themed-text`, `@/components/themed-view` — UI temática
