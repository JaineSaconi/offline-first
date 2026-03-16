export interface OutboxItem {
  id: string;
  entity: string;
  entityId: string;
  type: string;
  payload: string;
  createdAt: number;
  attempts: number;
  nextRetryAt: number;
  status: string;
  lastError: string | null;
  dedupeKey: string | null;
  doneAt: number | null;
}
