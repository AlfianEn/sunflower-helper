import type { FarmSnapshot } from './db'

export type FishingSpot = {
  id: string
  name: string
  type: 'fishing' | 'crab_trap'
  ready: boolean
  readyAt: number | null
  detail: string
}

export type FishingStatus = {
  spots: FishingSpot[]
  readyCount: number
  totalCount: number
  summary: string
}

export function parseFishing(snapshot: FarmSnapshot | null): FishingStatus {
  if (!snapshot) return { spots: [], readyCount: 0, totalCount: 0, summary: 'Tidak ada data fishing' }

  const now = Date.now()
  const spots: FishingSpot[] = []

  try {
    const root = JSON.parse(snapshot.json)
    const farm = root.farm || root

    // Parse fishing spots
    const fishing = farm.fishing || {}
    for (const [id, spot] of Object.entries<any>(fishing.wharf || fishing.spots || {})) {
      const readyAt = spot.cooldown ? Number(spot.cooldown) : null
      spots.push({
        id: `fishing:${id}`,
        name: spot.name || 'Fishing Spot',
        type: 'fishing',
        ready: !readyAt || readyAt <= now,
        readyAt,
        detail: spot.bait ? `bait: ${spot.bait}` : 'no bait'
      })
    }

    // Parse crab traps
    const crabTraps = farm.crabTraps || farm['crab-trap'] || {}
    for (const [id, trap] of Object.entries<any>(crabTraps)) {
      const readyAt = trap.readyAt ? Number(trap.readyAt) : null
      spots.push({
        id: `crab:${id}`,
        name: `Crab Trap ${id}`,
        type: 'crab_trap',
        ready: !readyAt || readyAt <= now,
        readyAt,
        detail: trap.bait ? `bait: ${trap.bait}` : 'no bait'
      })
    }
  } catch {}

  const readyCount = spots.filter(s => s.ready).length
  const summary = spots.length === 0
    ? 'Tidak ada fishing spot/crab trap terbaca'
    : `${readyCount}/${spots.length} siap`

  return { spots, readyCount, totalCount: spots.length, summary }
}
