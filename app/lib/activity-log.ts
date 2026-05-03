import Database from 'better-sqlite3'

export type ActivityEntry = {
  id: number
  ts: string
  type: 'harvest' | 'plant' | 'craft' | 'delivery' | 'cook' | 'resource' | 'daily' | 'mushroom' | 'sync' | 'profit'
  name: string
  detail: string
  metadata: string | null
}

export function initActivityTable(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      detail TEXT NOT NULL DEFAULT '',
      metadata TEXT
    )
  `)
}

export function logActivity(db: Database.Database, entry: Omit<ActivityEntry, 'id'>) {
  db.prepare('INSERT INTO activity_log(ts, type, name, detail, metadata) VALUES(?,?,?,?,?)')
    .run(entry.ts, entry.type, entry.name, entry.detail, entry.metadata ?? null)
}

export function getRecentActivity(db: Database.Database, limit: number = 20): ActivityEntry[] {
  return db.prepare('SELECT * FROM activity_log ORDER BY ts DESC LIMIT ?').all(limit) as ActivityEntry[]
}

export function getActivityByType(db: Database.Database, type: string, limit: number = 20): ActivityEntry[] {
  return db.prepare('SELECT * FROM activity_log WHERE type = ? ORDER BY ts DESC LIMIT ?').all(type, limit) as ActivityEntry[]
}

export function getActivityStats(db: Database.Database, days: number = 7): Record<string, number> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const rows = db.prepare('SELECT type, COUNT(*) as count FROM activity_log WHERE ts >= ? GROUP BY type').all(cutoff) as { type: string; count: number }[]
  return Object.fromEntries(rows.map(r => [r.type, r.count]))
}
