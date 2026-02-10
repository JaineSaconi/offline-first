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
      created_at INTEGER NOT NULL
    );
  `);
}
