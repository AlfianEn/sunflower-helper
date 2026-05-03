import type { FarmSnapshot, InventoryItem } from './db'

export type NPCQuest = {
  id: string
  npc: string
  description: string
  requirements: { item: string; qty: number }[]
  reward: { item: string; qty: number } | null
  sflReward: number
  canComplete: boolean
  missing: { item: string; needed: number; have: number }[]
  status: 'available' | 'in_progress' | 'completed'
}

export function parseQuests(snapshot: FarmSnapshot | null, inventory: InventoryItem[]): NPCQuest[] {
  if (!snapshot) return []
  
  const inv = Object.fromEntries(inventory.map(i => [i.name, Number(i.qty)]))
  const quests: NPCQuest[] = []

  try {
    const root = JSON.parse(snapshot.json)
    const farm = root.farm || root

    // Parse delivery orders as quests
    const deliveries = farm.delivery?.orders || []
    for (const order of deliveries) {
      if (order.completedAt) continue
      const items = order.items || {}
      const missing: NPCQuest['missing'] = []
      let canComplete = true

      for (const [item, qty] of Object.entries(items)) {
        const have = Number(inv[item] || 0)
        const needed = Number(qty)
        if (have < needed) {
          canComplete = false
          missing.push({ item, needed, have })
        }
      }

      quests.push({
        id: order.id || `delivery-${order.from}`,
        npc: order.from || 'Unknown NPC',
        description: `Deliver ${Object.entries(items).map(([k, v]) => `${v} ${k}`).join(', ')}`,
        requirements: Object.entries(items).map(([k, v]) => ({ item: k, qty: Number(v) })),
        reward: order.reward?.items ? Object.entries(order.reward.items)[0] ? { item: Object.keys(order.reward.items)[0], qty: Number(Object.values(order.reward.items)[0]) } : null : null,
        sflReward: Number(order.reward?.sfl || 0),
        canComplete,
        missing,
        status: canComplete ? 'available' : 'in_progress'
      })
    }

    // Parse chores as mini-quests
    const chores = farm.choreBoard?.chores || {}
    for (const [id, chore] of Object.entries<any>(chores)) {
      if (chore.completedAt || chore.skippedAt) continue
      quests.push({
        id: `chore-${id}`,
        npc: 'Chore Board',
        description: chore.name || id,
        requirements: [],
        reward: chore.reward?.items ? { item: Object.keys(chore.reward.items)[0], qty: Number(Object.values(chore.reward.items)[0]) } : null,
        sflReward: Number(chore.reward?.sfl || 0),
        canComplete: true,
        missing: [],
        status: 'available'
      })
    }
  } catch {}

  return quests.sort((a, b) => {
    if (a.canComplete && !b.canComplete) return -1
    if (!a.canComplete && b.canComplete) return 1
    return 0
  })
}
