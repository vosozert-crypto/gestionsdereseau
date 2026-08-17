import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const dbDir = path.resolve(config.db.path, '..');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(path.resolve(config.db.path));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    initSchema();
  }
  return db;
}

function initSchema(): void {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const transaction = db.transaction(() => {
    for (const stmt of statements) {
      db.exec(stmt + ';');
    }
  });

  transaction();
}

export function closeDb(): void {
  if (db) {
    db.close();
  }
}
