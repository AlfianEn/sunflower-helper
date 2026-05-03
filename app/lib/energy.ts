import type { FarmSnapshot } from './db'
import { parseFarm } from './farmStatus'

export type EnergyAction = {
  name: string
  cost: number
  category: 'crop' | 'resource' | 'cooking' | 'craft' | 'animal' | 'other'
  priority: 'high' | 'medium' | 'low'
  reason: string
}

export type EnergyPlan = {
  currentEnergy: number
  maxEnergy: number
  actions: EnergyAction[]
  totalCost: number
  remaining: number
  summary: string
}

const ENERGY_COSTS: Record<string, number> = {
  'plant': 5,
  'harvest': 2,
  'chop': 4,
  'mine_stone': 5,
  'mine_iron': 7,
  'mine_gold': 10,
  'mine_crimstone': 10,
  'mine_sunstone': 15,
  'cook': 3,
  'craft': 5,
  'feed_chicken': 2,
  'feed_cow': 3,
  'feed_sheep': 3,
  'delivery': 0,
  'mushroom': 1,
  'daily': 0,
}

export function buildEnergyPlan(snapshot: FarmSnapshot | null, goal: string): EnergyPlan {
  const farm = parseFarm(snapshot)
  const now = Date.now()

  // Try to read energy from snapshot
  let currentEnergy = 100
  let maxEnergy = 100
  if (snapshot) {
    try {
      const root = JSON.parse(snapshot.json)
      const f = root.farm || root
      currentEnergy = Number(f.inventory?.['Energy'] || f.energy?.current || 100)
      maxEnergy = Number(f.energy?.max || 100)
    } catch {}
  }

  const actions: EnergyAction[] = []

  // Ready crops → harvest
  const readyCrops = farm.cooking.filter(c => c.ready)
  for (const c of readyCrops) {
    actions.push({
      name: `Ambil ${c.name}`,
      cost: ENERGY_COSTS.harvest,
      category: 'cooking',
      priority: 'high',
      reason: 'Masakan sudah ready'
    })
  }

  // Ready resources
  const readyResources = farm.resources.filter(r => r.ready)
  for (const r of readyResources) {
    const costMap: Record<string, number> = {
      'Tree': ENERGY_COSTS.chop,
      'Stone': ENERGY_COSTS.mine_stone,
      'Iron': ENERGY_COSTS.mine_iron,
      'Gold': ENERGY_COSTS.mine_gold,
      'Crimstone': ENERGY_COSTS.mine_crimstone,
      'Sunstone': ENERGY_COSTS.mine_sunstone,
    }
    actions.push({
      name: `Ambil ${r.name} ${r.detail || ''}`,
      cost: costMap[r.name] || ENERGY_COSTS.other,
      category: 'resource',
      priority: 'medium',
      reason: 'Resource ready'
    })
  }

  // Daily
  if (farm.daily.length > 0) {
    actions.push({
      name: 'Ambil Daily Reward',
      cost: ENERGY_COSTS.daily,
      category: 'other',
      priority: 'high',
      reason: 'Reward harian'
    })
  }

  // Mushrooms
  for (const m of farm.mushrooms) {
    actions.push({
      name: `Ambil ${m.name}`,
      cost: ENERGY_COSTS.mushroom,
      category: 'other',
      priority: 'low',
      reason: 'Mushroom spawn'
    })
  }

  // Animals
  const idleAnimals = farm.animals.filter(a => a.ready)
  for (const a of idleAnimals) {
    actions.push({
      name: `Feed ${a.name}`,
      cost: ENERGY_COSTS.feed_chicken,
      category: 'animal',
      priority: 'medium',
      reason: `${a.name} idle di ${a.detail || 'kandang'}`
    })
  }

  const totalCost = actions.reduce((s, a) => s + a.cost, 0)
  const remaining = currentEnergy - totalCost

  const summary = remaining >= 0
    ? `Energy cukup: ${currentEnergy}/${maxEnergy}, butuh ${totalCost}, sisa ${remaining}`
    : `Energy kurang! Butuh ${totalCost}, punya ${currentEnergy}, kurang ${Math.abs(remaining)}`

  return { currentEnergy, maxEnergy, actions, totalCost, remaining, summary }
}
