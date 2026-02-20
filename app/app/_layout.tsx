import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { migrateDatabase } from "@/lib/db";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { migrateOutboxDatabase } from "@/lib/outbox_db";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    migrateDatabase().catch((error) => {
      console.error("Failed to migrate database", error);
    });
    migrateOutboxDatabase().catch((error) => {
      console.error("Failed to migrate outbox database", error);
    });
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
