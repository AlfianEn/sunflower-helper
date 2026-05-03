import { RECIPES, missingFor } from './crafting'
import type { InventoryItem, CraftTarget } from './db'

export type MaterialNeed = {
  name: string
  needed: number
  have: number
  gap: number
  source: string
  estimatedTime: string
}

export type MRPResult = {
  targets: { item: string; qty: number; canCraft: boolean; materials: MaterialNeed[] }[]
  totalGaps: MaterialNeed[]
  summary: string
}

const SOURCE_MAP: Record<string, { source: string; time: string }> = {
  'Wood': { source: 'Trees (2h cooldown)', time: '2h per batch' },
  'Stone': { source: 'Stone rocks (4h cooldown)', time: '4h per batch' },
  'Iron': { source: 'Iron rocks (8h cooldown)', time: '8h per batch' },
  'Gold': { source: 'Gold rocks (24h cooldown)', time: '24h per batch' },
  'Crimstone': { source: 'Crimstone (24h cooldown)', time: '24h per batch' },
  'Sunstone': { source: 'Sunstone (3d cooldown)', time: '3d per batch' },
  'Egg': { source: 'Hen House chickens', time: '~8h per chicken' },
  'Wool': { source: 'Barn sheep', time: '~12h per sheep' },
  'Milk': { source: 'Barn cows', time: '~24h per cow' },
  'Honey': { source: 'Beehive', time: '~24h per beehive' },
  'Oil': { source: 'Oil Reservoir', time: '~24h' },
  'Lemon': { source: 'Lemon Tree', time: '~24h' },
  'Blueberry': { source: 'Blueberry Bush', time: '~24h' },
  'Orange': { source: 'Orange Tree', time: '~24h' },
  'Apple': { source: 'Apple Tree', time: '~24h' },
  'Banana': { source: 'Banana Plant', time: '~24h' },
  'Tomato': { source: 'Tomato Seed crop', time: 'varies' },
  'Sunflower': { source: 'Sunflower Seed crop', time: '1m' },
  'Potato': { source: 'Potato Seed crop', time: '5m' },
  'Pumpkin': { source: 'Pumpkin Seed crop', time: '30m' },
  'Carrot': { source: 'Carrot Seed crop', time: '60m' },
  'Cabbage': { source: 'Cabbage Seed crop', time: '2h' },
  'Beetroot': { source: 'Beetroot Seed crop', time: '4h' },
  'Cauliflower': { source: 'Cauliflower Seed crop', time: '8h' },
  'Parsnip': { source: 'Parsnip Seed crop', time: '12h' },
  'Eggplant': { source: 'Eggplant Seed crop', time: '16h' },
  'Corn': { source: 'Corn Seed crop', time: '20h' },
  'Radish': { source: 'Radish Seed crop', time: '24h' },
  'Wheat': { source: 'Wheat Seed crop', time: '24h' },
  'Kale': { source: 'Kale Seed crop', time: '36h' },
  'Soybean': { source: 'Soybean Seed crop', time: '36h' },
  'Pepper': { source: 'Pepper Seed crop', time: '48h' },
  'Onion': { source: 'Onion Seed crop', time: '48h' },
}

export function computeMRP(targets: CraftTarget[], inventory: InventoryItem[]): MRPResult {
  const inv = Object.fromEntries(inventory.map(i => [i.name, Number(i.qty)]))
  const totalGaps: MRPResult['targets'][0]['materials'] = []

  const targetResults = targets.map(t => {
    const materials = missingFor(t.item, t.qty, inv).map(m => {
      const info = SOURCE_MAP[m.name] || { source: 'Unknown', time: 'Unknown' }
      const need: MaterialNeed = {
        name: m.name,
        needed: m.need,
        have: m.have,
        gap: m.missing,
        source: info.source,
        estimatedTime: info.time
      }
      if (m.missing > 0) totalGaps.push(need)
      return need
    })

    const canCraft = materials.every(m => m.gap === 0)
    return { item: t.item, qty: t.qty, canCraft, materials }
  })

  const uniqueGaps = totalGaps.reduce<MaterialNeed[]>((acc, gap) => {
    const existing = acc.find(g => g.name === gap.name)
    if (existing) {
      existing.gap += gap.gap
      existing.needed += gap.needed
    } else {
      acc.push({ ...gap })
    }
    return acc
  }, [])

  const summary = uniqueGaps.length === 0
    ? 'Semua bahan tersedia. Bisa langsung craft!'
    : `${uniqueGaps.length} bahan kurang: ${uniqueGaps.map(g => `${g.name} (-${g.gap})`).join(', ')}`

  return { targets: targetResults, totalGaps: uniqueGaps, summary }
}
