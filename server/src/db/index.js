// server/src/db/index.js
// Singleton database connection. Import { db } everywhere you need DB access.
// Uses Node's built-in node:sqlite (Node 22+) — no native build step required.

import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { applySchema } from './schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = join(__dirname, '..', '..', 'data');
const DEFAULT_DB_PATH = join(DEFAULT_DATA_DIR, 'sharespot.db');

const DB_PATH = process.env.DB_PATH ? resolve(process.env.DB_PATH) : DEFAULT_DB_PATH;
const dbDir = dirname(DB_PATH);

// Ensure database directory exists
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

// Apply schema on startup (idempotent — IF NOT EXISTS)
applySchema(db);

console.log(`[DB] Connected → ${DB_PATH}`);

export { db, DB_PATH };
