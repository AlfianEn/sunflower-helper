import type { InventoryItem, CraftTarget, AutoCropPlan } from './db'
import { missingFor } from './crafting'
import { CROPS, profitPerHour } from './crops'

export type Goal = {
  id: string
  name: string
  type: 'profit' | 'craft' | 'level' | 'delivery' | 'building'
  priority: number
  status: 'active' | 'blocked' | 'done'
  progress: number // 0-100
  blockers: string[]
  eta: string
}

export type GoalSchedule = {
  goals: Goal[]
  currentFocus: string
  conflicts: string[]
  summary: string
}

export function buildGoalSchedule(
  goals: { name: string; type: Goal['type']; priority: number }[],
  inventory: InventoryItem[],
  targets: CraftTarget[],
  autoPlans: AutoCropPlan[]
): GoalSchedule {
  const inv = Object.fromEntries(inventory.map(i => [i.name, Number(i.qty)]))
  const now = Date.now()

  const resolved: Goal[] = goals.map(g => {
    const blockers: string[] = []
    let progress = 0
    let status: Goal['status'] = 'active'
    let eta = 'Unknown'

    if (g.type === 'craft') {
      const target = targets[0]
      if (target) {
        const missing = missingFor(target.item, target.qty, inv).filter(m => m.missing > 0)
        if (missing.length === 0) {
          progress = 100
          status = 'done'
          eta = 'Sekarang'
        } else {
          const total = missing.reduce((s, m) => s + m.need, 0)
          const have = missing.reduce((s, m) => s + m.have, 0)
          progress = Math.round((have / total) * 100)
          blockers.push(...missing.map(m => `${m.name}: kurang ${m.missing}`))
          eta = `~${Math.ceil(missing.length * 2)}h (estimasi)`
        }
      }
    } else if (g.type === 'profit') {
      const seeds = CROPS.filter(c => (inv[`${c.name} Seed`] || 0) > 0)
      if (seeds.length > 0) {
        const best = seeds.sort((a, b) => profitPerHour(b) - profitPerHour(a))[0]
        progress = 50
        eta = `${best.minutes}m per cycle`
      } else {
        status = 'blocked'
        blockers.push('Tidak ada seed')
      }
    } else if (g.type === 'delivery') {
      progress = 30
      eta = 'Tergantung bahan'
    } else if (g.type === 'building') {
      progress = 20
      blockers.push('Building data belum lengkap')
      eta = 'Unknown'
    } else if (g.type === 'level') {
      progress = 40
      eta = 'Berdasarkan crop cycle'
    }

    return { id: `${g.type}-${g.name}`, ...g, status, progress, blockers, eta }
  })

  const active = resolved.filter(g => g.status === 'active').sort((a, b) => a.priority - b.priority)
  const currentFocus = active[0]?.name || 'Tidak ada goal aktif'

  const conflicts: string[] = []
  const craftGoals = active.filter(g => g.type === 'craft')
  if (craftGoals.length > 1) conflicts.push('Multiple craft goals → fokus satu dulu')

  const summary = `${resolved.filter(g => g.status === 'done').length}/${resolved.length} goals selesai. Focus: ${currentFocus}`

  return { goals: resolved, currentFocus, conflicts, summary }
}
