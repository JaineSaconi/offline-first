import * as SQLite from "expo-sqlite";

const databasePromise = SQLite.openDatabaseAsync("app.db");

export async function getDatabase() {
  return databasePromise;
}

export async function migrateDatabase() {
  const db = await getDatabase();

  // permite leitura e escrita simultâneas, melhorando a performance em muitos casos
  await db.execAsync("PRAGMA journal_mode = WAL;");

  // garante que as chaves estrangeiras sejam respeitadas, evitando inconsistências
  await db.execAsync("PRAGMA foreign_keys = ON;");

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      dirty INTEGER NOT NULL DEFAULT 0,
      deleted INTEGER NOT NULL DEFAULT 0,
      updatedAt INTEGER,
      serverVersion INTEGER NOT NULL DEFAULT 0
    );
  `);

  const tableInfo = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(todos);",
  );
  const columns = new Set(tableInfo.map((column) => column.name));

  if (!columns.has("dirty")) {
    await db.execAsync(
      "ALTER TABLE todos ADD COLUMN dirty INTEGER NOT NULL DEFAULT 0;",
    );
  }
  if (!columns.has("deleted")) {
    await db.execAsync(
      "ALTER TABLE todos ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0;",
    );
  }
  if (!columns.has("updatedAt")) {
    await db.execAsync("ALTER TABLE todos ADD COLUMN updatedAt INTEGER;");
  }
  if (!columns.has("serverVersion")) {
    await db.execAsync(
      "ALTER TABLE todos ADD COLUMN serverVersion INTEGER NOT NULL DEFAULT 0;",
    );
  }
}
