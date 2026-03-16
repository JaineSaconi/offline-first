import * as Crypto from "expo-crypto";
import { getDatabase } from "@/db/db";
import { UserDB } from "../interfaces/user";

export class UserRepository {
  async loadAll(): Promise<UserDB[]> {
    const db = await getDatabase();
    return db.getAllAsync<UserDB>(
      "SELECT id, name, createdAt, dirty, updatedAt, deleted, serverVersion FROM todos ORDER BY createdAt DESC;",
    );
  }

  async add(name: string): Promise<string> {
    const db = await getDatabase();
    const id = Crypto.randomUUID();
    const now = Date.now();

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        "INSERT INTO todos (id, name, createdAt, updatedAt, dirty, deleted) VALUES (?, ?, ?, ?, 0, 0);",
        [id, name, now, now],
      );
      await db.runAsync(
        "INSERT INTO outbox (id, entity, entityId, type, payload, createdAt, nextRetryAt, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
        [
          Crypto.randomUUID(),
          "user",
          id,
          "UPSERT",
          JSON.stringify({ id, name }),
          now,
          now,
          "PENDING",
        ],
      );
    });

    return id;
  }

  async markDeleted(id: string): Promise<void> {
    const db = await getDatabase();
    const now = Date.now();

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        "UPDATE todos SET dirty = 1, deleted = 1, updatedAt = ? WHERE id = ?;",
        [now, id],
      );
      await db.runAsync(
        "INSERT INTO outbox (id, entity, entityId, type, payload, createdAt, nextRetryAt, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
        [
          Crypto.randomUUID(),
          "user",
          id,
          "DELETE",
          JSON.stringify({ id }),
          now,
          now,
          "PENDING",
        ],
      );
    });
  }

  async markSynced(todoId: string, serverVersion: number | null): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE todos SET dirty = 0, serverVersion = ? WHERE id = ?;",
      [serverVersion, todoId],
    );
  }
}
