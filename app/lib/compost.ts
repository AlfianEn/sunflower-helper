import type { FarmSnapshot } from './db'

export type CompostBin = {
  id: string
  name: string
  level: number
  ready: boolean
  readyAt: number | null
  inputItem: string
  outputItem: string
  outputQty: number
  detail: string
}

export type CompostStatus = {
  bins: CompostBin[]
  readyCount: number
  totalCount: number
  summary: string
}

export function parseCompost(snapshot: FarmSnapshot | null): CompostStatus {
  if (!snapshot) return { bins: [], readyCount: 0, totalCount: 0, summary: 'Tidak ada data compost' }

  const now = Date.now()
  const bins: CompostBin[] = []

  try {
    const root = JSON.parse(snapshot.json)
    const farm = root.farm || root

    const compost = farm.compost || farm.compostBin || {}
    for (const [id, bin] of Object.entries<any>(compost)) {
      const readyAt = bin.readyAt ? Number(bin.readyAt) : null
      bins.push({
        id: `compost:${id}`,
        name: bin.name || `Compost Bin ${id}`,
        level: bin.level || 1,
        ready: !readyAt || readyAt <= now,
        readyAt,
        inputItem: bin.inputItem || 'Unknown',
        outputItem: bin.outputItem || 'Compost',
        outputQty: bin.outputQty || 1,
        detail: readyAt ? `ready ${new Date(readyAt).toLocaleTimeString()}` : 'idle'
      })
    }
  } catch {}

  const readyCount = bins.filter(b => b.ready).length
  const summary = bins.length === 0
    ? 'Tidak ada compost bin terbaca'
    : `${readyCount}/${bins.length} siap`

  return { bins, readyCount, totalCount: bins.length, summary }
}
