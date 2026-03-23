const db = require('../db/db');

const listUsers = db.prepare('SELECT * FROM users WHERE deleted = 0');
const listUsersSince = db.prepare('SELECT * FROM users WHERE deleted = 0 AND updatedAt > ?');
const findUserById = db.prepare('SELECT * FROM users WHERE id = ?');
const insertUser = db.prepare(`
  INSERT INTO users (id, name, createdAt, updatedAt, deleted, version)
  VALUES (@id, @name, @createdAt, @updatedAt, 0, 1)
`);
const updateUser = db.prepare(`
  UPDATE users SET name = @name, updatedAt = @updatedAt, version = version + 1
  WHERE id = @id AND deleted = 0
`);
const softDeleteUser = db.prepare(`
  UPDATE users SET deleted = 1, updatedAt = @updatedAt, version = version + 1
  WHERE id = @id
`);

exports.list = (req, res, next) => {
  try {
    const { since } = req.query;
    const rows = since
      ? listUsersSince.all(Number(since))
      : listUsers.all();
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.create = (req, res, next) => {
  try {
    const data = req.validatedBody;
    insertUser.run(data);
    res.status(201).json({ id: data.id, version: 1 });
  } catch (err) {
    next(err);
  }
};

exports.update = (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.validatedBody;
    const result = updateUser.run({ id, name: data.name, updatedAt: data.updatedAt });

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const updated = findUserById.get(id);
    res.json({ id, version: updated.version });
  } catch (err) {
    next(err);
  }
};

exports.remove = (req, res, next) => {
  try {
    const { id } = req.params;
    const result = softDeleteUser.run({ id, updatedAt: Date.now() });

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
