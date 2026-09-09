import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = process.env.DB_PATH || "./data/meet.db";

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (_db) return _db;
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA busy_timeout = 5000");
  db.exec(`
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  dates TEXT NOT NULL,
  start TEXT NOT NULL,
  end TEXT NOT NULL,
  step INTEGER NOT NULL DEFAULT 30,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS responses (
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slots TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (event_id, name)
);
CREATE INDEX IF NOT EXISTS idx_responses_event ON responses(event_id);
CREATE TABLE IF NOT EXISTS admin_users (
  email TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);
  const admin = db.prepare("SELECT email FROM admin_users WHERE email = ?").get("keviniogt02@gmail.com");
  if (!admin) {
    db.prepare("INSERT INTO admin_users (email, password_hash) VALUES (?, ?)").run(
      "keviniogt02@gmail.com",
      "250ad69721a8adf79bb1aa87ed6e0dd7:2c537c3cae0858c7f46cad081ca1b32b127028894366b00f45f2d8b2d146ca561062c9440de77d4ce5847f57e842ec70c00d0a80e26a67c284f976664d3dafcb"
    );
  }
  _db = db;
  return db;
}