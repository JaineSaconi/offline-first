import { useState, useMemo } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import styles from "@/styles/sqlite";

import { useUsers } from "./hooks/useUsers";
import { HeaderInsert } from "./components/HeaderInsert";
import { ItemListHome } from "./components/ItemListHome/ItemListHome";
import { Toast } from "./components/Toast";
import { OutboxItem } from "./interfaces/outbox";

type ToastState = { success: boolean; toastKey: number } | null;

function formatOutboxLabel(item: OutboxItem): string {
  try {
    const data = JSON.parse(item.payload) as { name?: string };
    const label = data.name ?? item.entityId;
    return `[${item.status}] ${item.type}: ${label}`;
  } catch {
    return `[${item.status}] ${item.type}: ${item.entityId}`;
  }
}

export default function SQLiteScreen() {
  const { todos, outboxItems, error, loading, addTodo, deleteTodo, refresh } =
    useUsers();
  const [toast, setToast] = useState<ToastState>(null);

  const activeTodos = useMemo(
    () => todos.filter((todo) => (todo.deleted ?? 0) === 0),
    [todos],
  );
  const deletedTodos = useMemo(
    () => todos.filter((todo) => (todo.deleted ?? 0) === 1),
    [todos],
  );

  async function handleAdd(name: string): Promise<boolean> {
    const ok = await addTodo(name);
    setToast({ success: ok, toastKey: Date.now() });
    return ok;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ThemedText type="title">SQLite Playground</ThemedText>
      <ThemedText type="subtitle">Insert, list, and delete records.</ThemedText>

      <HeaderInsert loading={loading} onAdd={handleAdd} onRefresh={refresh} />

      {error ? (
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      ) : (
        <ThemedText type="defaultSemiBold">{`Rows: ${todos.length}`}</ThemedText>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.list}>
          <ThemedText type="subtitle">Active</ThemedText>
          {activeTodos.map((todo) => (
            <ItemListHome
              key={todo.id}
              title={todo.name}
              loading={loading}
              onPress={() => deleteTodo(todo.id)}
            />
          ))}

          <ThemedText type="subtitle">Deleted</ThemedText>
          {deletedTodos.map((todo) => (
            <ItemListHome key={todo.id} title={todo.name} loading={loading} />
          ))}

          <ThemedText type="subtitle">Outbox</ThemedText>
          {outboxItems.map((item) => (
            <ItemListHome
              key={item.id}
              title={formatOutboxLabel(item)}
              loading={loading}
            />
          ))}
        </ThemedView>
      </ScrollView>

      {toast && <Toast success={toast.success} toastKey={toast.toastKey} />}
    </SafeAreaView>
  );
}
