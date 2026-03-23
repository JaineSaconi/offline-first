# RootLayout

**Arquivo:** `app/app/_layout.tsx`
**Tipo:** Componente de layout raiz — Expo Router

## Descrição

Layout raiz da aplicação. Responsável por:
1. Executar a migração do banco de dados SQLite na inicialização.
2. Montar o `UsersProvider`, disponibilizando o contexto de dados para todas as telas.
3. Configurar o tema visual (claro/escuro) via `ThemeProvider`.
4. Definir a estrutura de navegação com `Stack`.

## Inicialização do banco

```ts
useEffect(() => {
  migrateDatabase()
    .then(() => setDbReady(true))
    .catch((error) => {
      console.error("Failed to migrate database", error);
    });
}, []);
```

A migração cria as tabelas `todos` e `outbox` com seus índices, caso ainda não existam. O app aguarda `dbReady = true` antes de renderizar qualquer tela — enquanto o banco não estiver pronto, o componente retorna `null`.

## UsersProvider

O `UsersProvider` é montado após o banco estar pronto, garantindo que o contexto de dados possa acessar o SQLite com segurança.

```tsx
<UsersProvider>
  <Stack>...</Stack>
</UsersProvider>
```

## Rotas configuradas

| Nome    | Arquivo         | Configuração                          |
|---------|-----------------|---------------------------------------|
| `index` | `app/index.tsx` | `headerShown: false`                  |
| `modal` | `app/modal.tsx` | `presentation: "modal"`, title: Modal |

## Tema

Detecta o esquema de cores do sistema via `useColorScheme` e aplica o tema correspondente:

```ts
<ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
```

## Dependências

- `@react-navigation/native` — `DarkTheme`, `DefaultTheme`, `ThemeProvider`
- `expo-router` — `Stack`
- `expo-status-bar` — `StatusBar`
- `@/hooks/use-color-scheme` — detecção de tema
- `@/db/db` — `migrateDatabase`
- `./context/UsersContext` — `UsersProvider`
