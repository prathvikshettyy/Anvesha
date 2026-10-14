// server/src/db/index.js
// Singleton database connection. Import { db } everywhere you need DB access.

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { applySchema } from './schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');
const DB_PATH = join(DATA_DIR, 'sharespot.db');

// Ensure data/ directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Apply schema on startup (idempotent — IF NOT EXISTS)
applySchema(db);

console.log(`[DB] Connected → ${DB_PATH}`);

export { db };
