import type { InventoryItem } from './db'

export type ExpansionArea = {
  id: string
  name: string
  unlocked: boolean
  requirements: { item: string; qty: number }[]
  missing: { item: string; needed: number; have: number }[]
  sflCost: number
  levelRequired: number
}

export type ExpansionPlan = {
  areas: ExpansionArea[]
  nextArea: ExpansionArea | null
  summary: string
}

// Known expansion areas
const EXPANSION_AREAS: Omit<ExpansionArea, 'unlocked' | 'missing'>[] = [
  { id: 'plot-2', name: 'Second Plot Area', requirements: [{ item: 'Wood', qty: 100 }, { item: 'Stone', qty: 50 }], sflCost: 50, levelRequired: 5 },
  { id: 'plot-3', name: 'Third Plot Area', requirements: [{ item: 'Wood', qty: 300 }, { item: 'Iron', qty: 100 }], sflCost: 200, levelRequired: 15 },
  { id: 'plot-4', name: 'Fourth Plot Area', requirements: [{ item: 'Wood', qty: 500 }, { item: 'Gold', qty: 50 }], sflCost: 500, levelRequired: 25 },
  { id: 'desert', name: 'Desert Island', requirements: [{ item: 'Wood', qty: 1000 }, { item: 'Stone', qty: 500 }, { item: 'Iron', qty: 200 }], sflCost: 1000, levelRequired: 30 },
  { id: 'spring', name: 'Spring Island', requirements: [{ item: 'Wood', qty: 2000 }, { item: 'Gold', qty: 100 }, { item: 'Crimstone', qty: 50 }], sflCost: 2500, levelRequired: 40 },
]

export function getExpansionPlan(inventory: InventoryItem[]): ExpansionPlan {
  const inv = Object.fromEntries(inventory.map(i => [i.name, Number(i.qty)]))

  const areas = EXPANSION_AREAS.map(area => {
    const missing = area.requirements
      .map(r => ({ item: r.item, needed: r.qty, have: Number(inv[r.item] || 0) }))
      .filter(m => m.have < m.needed)
    
    return {
      ...area,
      unlocked: false,
      missing
    }
  })

  const nextArea = areas.find(a => !a.unlocked) || null
  const summary = nextArea
    ? `Next: ${nextArea.name}. Kurang: ${nextArea.missing.map(m => `${m.item} (${m.needed - m.have})`).join(', ')}`
    : 'Semua area sudah unlocked!'

  return { areas, nextArea, summary }
}
