import { getDatabase } from "@/db/db";
import { OutboxItem } from "../interfaces/outbox";
import { OutboxRepository } from "../data/outbox-repository";
import { UserRepository } from "../data/user-repository";

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

export class SyncEngine {
  private isRunning = false;
  private outboxRepo = new OutboxRepository();
  private userRepo = new UserRepository();

  async run(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      await this.processQueue();
    } finally {
      this.isRunning = false;
    }
  }

  private async processQueue(): Promise<void> {
    const items = await this.outboxRepo.getPendingItems();
    for (const item of items) {
      await this.processItem(item);
    }
  }

  private async processItem(item: OutboxItem): Promise<void> {
    try {
      await this.outboxRepo.markInFlight(item.id);

      if (item.entity === "user") {
        if (item.type === "UPSERT") {
          // await api.upsertUser(JSON.parse(item.payload))
        } else if (item.type === "DELETE") {
          // await api.deleteUser(item.entityId)
        }
      }

      await this.markSuccess(item);
    } catch (error) {
      await this.markFailure(item, error);
    }
  }

  private async markSuccess(item: OutboxItem): Promise<void> {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      if (item.entity === "user") {
        await this.userRepo.markSynced(item.entityId, null);
      }
      await this.outboxRepo.markDone(item.id);
    });
  }

  private async markFailure(item: OutboxItem, error: unknown): Promise<void> {
    const attempts = (item.attempts ?? 0) + 1;

    if (isTransientError(error)) {
      const nextRetryAt = Date.now() + computeBackoffMs(attempts);
      await this.outboxRepo.updateRetry(
        item.id,
        attempts,
        nextRetryAt,
        extractErrorMessage(error),
      );
      return;
    }

    await this.outboxRepo.markFailed(item.id, extractErrorMessage(error));
  }
}
