import type { SQLiteDatabase } from "expo-sqlite";

export async function migrateOutbox(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS outbox (
      id TEXT PRIMARY KEY NOT NULL,
      entity TEXT NOT NULL,
      entityId TEXT NOT NULL,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      nextRetryAt INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      lastError TEXT,
      dedupeKey TEXT,
      doneAt INTEGER
    );
  `);

  // Dedupe: uma ação pendente por "dedupeKey" (ex: todo:{id}:upsert)
  await db.execAsync(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_outbox_dedupeKey
    ON outbox(dedupeKey)
    WHERE dedupeKey IS NOT NULL;
  `);

  // Índices para o SyncEngine buscar PENDING rapidamente
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_outbox_status_nextRetryAt ON outbox(status, nextRetryAt);`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_outbox_createdAt ON outbox(createdAt);`);
}