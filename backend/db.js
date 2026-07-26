const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'snap2find.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    category TEXT,
    image_path TEXT,
    embedding TEXT,
    phone_number TEXT,
    description TEXT,
    status TEXT DEFAULT 'unclaimed',
    claimed_by_phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visited_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;