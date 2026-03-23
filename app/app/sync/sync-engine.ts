import { getDatabase } from "@/db/db";
import { OutboxItem } from "../interfaces/outbox";
import {
  getPendingItems,
  markInFlight,
  markDone,
  updateRetry,
  markFailed,
} from "../data/outbox-repository";
import { markSynced } from "../data/user-repository";
import { syncStorage, SYNC_KEYS } from "../store/sync-store";

function extractErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isTransientError(err: unknown): boolean {
  // TODO: diferenciar 4xx (permanente) vs timeout/5xx/offline (transitório)
  return true;
}

function computeBackoffMs(attempts: number): number {
  const base = 1000; // 1s
  const cap = 2 * 60 * 1000; // 2min
  const exp = Math.min(cap, base * 2 ** Math.max(0, attempts - 1));
  const jitter = Math.random() * 0.3 * exp;
  return Math.floor(exp + jitter);
}

async function handleSuccess(item: OutboxItem): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    if (item.entity === "user") {
      await markSynced(item.entityId, null);
    }
    await markDone(item.id);
  });
}

async function handleFailure(item: OutboxItem, error: unknown): Promise<void> {
  const attempts = (item.attempts ?? 0) + 1;

  if (isTransientError(error)) {
    const nextRetryAt = Date.now() + computeBackoffMs(attempts);
    await updateRetry(
      item.id,
      attempts,
      nextRetryAt,
      extractErrorMessage(error),
    );
    return;
  }

  await markFailed(item.id, extractErrorMessage(error));
}

async function processItem(item: OutboxItem): Promise<void> {
  try {
    await markInFlight(item.id);

    if (item.entity === "user") {
      if (item.type === "UPSERT") {
        // await api.upsertUser(JSON.parse(item.payload))
      } else if (item.type === "DELETE") {
        // await api.deleteUser(item.entityId)
      }
    }

    await handleSuccess(item);
  } catch (error) {
    await handleFailure(item, error);
  }
}

async function processQueue(): Promise<void> {
  const items = await getPendingItems();
  for (const item of items) {
    await processItem(item);
  }
}

export async function runSync(): Promise<void> {
  if (syncStorage.getBoolean(SYNC_KEYS.IS_RUNNING)) return;
  syncStorage.set(SYNC_KEYS.IS_RUNNING, true);

  try {
    await processQueue();
  } finally {
    syncStorage.set(SYNC_KEYS.IS_RUNNING, false);
    syncStorage.set(SYNC_KEYS.LAST_SYNC_AT, Date.now());
  }
}
