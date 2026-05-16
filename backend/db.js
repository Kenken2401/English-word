import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'vocab.db');

export const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL UNIQUE COLLATE NOCASE,
    part_of_speech TEXT,
    definition TEXT,
    prepositions TEXT,
    grammar_notes TEXT,
    examples TEXT,
    is_default INTEGER DEFAULT 0,
    enriched INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export async function initDb(seedWords) {
  const count = db.prepare('SELECT COUNT(*) as count FROM words').get();
  if (count.count === 0) {
    console.log('Seeding database with', seedWords.length, 'words...');
    const insert = db.prepare(`
      INSERT OR IGNORE INTO words (word, part_of_speech, definition, prepositions, grammar_notes, examples, is_default, enriched)
      VALUES (@word, @part_of_speech, @definition, @prepositions, @grammar_notes, @examples, @is_default, @enriched)
    `);
    const insertMany = db.transaction((words) => {
      for (const word of words) {
        insert.run(word);
      }
    });
    insertMany(seedWords);
    console.log('Database seeded successfully.');
  } else {
    console.log('Database already contains', count.count, 'words. Skipping seed.');
  }
}
