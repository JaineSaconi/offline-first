import * as SQLite from "expo-sqlite";
import { migrateTodos } from "./migration/todos";
import { migrateOutbox } from "./migration/outbox";


const databasePromise = SQLite.openDatabaseAsync("app.db");

export async function getDatabase() {
  return databasePromise;
}

export async function migrateDatabase() {
  const db = await getDatabase();

  // Performance + consistência
  await db.execAsync("PRAGMA journal_mode = WAL;");
  await db.execAsync("PRAGMA foreign_keys = ON;");

  // Migrations (ordem importa se tiver FKs no futuro)
  await migrateTodos(db);
  await migrateOutbox(db);
}