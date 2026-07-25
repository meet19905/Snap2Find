const Database = require('better-sqlite3');
const path = require('path');

// This creates (or opens if it already exists) a file called snap2find.db
const db = new Database(path.join(__dirname, 'snap2find.db'));

// Create the "items" table if it doesn't already exist
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,              -- 'found' or 'lost'
    category TEXT,
    image_path TEXT,
    embedding TEXT,                  -- stored as JSON string
    phone_number TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;