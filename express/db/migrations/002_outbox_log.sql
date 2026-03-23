CREATE TABLE IF NOT EXISTS outbox_log (
  id          TEXT    PRIMARY KEY NOT NULL,
  entityId    TEXT    NOT NULL,
  type        TEXT    NOT NULL CHECK(type IN ('UPSERT', 'DELETE')),
  payload     TEXT    NOT NULL,
  receivedAt  INTEGER NOT NULL DEFAULT (unixepoch()),
  status      TEXT    NOT NULL DEFAULT 'OK'
                      CHECK(status IN ('OK', 'CONFLICT', 'ERROR'))
);

CREATE INDEX IF NOT EXISTS idx_outbox_log_entityId   ON outbox_log(entityId);
CREATE INDEX IF NOT EXISTS idx_outbox_log_receivedAt ON outbox_log(receivedAt);
