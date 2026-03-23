import { getDatabase } from "@/db/db";
import { OutboxItem } from "../interfaces/outbox";

export async function loadAllOutboxItems(): Promise<OutboxItem[]> {
  const db = await getDatabase();
  return db.getAllAsync<OutboxItem>(
    "SELECT * FROM outbox ORDER BY createdAt DESC;",
  );
}

export async function getPendingItems(): Promise<OutboxItem[]> {
  const db = await getDatabase();
  const now = Date.now();
  return db.getAllAsync<OutboxItem>(
    `SELECT * FROM outbox
     WHERE status = 'PENDING'
       AND nextRetryAt <= ?
     ORDER BY createdAt ASC
     LIMIT 20`,
    [now],
  );
}

export async function markInFlight(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE outbox SET status = 'IN_FLIGHT' WHERE id = ?;",
    [id],
  );
}

export async function markDone(outboxId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE outbox SET status = 'DONE', doneAt = ?, lastError = NULL WHERE id = ?;",
    [Date.now(), outboxId],
  );
}

export async function updateRetry(
  id: string,
  attempts: number,
  nextRetryAt: number,
  lastError: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE outbox SET status = 'PENDING', attempts = ?, nextRetryAt = ?, lastError = ? WHERE id = ?;",
    [attempts, nextRetryAt, lastError, id],
  );
}

export async function markFailed(id: string, lastError: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE outbox SET status = 'FAILED', lastError = ? WHERE id = ?;",
    [lastError, id],
  );
}
