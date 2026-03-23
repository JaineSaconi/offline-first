const db = require('../db/db');

const findUser   = db.prepare('SELECT * FROM users WHERE id = ?');
const upsertUser = db.prepare(`
  INSERT INTO users (id, name, createdAt, updatedAt, deleted, version)
  VALUES (@id, @name, @createdAt, @updatedAt, 0, 1)
  ON CONFLICT(id) DO UPDATE SET
    name      = excluded.name,
    updatedAt = excluded.updatedAt,
    version   = version + 1
`);
const softDelete = db.prepare(`
  UPDATE users SET deleted = 1, updatedAt = @updatedAt, version = version + 1
  WHERE id = @id
`);
const logOutbox = db.prepare(`
  INSERT INTO outbox_log (id, entityId, type, payload, status)
  VALUES (@id, @entityId, @type, @payload, @status)
`);

const processBatch = db.transaction((items) => {
  const results = [];

  for (const item of items) {
    const existing = findUser.get(item.entityId);

    if (existing && item.payload?.updatedAt && item.payload.updatedAt < existing.updatedAt) {
      logOutbox.run({
        id:       item.outboxId,
        entityId: item.entityId,
        type:     item.type,
        payload:  JSON.stringify(item.payload ?? null),
        status:   'CONFLICT',
      });
      results.push({ outboxId: item.outboxId, status: 'conflict', serverData: existing });
      continue;
    }

    if (item.type === 'UPSERT') {
      upsertUser.run({ ...item.payload });
    } else if (item.type === 'DELETE') {
      softDelete.run({ id: item.entityId, updatedAt: Date.now() });
    }

    const updated = findUser.get(item.entityId);
    logOutbox.run({
      id:       item.outboxId,
      entityId: item.entityId,
      type:     item.type,
      payload:  JSON.stringify(item.payload ?? null),
      status:   'OK',
    });
    results.push({ outboxId: item.outboxId, status: 'ok', version: updated?.version ?? 1 });
  }

  return results;
});

exports.push = (req, res, next) => {
  try {
    const results = processBatch(req.validatedBody.items);
    res.json({ results });
  } catch (err) {
    next(err);
  }
};

exports.pull = (req, res, next) => {
  try {
    const since = Number(req.query.since) || 0;
    const rows = db.prepare('SELECT * FROM users WHERE updatedAt > ?').all(since);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};
