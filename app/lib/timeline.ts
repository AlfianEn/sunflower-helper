import type { AutoCropPlan, CraftTarget, FarmSnapshot } from './db'
import { parseFarm } from './farmStatus'

export type TimelineEvent = {
  id: string
  time: number
  type: 'harvest' | 'cooking' | 'resource' | 'delivery' | 'daily' | 'mushroom' | 'manual'
  name: string
  detail: string
  status: 'pending' | 'ready' | 'overdue'
}

export function buildTimeline(
  autoPlans: AutoCropPlan[],
  snapshot: FarmSnapshot | null,
  now: number
): TimelineEvent[] {
  const events: TimelineEvent[] = []
  const farm = parseFarm(snapshot)

  // Crop harvests
  for (const plan of autoPlans) {
    const harvestTime = new Date(plan.harvestAt).getTime()
    events.push({
      id: `crop:${plan.plotId}`,
      time: harvestTime,
      type: 'harvest',
      name: plan.crop,
      detail: `Plot ${plan.plotId}`,
      status: harvestTime <= now ? 'ready' : 'pending'
    })
  }

  // Cooking
  for (const c of farm.cooking) {
    events.push({
      id: c.id,
      time: c.readyAt,
      type: 'cooking',
      name: c.name,
      detail: c.detail || 'Cooking',
      status: c.ready ? 'ready' : 'pending'
    })
  }

  // Resources
  for (const r of farm.resources) {
    events.push({
      id: r.id,
      time: r.readyAt,
      type: 'resource',
      name: r.name,
      detail: r.detail || '',
      status: r.ready ? 'ready' : 'pending'
    })
  }

  // Daily
  for (const d of farm.daily) {
    events.push({
      id: d.id,
      time: now,
      type: 'daily',
      name: d.name,
      detail: 'Daily reward',
      status: 'ready'
    })
  }

  // Mushrooms
  for (const m of farm.mushrooms) {
    events.push({
      id: m.id,
      time: now,
      type: 'mushroom',
      name: m.name,
      detail: m.detail || 'Mushroom',
      status: 'ready'
    })
  }

  return events.sort((a, b) => {
    // Ready items first, then by time
    if (a.status === 'ready' && b.status !== 'ready') return -1
    if (a.status !== 'ready' && b.status === 'ready') return 1
    return a.time - b.time
  })
}

export function groupByHour(events: TimelineEvent[]): { hour: string; events: TimelineEvent[] }[] {
  const groups = new Map<string, TimelineEvent[]>()
  
  for (const e of events) {
    if (e.status === 'ready') {
      const key = 'NOW'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(e)
    } else {
      const d = new Date(e.time)
      const key = `${d.getHours().toString().padStart(2, '0')}:00`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(e)
    }
  }

  return Array.from(groups.entries()).map(([hour, events]) => ({ hour, events }))
}
