import { Pressable, TextInput } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import styles from "@/styles/sqlite";

type HeaderInsertProps = {
  title: string;
  loading: boolean;
  onChangeTitle: (value: string) => void;
  onAddTodo?: () => void;
  onRefresh: () => void;
};

export function HeaderInsert({
  title,
  loading,
  onChangeTitle,
  onAddTodo,
  onRefresh,
}: HeaderInsertProps) {
  return (
    <>
      <ThemedView style={styles.row}>
        <TextInput
          value={title}
          onChangeText={onChangeTitle}
          placeholder="insert"
          autoCapitalize="sentences"
          style={styles.input}
        />
        {onAddTodo ? (
          <Pressable
            disabled={loading}
            onPress={onAddTodo}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
          >
            <ThemedText type="defaultSemiBold">Add</ThemedText>
          </Pressable>
        ) : null}
      </ThemedView>

      <ThemedView style={styles.actionsRow}>
        <Pressable
          disabled={loading}
          onPress={onRefresh}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}
        >
          <ThemedText type="defaultSemiBold">Refresh</ThemedText>
        </Pressable>
      </ThemedView>
    </>
  );
}
