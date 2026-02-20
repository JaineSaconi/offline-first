import { Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import styles from "@/styles/sqlite";

import { useUsers } from "./hooks/useUsers";
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

      <ThemedView style={styles.row}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="New todo"
          autoCapitalize="sentences"
          style={styles.input}
        />
        <Pressable
          disabled={loading}
          onPress={addTodo}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}
        >
          <ThemedText type="defaultSemiBold">Add</ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedView style={styles.actionsRow}>
        <Pressable
          disabled={loading}
          onPress={refresh}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}
        >
          <ThemedText type="defaultSemiBold">Refresh</ThemedText>
        </Pressable>
      </ThemedView>

      {error ? (
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      ) : (
        <ThemedText type="defaultSemiBold">{`Rows: ${todos.length}`}</ThemedText>
      )}

      <ThemedView style={styles.list}>
        <ThemedText type="subtitle">Active</ThemedText>
        {activeTodos.map((todo) => (
          <ThemedView key={todo.id} style={styles.itemRow}>
            <ThemedText>{todo.title}</ThemedText>
            <Pressable
              disabled={loading}
              onPress={() => deleteTodo(todo.id)}
              style={({ pressed }) => [
                styles.dangerButton,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
            >
              <ThemedText type="defaultSemiBold">Delete</ThemedText>
            </Pressable>
          </ThemedView>
        ))}

        <ThemedText type="subtitle">Deleted</ThemedText>
        {deletedTodos.map((todo) => (
          <ThemedView key={todo.id} style={styles.itemRow}>
            <ThemedText>{todo.title}</ThemedText>
          </ThemedView>
        ))}
      </ThemedView>
    </SafeAreaView>
  );
}
