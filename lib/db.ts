import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "companion.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sent_at TEXT NOT NULL,
        message_text TEXT NOT NULL,
        theme TEXT,
        tone TEXT
      );

      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        recipient_gender TEXT NOT NULL,
        recipient_context TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL
      );
    `);
  }
  return db;
}

export interface Message {
  id: number;
  sent_at: string;
  message_text: string;
  theme: string | null;
  tone: string | null;
}

export function getRecentMessages(limit: number): Message[] {
  const database = getDb();
  const stmt = database.prepare(
    `SELECT id, sent_at, message_text, theme, tone
     FROM messages
     ORDER BY sent_at DESC
     LIMIT ?`
  );
  return stmt.all(limit) as Message[];
}

export function saveMessage(
  message_text: string,
  theme: string,
  tone: string
): void {
  const database = getDb();
  const stmt = database.prepare(
    `INSERT INTO messages (sent_at, message_text, theme, tone)
     VALUES (?, ?, ?, ?)`
  );
  stmt.run(new Date().toISOString(), message_text, theme, tone);
}

export type RecipientGender = "female" | "male";

export interface RecipientSettings {
  recipient_gender: RecipientGender;
  recipient_context: string;
  updated_at: string;
}

const VALID_GENDERS = new Set<RecipientGender>(["female", "male"]);

export function isValidGender(value: string): value is RecipientGender {
  return VALID_GENDERS.has(value as RecipientGender);
}

export function getSettings(): RecipientSettings | null {
  const database = getDb();
  const stmt = database.prepare(
    `SELECT recipient_gender, recipient_context, updated_at
     FROM settings
     WHERE id = 1`
  );
  const row = stmt.get() as RecipientSettings | undefined;
  if (!row || !isValidGender(row.recipient_gender)) return null;
  return row;
}

export function saveSettings(
  recipient_gender: RecipientGender,
  recipient_context: string
): RecipientSettings {
  const database = getDb();
  const updated_at = new Date().toISOString();
  const stmt = database.prepare(
    `INSERT INTO settings (id, recipient_gender, recipient_context, updated_at)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       recipient_gender = excluded.recipient_gender,
       recipient_context = excluded.recipient_context,
       updated_at = excluded.updated_at`
  );
  stmt.run(recipient_gender, recipient_context.trim(), updated_at);
  return { recipient_gender, recipient_context: recipient_context.trim(), updated_at };
}

export function getRecentThemes(limit: number): string[] {
  const database = getDb();
  const stmt = database.prepare(
    `SELECT theme FROM messages
     WHERE theme IS NOT NULL AND theme != ''
     ORDER BY sent_at DESC
     LIMIT ?`
  );
  const rows = stmt.all(limit) as { theme: string }[];
  return rows.map((row) => row.theme);
}
