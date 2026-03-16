import { useCallback, useRef } from "react";
import { SyncEngine } from "../sync/sync-engine";

export function useSync() {
  const engine = useRef(new SyncEngine()).current;

  const sync = useCallback(async () => {
    await engine.run();
  }, [engine]);

  return { sync };
}
