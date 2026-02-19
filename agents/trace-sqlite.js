// SQLite helper for trace persistence
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function openTraceDB(dbPath = '.bottok_traces.sqlite') {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  await db.exec(`CREATE TABLE IF NOT EXISTS traces (
    id TEXT PRIMARY KEY,
    ts INTEGER,
    source TEXT,
    prompt TEXT,
    trace TEXT,
    ok INTEGER
  )`);
  return db;
}

export async function insertTrace(db, rec) {
  await db.run(
    `INSERT INTO traces (id, ts, source, prompt, trace, ok) VALUES (?, ?, ?, ?, ?, ?)`,
    rec.id,
    rec.ts,
    rec.source || '',
    rec.prompt || '',
    JSON.stringify(rec.trace || {}),
    rec.ok ? 1 : 0
  );
}

export async function getRecentTraces(db, limit = 50) {
  const rows = await db.all(
    `SELECT * FROM traces ORDER BY ts DESC LIMIT ?`,
    limit
  );
  return rows.map(row => ({
    ...row,
    trace: JSON.parse(row.trace)
  }));
}
