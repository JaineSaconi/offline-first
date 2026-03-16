import { Pressable, TextInput, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import styles from "@/styles/sqlite";

type FormValues = {
  name: string;
};

type HeaderInsertProps = {
  loading: boolean;
  onAdd: (name: string) => Promise<boolean>;
  onRefresh: () => void;
};

export function HeaderInsert({ loading, onAdd, onRefresh }: HeaderInsertProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: { name: "" },
  });

  const submit = handleSubmit(async ({ name }) => {
    const ok = await onAdd(name);
    if (ok) reset();
  });

  const hasError = !!errors.name;
  const isDisabled = loading || !isValid;

  return (
    <>
      <ThemedView style={styles.row}>
        <Controller
          control={control}
          name="name"
          rules={{
            required: true,
            minLength: { value: 3, message: "Mínimo 3 caracteres" },
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="Name"
              autoCapitalize="sentences"
              style={[styles.input, hasError && localStyles.inputError]}
            />
          )}
        />

        <Pressable
          disabled={isDisabled}
          onPress={submit}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            isDisabled && localStyles.buttonGray,
          ]}
        >
          <ThemedText type="defaultSemiBold">Add</ThemedText>
        </Pressable>
      </ThemedView>

      {hasError && (
        <ThemedText style={localStyles.errorText}>
          {errors.name?.message}
        </ThemedText>
      )}

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

const localStyles = StyleSheet.create({
  inputError: {
    borderColor: "#f44336",
    borderWidth: 2,
  },
  buttonGray: {
    backgroundColor: "#d0d0d0",
    opacity: 0.7,
  },
  errorText: {
    color: "#f44336",
    fontSize: 12,
    marginTop: -4,
  },
});
