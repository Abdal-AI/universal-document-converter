/**
 * db.js — Lightweight JSON database using lowdb
 *
 * Stores user records in server/data/users.json
 * No native compilation required — works on any platform.
 *
 * Schema per user:
 *   { id, name, email, password (bcrypt hash), createdAt }
 */

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Ensure the data directory exists
const dataDir = join(__dirname, 'data');
mkdirSync(dataDir, { recursive: true });

const dbFile = join(dataDir, 'users.json');

// Default database shape
const defaultData = { users: [] };

// Create and initialise the database adapter
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, defaultData);

/**
 * Initialise the database — must be called before using db.data
 * Reads the JSON file and merges with defaultData.
 */
export async function initDb() {
  await db.read();
  // Ensure the users array always exists even on a fresh file
  db.data ??= defaultData;
  db.data.users ??= [];
  await db.write();
}

export default db;
