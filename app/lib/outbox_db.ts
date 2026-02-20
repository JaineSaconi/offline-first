import * as SQLite from "expo-sqlite";

const outboxDatabasePromise = SQLite.openDatabaseAsync("outbox.db");

export async function getOutboxDatabase() {
  return outboxDatabasePromise;
}

export async function migrateOutboxDatabase() {
  const db = await getOutboxDatabase();

  await db.execAsync("PRAGMA journal_mode = WAL;");
  await db.execAsync("PRAGMA foreign_keys = ON;");

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS outbox (
      id INTEGER PRIMARY KEY NOT NULL,
      entity TEXT NOT NULL,
      entityId TEXT NOT NULL,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      nextRetryAt INTEGER,
      status TEXT NOT NULL DEFAULT 'pending',
      lastError TEXT,
      dedupekey TEXT,
      doneAt  INTEGER
    );
  `);
}
