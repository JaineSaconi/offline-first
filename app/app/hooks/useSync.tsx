import { useCallback } from "react";
import { useMMKVBoolean } from "react-native-mmkv";
import { runSync } from "../sync/sync-engine";
import { syncStorage, SYNC_KEYS } from "../store/sync-store";

export function useSync() {
  const [isRunning] = useMMKVBoolean(SYNC_KEYS.IS_RUNNING, syncStorage);

  const sync = useCallback(async () => {
    await runSync();
  }, []);

  return { sync, isRunning: isRunning ?? false };
}
