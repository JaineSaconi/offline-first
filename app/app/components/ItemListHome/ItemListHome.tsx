import { Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import styles from "./styles";

type ItemListHomeProps = {
  title: string;
  loading: boolean;
  onPress?: () => void;
};

export function ItemListHome({ title, loading, onPress }: ItemListHomeProps) {
  return (
    <ThemedView style={styles.itemRow}>
      <ThemedText>{title}</ThemedText>
      { onPress && (

        <Pressable
        disabled={loading}
        onPress={() => onPress?.()}
        style={({ pressed }) => [
          styles.dangerButton,
          pressed && styles.buttonPressed,
          loading && styles.buttonDisabled,
        ]}
        >
        <ThemedText type="defaultSemiBold">Delete</ThemedText>
      </Pressable>
      )}
    </ThemedView>
  );
}
