import type { FarmSnapshot } from './db'

export type Wearable = {
  id: string
  name: string
  type: 'hat' | 'shirt' | 'pants' | 'shoes' | 'tool' | 'accessory' | 'wings' | 'aura'
  bonus: string
  equipped: boolean
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
}

export type WearableStatus = {
  equipped: Wearable[]
  inventory: Wearable[]
  summary: string
}

export function parseWearables(snapshot: FarmSnapshot | null): WearableStatus {
  if (!snapshot) return { equipped: [], inventory: [], summary: 'Tidak ada data wearables' }

  const equipped: Wearable[] = []
  const inventory: Wearable[] = []

  try {
    const root = JSON.parse(snapshot.json)
    const farm = root.farm || root
    const bumbs = farm.bumpkin || {}
    const equippedIds = bumbs.equipped || {}

    // Parse equipped items
    for (const [slot, itemId] of Object.entries<any>(equippedIds)) {
      if (itemId) {
        equipped.push({
          id: String(itemId),
          name: String(itemId).replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
          type: slot as Wearable['type'],
          bonus: 'Equipped',
          equipped: true,
          rarity: 'common'
        })
      }
    }

    // Parse wardrobe
    const wardrobe = bumbs.wardrobe || farm.wardrobe || {}
    for (const [id, qty] of Object.entries<any>(wardrobe)) {
      if (Number(qty) > 0 && !equippedIds[id]) {
        inventory.push({
          id,
          name: id.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
          type: 'accessory',
          bonus: `x${qty}`,
          equipped: false,
          rarity: 'common'
        })
      }
    }
  } catch {}

  const summary = equipped.length > 0
    ? `Equipped: ${equipped.length} items. Wardrobe: ${inventory.length} spare.`
    : 'Tidak ada wearable data.'

  return { equipped, inventory, summary }
}
