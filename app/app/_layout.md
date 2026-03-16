# RootLayout

**Arquivo:** `app/app/_layout.tsx`
**Tipo:** Componente de layout raiz — Expo Router

## Descrição

Layout raiz da aplicação. Responsável por:
1. Configurar o tema visual (claro/escuro) via `ThemeProvider`.
2. Definir a estrutura de navegação com `Stack`.
3. Executar a migração do banco de dados SQLite na inicialização.

## Inicialização do banco

```ts
useEffect(() => {
  migrateDatabase().catch((error) => {
    console.error("Failed to migrate database", error);
  });
}, []);
```

A migração cria as tabelas `todos` e `outbox` com seus índices, caso ainda não existam. Utiliza `CREATE TABLE IF NOT EXISTS` e `CREATE INDEX IF NOT EXISTS`, tornando as operações idempotentes.

> **Atenção:** A migração é assíncrona e iniciada após o primeiro render. Existe uma janela onde o banco ainda não está pronto enquanto as telas filhas montam. Para produção, considere adicionar um estado de loading que bloqueie a renderização até `migrateDatabase()` resolver.

## Rotas configuradas

| Nome      | Arquivo              | Configuração                          |
|-----------|----------------------|---------------------------------------|
| `index`   | `app/index.tsx`      | `headerShown: false`                  |
| `modal`   | `app/modal.tsx`      | `presentation: "modal"`, title: Modal |

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
