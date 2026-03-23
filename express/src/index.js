require('dotenv').config();

const app = require('./app');
const db  = require('./db/db');
const fs  = require('fs');

const PORT    = process.env.PORT || 3000;
const DB_PATH = db.name; // better-sqlite3 exposes the file path via .name

// WAL checkpoint: force when WAL file exceeds 10 MB
setInterval(() => {
  try {
    const stat = fs.statSync(`${DB_PATH}-wal`, { throwIfNoEntry: false });
    if (stat && stat.size > 10 * 1024 * 1024) {
      db.pragma('wal_checkpoint(RESTART)');
    }
  } catch (_) {}
}, 30_000).unref();

app.listen(PORT, () => {
  console.log(`[server] rodando em http://localhost:${PORT}`);
});
