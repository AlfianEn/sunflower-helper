import Database from 'better-sqlite3'

export type ProfitSnapshot = {
  id: number
  ts: string
  sflEarned: number
  cropsHarvested: number
  deliveriesDone: number
  itemsCrafted: number
  notes: string | null
}

export type ProfitTrend = {
  date: string
  sfl: number
  crops: number
  deliveries: number
}

export function initProfitTable(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profit_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL,
      sflEarned REAL NOT NULL DEFAULT 0,
      cropsHarvested INTEGER NOT NULL DEFAULT 0,
      deliveriesDone INTEGER NOT NULL DEFAULT 0,
      itemsCrafted INTEGER NOT NULL DEFAULT 0,
      notes TEXT
    )
  `)
}

export function recordSnapshot(db: Database.Database, data: Omit<ProfitSnapshot, 'id'>) {
  db.prepare('INSERT INTO profit_snapshots(ts, sflEarned, cropsHarvested, deliveriesDone, itemsCrafted, notes) VALUES(?,?,?,?,?,?)')
    .run(data.ts, data.sflEarned, data.cropsHarvested, data.deliveriesDone, data.itemsCrafted, data.notes)
}

export function getProfitHistory(db: Database.Database, days: number = 7): ProfitSnapshot[] {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  return db.prepare('SELECT * FROM profit_snapshots WHERE ts >= ? ORDER BY ts ASC').all(cutoff) as ProfitSnapshot[]
}

export function getProfitTrend(db: Database.Database, days: number = 7): ProfitTrend[] {
  const snapshots = getProfitHistory(db, days)
  const byDate = new Map<string, ProfitTrend>()

  for (const s of snapshots) {
    const date = s.ts.slice(0, 10)
    if (!byDate.has(date)) byDate.set(date, { date, sfl: 0, crops: 0, deliveries: 0 })
    const t = byDate.get(date)!
    t.sfl += s.sflEarned
    t.crops += s.cropsHarvested
    t.deliveries += s.deliveriesDone
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))
}

export function getTodayStats(db: Database.Database): ProfitSnapshot {
  const today = new Date().toISOString().slice(0, 10)
  const rows = db.prepare("SELECT * FROM profit_snapshots WHERE ts >= ?").all(today) as ProfitSnapshot[]
  return {
    id: 0,
    ts: today,
    sflEarned: rows.reduce((s, r) => s + r.sflEarned, 0),
    cropsHarvested: rows.reduce((s, r) => s + r.cropsHarvested, 0),
    deliveriesDone: rows.reduce((s, r) => s + r.deliveriesDone, 0),
    itemsCrafted: rows.reduce((s, r) => s + r.itemsCrafted, 0),
    notes: null
  }
}
