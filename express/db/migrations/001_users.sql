CREATE TABLE IF NOT EXISTS users (
  id          TEXT    PRIMARY KEY NOT NULL,
  name        TEXT    NOT NULL,
  createdAt   INTEGER NOT NULL,
  updatedAt   INTEGER NOT NULL,
  deleted     INTEGER NOT NULL DEFAULT 0,
  version     INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_users_updatedAt ON users(updatedAt);
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted);
