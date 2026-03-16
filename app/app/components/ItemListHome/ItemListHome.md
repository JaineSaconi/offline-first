# ItemListHome

**Arquivo:** `app/app/components/ItemListHome/ItemListHome.tsx`
**Tipo:** Componente React Native — Item de lista

## Descrição

Componente de linha reutilizável para exibição de registros em listas. Exibe um texto e, opcionalmente, um botão de ação destrutiva (Delete). Usado nas seções de registros ativos, deletados e itens do outbox.

## Props

```ts
type ItemListHomeProps = {
  title: string;
  loading: boolean;
  onPress?: () => void;
};
```

| Prop      | Tipo           | Obrigatório | Descrição                                                         |
|-----------|----------------|-------------|-------------------------------------------------------------------|
| `title`   | `string`       | Sim         | Texto principal exibido na linha                                  |
| `loading` | `boolean`      | Sim         | Desabilita o botão durante operações em andamento                 |
| `onPress` | `() => void`   | Não         | Callback do botão Delete. Se omitido, o botão não é renderizado   |

## Estrutura visual

```
ItemListHome
├── ThemedText — título do item
└── Pressable "Delete" (somente se onPress for fornecido)
```

## Comportamento

- O botão Delete é renderizado condicionalmente — presente apenas quando `onPress` é passado.
- Registros deletados (soft delete) e itens do outbox são exibidos sem botão de ação.
- Estados visuais do botão:
  - **Normal**: background `#ffd6d6` (vermelho claro)
  - **Pressionado**: opacidade reduzida (`buttonPressed`)
  - **Desabilitado**: opacidade reduzida (`buttonDisabled`)

## Estilos

Definidos em `./styles.ts` (arquivo separado dentro do mesmo diretório):

| Classe          | Descrição                                          |
|-----------------|----------------------------------------------------|
| `itemRow`       | Layout horizontal, espaçamento vertical, borda inferior |
| `dangerButton`  | Botão vermelho claro com bordas arredondadas        |
| `buttonPressed` | Feedback visual de toque                           |
| `buttonDisabled`| Estado desabilitado                                |

## Uso por contexto na tela principal

| Seção          | `title`          | `onPress`   |
|----------------|------------------|-------------|
| Active todos   | `todo.title`     | `deleteTodo`|
| Deleted todos  | `todo.title`     | —           |
| Outbox items   | `item.payload`   | —           |

## Dependências

- `react-native` — `Pressable`
- `@/components/themed-text` — `ThemedText`
- `@/components/themed-view` — `ThemedView`
- `./styles` — estilos do componente
