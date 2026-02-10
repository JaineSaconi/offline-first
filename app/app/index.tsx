import { useEffect, useState } from "react";
import { Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getDatabase } from "@/lib/db";
import styles from "@/styles/sqlite";

type Todo = {
  id: number;
  title: string;
  created_at: number;
};

export default function SQLiteScreen() {
  const [title, setTitle] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadTodos() {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Todo>(
      "SELECT id, title, created_at FROM todos ORDER BY created_at DESC;",
    );
    setTodos(rows);
  }

  async function addTodo() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const db = await getDatabase();
      await db.runAsync(
        "INSERT INTO todos (title, created_at) VALUES (?, ?);",
        [trimmed, Date.now()],
      );
      setTitle("");
      await loadTodos();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to insert todo.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteTodo(id: number) {
    setLoading(true);
    try {
      const db = await getDatabase();
      await db.runAsync("DELETE FROM todos WHERE id = ?;", [id]);
      await loadTodos();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete todo.");
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setLoading(true);
    try {
      await loadTodos();
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load todos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

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
        {todos.map((todo) => (
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
      </ThemedView>
    </SafeAreaView>
  );
}
