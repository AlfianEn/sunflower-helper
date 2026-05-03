import type { FarmSnapshot } from './db'

export type TimedItem = { type: string; id: string; name: string; readyAt: number; ready: boolean; detail?: string; x?: number; y?: number }
export type DeliveryItem = { id: string; from: string; items: Record<string, number>; completed: boolean; ready: boolean; fulfillable: boolean; missing: Record<string, number>; reward?: unknown }
export type FarmStatus = { resources: TimedItem[]; cooking: TimedItem[]; deliveries: DeliveryItem[]; chores: TimedItem[]; animals: TimedItem[]; buildings: TimedItem[]; daily: TimedItem[]; mushrooms: TimedItem[]; summary: Record<string, number> }

const MS = {
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  TREE_CD: 2 * 60 * 60 * 1000,
  STONE_CD: 4 * 60 * 60 * 1000,
  IRON_CD: 8 * 60 * 60 * 1000,
  GOLD_CD: 24 * 60 * 60 * 1000,
  CRIMSTONE_CD: 24 * 60 * 60 * 1000,
  SUNSTONE_CD: 3 * 24 * 60 * 60 * 1000,
} as const

export const serverNow = () => Date.now()

const n = (v: unknown): number => Number(v || 0)
const countReady = (xs: TimedItem[]) => xs.filter(x => x.ready).length

export function parseFarm(snapshot: FarmSnapshot | null): FarmStatus {
  const empty: FarmStatus = { resources: [], cooking: [], deliveries: [], chores: [], animals: [], buildings: [], daily: [], mushrooms: [], summary: {} }
  if (!snapshot) return empty

  let farm: Record<string, any>
  try {
    const root = JSON.parse(snapshot.json)
    farm = root.farm || root
  } catch {
    return empty
  }

  const now = serverNow()
  const inv: Record<string, number> = farm.inventory || {}
  const resources: TimedItem[] = []

  // Trees
  for (const [id, node] of Object.entries<any>(farm.trees || {})) {
    const t = n(node?.wood?.choppedAt)
    if (t) {
      const readyAt = t + MS.TREE_CD
      resources.push({ type: 'resource', id: `tree:${id}`, name: 'Tree', readyAt, ready: now - t > MS.TREE_CD, x: node.x, y: node.y, detail: `x:${node.x ?? '-'} y:${node.y ?? '-'}` })
    }
  }

  // Rocks (stone, iron, gold, crimstone, sunstone)
  const rockTypes: [string, any, number][] = [
    ['Stone', farm.stones, MS.STONE_CD],
    ['Iron', farm.iron, MS.IRON_CD],
    ['Gold', farm.gold, MS.GOLD_CD],
    ['Crimstone', farm.crimstones, MS.CRIMSTONE_CD],
    ['Sunstone', farm.sunstones, MS.SUNSTONE_CD],
  ]
  for (const [name, nodes, cooldown] of rockTypes) {
    for (const [id, node] of Object.entries<any>(nodes || {})) {
      const t = n(node?.stone?.minedAt)
      if (t) {
        const readyAt = t + cooldown
        resources.push({ type: 'resource', id: `${name}:${id}`, name, readyAt, ready: now - t >= cooldown, x: node.x, y: node.y, detail: `x:${node.x ?? '-'} y:${node.y ?? '-'}` })
      }
    }
  }

  // Cooking & buildings
  const cooking: TimedItem[] = []
  for (const [building, arr] of Object.entries<any>(farm.buildings || {})) {
    if (!Array.isArray(arr)) continue
    for (const b of arr) {
      if (n(b.readyAt) > now) {
        cooking.push({ type: 'building', id: `building:${building}:${b.id}`, name: String(building), readyAt: n(b.readyAt), ready: false, detail: 'building under construction' })
      }
      for (const c of (b.crafting || [])) {
        const readyAt = n(c.readyAt)
        cooking.push({ type: 'cooking', id: `cook:${building}:${c.name}:${readyAt}`, name: c.name, readyAt, ready: readyAt <= now, detail: String(building) })
      }
    }
  }

  // Deliveries
  const deliveries: DeliveryItem[] = (farm.delivery?.orders || [])
    .filter((o: any) => n(o.readyAt) <= now)
    .map((o: any) => {
      const missing: Record<string, number> = {}
      for (const [k, v] of Object.entries(o.items || {})) {
        const m = Number(v) - Number(inv[k] || 0)
        if (m > 0) missing[k] = m
      }
      return { id: o.id, from: o.from, items: o.items || {}, completed: !!o.completedAt, ready: n(o.readyAt) <= now, fulfillable: Object.keys(missing).length === 0, missing, reward: o.reward }
    })

  // Chores
  const chores: TimedItem[] = Object.entries<any>(farm.choreBoard?.chores || {})
    .filter(([, c]) => c.startedAt && !c.completedAt && !c.skippedAt)
    .map(([id, c]) => ({ type: 'chore', id: `chore:${id}`, name: c.name, readyAt: 0, ready: true, detail: `reward ${Object.entries(c.reward?.items || {}).map(([k, v]) => `${v} ${k}`).join(', ')}` }))

  // Animals
  const animals: TimedItem[] = []
  for (const [house, obj] of [['Hen House', farm.henHouse], ['Barn', farm.barn]] as any) {
    for (const [id, a] of Object.entries<any>(obj?.animals || {})) {
      animals.push({ type: 'animal', id: `animal:${house}:${id}`, name: a.type, readyAt: 0, ready: a.state === 'idle', detail: `${house} · ${a.state}` })
    }
  }

  const buildings: TimedItem[] = cooking.filter(x => x.type === 'building')

  // Daily reward
  const daily: TimedItem[] = []
  const chest = n(farm.dailyRewards?.chest?.collectedAt)
  if (!chest || now - chest >= MS.DAY) {
    daily.push({ type: 'daily', id: 'daily:chest', name: 'Daily Reward Chest', readyAt: chest + MS.DAY, ready: true })
  }

  // Mushrooms
  const mushrooms: TimedItem[] = Object.entries<any>(farm.mushrooms?.mushrooms || {})
    .map(([id, m]) => ({ type: 'mushroom', id: `mushroom:${id}`, name: m.name || 'Mushroom', readyAt: 0, ready: true, detail: `x${m.amount || 1} · x:${m.x ?? '-'} y:${m.y ?? '-'}`, x: m.x, y: m.y }))

  const summary = {
    resourcesReady: countReady(resources),
    cookingReady: countReady(cooking.filter(x => x.type === 'cooking')),
    deliveriesDoable: deliveries.filter(d => !d.completed && d.fulfillable).length,
    deliveriesBlocked: deliveries.filter(d => !d.completed && !d.fulfillable).length,
    choresOpen: chores.length,
    animalsIdle: animals.filter(a => a.ready).length,
    dailyReady: daily.length,
    mushroomsReady: mushrooms.length,
    buildingsInProgress: buildings.length,
  }

  return { resources, cooking: cooking.filter(x => x.type === 'cooking'), deliveries, chores, animals, buildings, daily, mushrooms, summary }
}

export function formatEta(ms: number): string {
  const now = serverNow()
  if (ms <= now) return 'ready'
  const m = Math.ceil((ms - now) / 60000)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60), r = m % 60
  return r ? `${h}h ${r}m` : `${h}h`
}
