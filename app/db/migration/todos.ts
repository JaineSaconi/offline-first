import type { SQLiteDatabase } from "expo-sqlite";

export async function migrateTodos(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      dirty INTEGER NOT NULL DEFAULT 0,
      deleted INTEGER NOT NULL DEFAULT 0,
      serverVersion INTEGER
    );
  `);

  // Renomeia coluna legada "title" para "name" em bancos já existentes
  try {
    await db.execAsync(`ALTER TABLE todos RENAME COLUMN title TO name;`);
  } catch {
    // Coluna já foi renomeada ou não existe — ignora
  }

  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_todos_deleted ON todos(deleted);`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_todos_dirty ON todos(dirty);`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_todos_updatedAt ON todos(updatedAt);`);
}
