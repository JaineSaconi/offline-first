import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import styles from "@/styles/sqlite";

import { useUsers } from "./hooks/useUsers";
import { HeaderInsert } from "./components/HeaderInsert";
import { ItemListHome } from "./components/ItemListHome/ItemListHome";
import { useMemo } from "react";

export default function SQLiteScreen() {
  const { title, setTitle, todos, error, loading, addTodo, deleteTodo, refresh } =
    useUsers();
  const activeTodos = useMemo(() => {return todos.filter((todo) => (todo.deleted ?? 0) === 0)}, [todos]);
  const deletedTodos = useMemo(() => { return todos.filter((todo) => (todo.deleted ?? 0) === 1)}, [todos]);

  return (
    <SafeAreaView style={styles.container}>
      <ThemedText type="title">SQLite Playground</ThemedText>
      <ThemedText type="subtitle">Insert, list, and delete records.</ThemedText>

      <HeaderInsert
        title={title}
        loading={loading}
        onChangeTitle={setTitle}
        onAddTodo={addTodo}
        onRefresh={refresh}
      />

      {error ? (
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      ) : (
        <ThemedText type="defaultSemiBold">{`Rows: ${todos.length}`}</ThemedText>
      )}

      <ThemedView style={styles.list}>
        <ThemedText type="subtitle">Active</ThemedText>
        {activeTodos.map((todo) => (
          <ItemListHome
            key={todo.id}
            title={todo.title}
            loading={loading}
            onPress={() => deleteTodo(todo.id)}
          />
        ))}

        <ThemedText type="subtitle">Deleted</ThemedText>
        {deletedTodos.map((todo) => (
          <ItemListHome
            key={todo.id}
            title={todo.title}
            loading={loading}
          />
          
        ))}
      </ThemedView>
    </SafeAreaView>
  );
}
