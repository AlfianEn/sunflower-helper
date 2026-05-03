import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

type Setting = { key: string; value: string; updatedAt: string }
export type CropPlan = { id: number; crop: string; plotCount: number; plantedAt: string; harvestAt: string; status: string; notes: string | null; createdAt: string; updatedAt: string }
export type InventoryItem = { name: string; qty: number; updatedAt: string }
export type CraftTarget = { id: number; item: string; qty: number; status: string; notes: string | null; createdAt: string; updatedAt: string }
export type AutoCropPlan = { plotId: string; crop: string; plantedAt: string | null; harvestAt: string; status: string; raw: string; updatedAt: string }
export type FarmSnapshot = { id: number; farmId: string; fetchedAt: string; json: string }

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'sunflower.db')
fs.mkdirSync(path.dirname(dbPath), { recursive: true })
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.exec(`
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updatedAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS crop_plans (id INTEGER PRIMARY KEY AUTOINCREMENT,crop TEXT NOT NULL,plotCount INTEGER NOT NULL DEFAULT 1,plantedAt TEXT NOT NULL,harvestAt TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active',notes TEXT,createdAt TEXT NOT NULL,updatedAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS inventory (name TEXT PRIMARY KEY, qty REAL NOT NULL DEFAULT 0, updatedAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS craft_targets (id INTEGER PRIMARY KEY AUTOINCREMENT,item TEXT NOT NULL,qty REAL NOT NULL DEFAULT 1,status TEXT NOT NULL DEFAULT 'active',notes TEXT,createdAt TEXT NOT NULL,updatedAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS auto_crop_plans (plotId TEXT PRIMARY KEY, crop TEXT NOT NULL, plantedAt TEXT, harvestAt TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', raw TEXT NOT NULL, updatedAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS farm_snapshots (id INTEGER PRIMARY KEY AUTOINCREMENT, farmId TEXT NOT NULL, fetchedAt TEXT NOT NULL, json TEXT NOT NULL);
`)
export const store = {
  settings(): Record<string, string> { return Object.fromEntries((db.prepare('SELECT key,value FROM settings').all() as Setting[]).map(r => [r.key, r.value])) },
  setSetting(key: string, value: string) { const now = new Date().toISOString(); db.prepare('INSERT INTO settings(key,value,updatedAt) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updatedAt=excluded.updatedAt').run(key, value, now) },
  addCropPlan(data: { crop: string; plotCount: number; plantedAt: Date; harvestAt: Date; notes?: string | null }) { const now = new Date().toISOString(); db.prepare('INSERT INTO crop_plans(crop,plotCount,plantedAt,harvestAt,status,notes,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?,?)').run(data.crop, data.plotCount, data.plantedAt.toISOString(), data.harvestAt.toISOString(), 'active', data.notes ?? null, now, now) },
  activePlans(): CropPlan[] { return db.prepare("SELECT * FROM crop_plans WHERE status='active' ORDER BY harvestAt ASC").all() as CropPlan[] },
  autoPlans(): AutoCropPlan[] { return db.prepare("SELECT * FROM auto_crop_plans WHERE status='active' ORDER BY harvestAt ASC").all() as AutoCropPlan[] },
  markDone(id: number) { db.prepare("UPDATE crop_plans SET status='done', updatedAt=? WHERE id=?").run(new Date().toISOString(), id) },
  inventory(): InventoryItem[] { return db.prepare('SELECT * FROM inventory ORDER BY name ASC').all() as InventoryItem[] },
  setInventory(name: string, qty: number) { const now = new Date().toISOString(); db.prepare('INSERT INTO inventory(name,qty,updatedAt) VALUES(?,?,?) ON CONFLICT(name) DO UPDATE SET qty=excluded.qty, updatedAt=excluded.updatedAt').run(name, qty, now) },
  targets(): CraftTarget[] { return db.prepare("SELECT * FROM craft_targets WHERE status='active' ORDER BY createdAt DESC").all() as CraftTarget[] },
  addTarget(item: string, qty: number, notes?: string | null) { const now = new Date().toISOString(); db.prepare('INSERT INTO craft_targets(item,qty,status,notes,createdAt,updatedAt) VALUES(?,?,?,?,?,?)').run(item, qty, 'active', notes ?? null, now, now) },
  doneTarget(id: number) { db.prepare("UPDATE craft_targets SET status='done', updatedAt=? WHERE id=?").run(new Date().toISOString(), id) },
  latestSnapshot(): FarmSnapshot | null { return db.prepare('SELECT * FROM farm_snapshots ORDER BY id DESC LIMIT 1').get() as FarmSnapshot | undefined ?? null }
}
