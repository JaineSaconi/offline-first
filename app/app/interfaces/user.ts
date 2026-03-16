export interface UserDB {
  id: string;
  name: string;
  createdAt: number;
  dirty: 0 | 1;
  updatedAt?: number;
  deleted?: 0 | 1;
  serverVersion?: number;
}
