import type { FarmSnapshot } from './db'

export type NPCRelation = {
  npc: string
  friendship: number
  maxFriendship: number
  level: string
  giftsToday: number
  maxGifts: number
  icon: string
  summary: string
}

export type RelationshipStatus = {
  npcs: NPCRelation[]
  totalFriendship: number
  summary: string
}

const NPC_DATA: Record<string, { icon: string; maxFriendship: number }> = {
  'betty': { icon: '👩‍🌾', maxFriendship: 1000 },
  'pumpkin pete': { icon: '🎃', maxFriendship: 1000 },
  'blacksmith': { icon: '⚒️', maxFriendship: 1000 },
  'igor': { icon: '🧌', maxFriendship: 1000 },
  'grubnfly': { icon: '🐛', maxFriendship: 1000 },
  'raven': { icon: '🐦‍⬛', maxFriendship: 1000 },
  'bert': { icon: '👴', maxFriendship: 1000 },
  'timmy': { icon: '👶', maxFriendship: 1000 },
  'tywin': { icon: '🏰', maxFriendship: 1000 },
  'finn': { icon: '🎣', maxFriendship: 1000 },
}

export function parseRelationships(snapshot: FarmSnapshot | null): RelationshipStatus {
  if (!snapshot) return { npcs: [], totalFriendship: 0, summary: 'Tidak ada data NPC' }

  const npcs: NPCRelation[] = []

  try {
    const root = JSON.parse(snapshot.json)
    const farm = root.farm || root
    const npcData = farm.npcs || farm.npcRelations || {}

    for (const [id, data] of Object.entries<any>(npcData)) {
      const info = NPC_DATA[id.toLowerCase()] || { icon: '👤', maxFriendship: 1000 }
      const friendship = Number(data.friendship || data.points || 0)
      const maxFriendship = info.maxFriendship
      const pct = (friendship / maxFriendship) * 100

      let level: string
      if (pct >= 90) level = 'Best Friend'
      else if (pct >= 70) level = 'Good Friend'
      else if (pct >= 50) level = 'Friend'
      else if (pct >= 25) level = 'Acquaintance'
      else level = 'Stranger'

      npcs.push({
        npc: id,
        friendship,
        maxFriendship,
        level,
        giftsToday: Number(data.giftsToday || 0),
        maxGifts: 3,
        icon: info.icon,
        summary: `${level} (${friendship}/${maxFriendship})`
      })
    }
  } catch {}

  const totalFriendship = npcs.reduce((s, n) => s + n.friendship, 0)
  const summary = npcs.length === 0
    ? 'Tidak ada data NPC terbaca'
    : `${npcs.length} NPCs. Top: ${npcs.sort((a, b) => b.friendship - a.friendship)[0]?.npc || 'none'}`

  return { npcs, totalFriendship, summary }
}
