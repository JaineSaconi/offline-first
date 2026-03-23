import { MMKV } from "react-native-mmkv";

export const syncStorage = new MMKV({ id: "sync-store" });

export const SYNC_KEYS = {
  IS_RUNNING: "sync.isRunning",
  LAST_SYNC_AT: "sync.lastSyncAt",
} as const;
