'use client'

import { downloadCSV } from '../lib/export'

export function ExportPanel({ inventory, activities, profits }: {
  inventory: { name: string; qty: number }[]
  activities: { ts: string; type: string; name: string; detail: string }[]
  profits: { ts: string; sflEarned: number; cropsHarvested: number; deliveriesDone: number }[]
}) {
  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">DATA EXPORT</div>
      <h2>Export Data</h2>
      <p className="muted">Download data untuk analisis di spreadsheet.</p>

      <div className="exportGrid">
        <button className="exportBtn" onClick={() => downloadCSV(inventory, 'inventory')}>
          📦 Inventory ({inventory.length})
        </button>
        <button className="exportBtn" onClick={() => downloadCSV(activities, 'activity-log')}>
          📋 Activity Log ({activities.length})
        </button>
        <button className="exportBtn" onClick={() => downloadCSV(profits, 'profit-history')}>
          💰 Profit History ({profits.length})
        </button>
      </div>
    </section>
  )
}
