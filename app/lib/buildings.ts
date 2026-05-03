import type { FarmSnapshot, InventoryItem } from './db'

export type BuildingInfo = {
  id: string
  name: string
  level: number
  maxLevel: number
  nextUpgradeCost: { item: string; qty: number }[]
  canUpgrade: boolean
  missing: { item: string; needed: number; have: number }[]
  sflCost: number
}

export type BuildingPlan = {
  buildings: BuildingInfo[]
  totalGaps: { item: string; gap: number }[]
  summary: string
}

const BUILDING_DATA: Record<string, { maxLevel: number; upgrades: { level: number; cost: { item: string; qty: number }[]; sfl: number }[] }> = {
  'Water Well': {
    maxLevel: 5,
    upgrades: [
      { level: 2, cost: [{ item: 'Wood', qty: 10 }, { item: 'Stone', qty: 5 }], sfl: 5 },
      { level: 3, cost: [{ item: 'Wood', qty: 30 }, { item: 'Iron', qty: 10 }], sfl: 20 },
    ]
  },
  'Hen House': {
    maxLevel: 5,
    upgrades: [
      { level: 2, cost: [{ item: 'Wood', qty: 25 }, { item: 'Iron', qty: 5 }], sfl: 10 },
      { level: 3, cost: [{ item: 'Wood', qty: 50 }, { item: 'Gold', qty: 5 }], sfl: 50 },
    ]
  },
  'Barn': {
    maxLevel: 5,
    upgrades: [
      { level: 2, cost: [{ item: 'Wood', qty: 50 }, { item: 'Iron', qty: 20 }], sfl: 25 },
    ]
  },
  'Kitchen': {
    maxLevel: 3,
    upgrades: [
      { level: 2, cost: [{ item: 'Wood', qty: 20 }, { item: 'Iron', qty: 5 }], sfl: 10 },
    ]
  },
  'Workbench': {
    maxLevel: 3,
    upgrades: [
      { level: 2, cost: [{ item: 'Wood', qty: 15 }, { item: 'Stone', qty: 10 }], sfl: 5 },
    ]
  },
}

export function parseBuildings(snapshot: FarmSnapshot | null, inventory: InventoryItem[]): BuildingPlan {
  const inv = Object.fromEntries(inventory.map(i => [i.name, Number(i.qty)]))
  const buildings: BuildingInfo[] = []

  if (snapshot) {
    try {
      const root = JSON.parse(snapshot.json)
      const farm = root.farm || root

      for (const [name, arr] of Object.entries<any>(farm.buildings || {})) {
        if (!Array.isArray(arr)) continue
        for (const b of arr) {
          const data = BUILDING_DATA[name]
          const level = b.level || 1
          const upgrade = data?.upgrades.find(u => u.level === level + 1)

          if (upgrade) {
            const missing: BuildingInfo['missing'] = []
            let canUpgrade = true

            for (const cost of upgrade.cost) {
              const have = Number(inv[cost.item] || 0)
              if (have < cost.qty) {
                canUpgrade = false
                missing.push({ item: cost.item, needed: cost.qty, have })
              }
            }

            buildings.push({
              id: `${name}-${b.id}`,
              name,
              level,
              maxLevel: data?.maxLevel || 3,
              nextUpgradeCost: upgrade.cost,
              canUpgrade,
              missing,
              sflCost: upgrade.sfl
            })
          } else {
            buildings.push({
              id: `${name}-${b.id}`,
              name,
              level,
              maxLevel: data?.maxLevel || 3,
              nextUpgradeCost: [],
              canUpgrade: false,
              missing: [],
              sflCost: 0
            })
          }
        }
      }
    } catch {}
  }

  const totalGaps = buildings
    .flatMap(b => b.missing)
    .reduce<{ item: string; gap: number }[]>((acc, m) => {
      const existing = acc.find(g => g.item === m.item)
      if (existing) existing.gap += m.needed - m.have
      else acc.push({ item: m.item, gap: m.needed - m.have })
      return acc
    }, [])

  const canUpgrade = buildings.filter(b => b.canUpgrade)
  const summary = canUpgrade.length > 0
    ? `Bisa upgrade: ${canUpgrade.map(b => `${b.name} L${b.level + 1}`).join(', ')}`
    : 'Tidak ada building yang bisa di-upgrade sekarang'

  return { buildings, totalGaps, summary }
}
