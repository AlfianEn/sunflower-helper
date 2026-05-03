import { CROPS, profitPerHour } from './crops'
import type { InventoryItem, AutoCropPlan, CraftTarget } from './db'
import { missingFor } from './crafting'

export type OptimalStep = {
  crop: string
  plotCount: number
  plantedAt: number
  harvestAt: number
  expectedYield: number
  expectedProfit: number
  reason: string
}

export type OptimizationResult = {
  steps: OptimalStep[]
  totalProfit: number
  totalHarvests: number
  summary: string
  goal: string
}

const seedName = (crop: string) => `${crop} Seed`

function getAvailableSeeds(inv: Record<string, number>): { crop: string; seeds: number; pph: number; minutes: number }[] {
  return CROPS.map(c => ({
    crop: c.name,
    seeds: Math.floor(inv[seedName(c.name)] || 0),
    pph: profitPerHour(c),
    minutes: c.minutes
  })).filter(c => c.seeds > 0)
}

function getBestCrop(inv: Record<string, number>, goal: string, targets: CraftTarget[]): { name: string; seed: number; sell: number; minutes: number } | null {
  const candidates = getAvailableSeeds(inv)
  if (candidates.length === 0) return null

  if (goal === 'craft' && targets.length > 0) {
    const missing = targets.flatMap(t => missingFor(t.item, t.qty, inv).filter(m => m.missing > 0))
    const craftCrop = missing.find(m => CROPS.some(c => c.name === m.name))
    if (craftCrop) return CROPS.find(c => c.name === craftCrop.name) || null
  }

  const sorted = [...candidates].sort((a, b) => {
    if (goal === 'profit') return b.pph - a.pph
    if (goal === 'level') return b.minutes - a.minutes // longer crops = more XP typically
    return b.pph - a.pph // balanced = profit priority
  })

  return CROPS.find(c => c.name === sorted[0].crop) || null
}

export function optimizeProduction(
  autoPlans: AutoCropPlan[],
  inventory: InventoryItem[],
  targets: CraftTarget[],
  settings: Record<string, string>,
  horizonHours: number = 24
): OptimizationResult {
  const inv = Object.fromEntries(inventory.map(i => [i.name, Number(i.qty)]))
  const goal = settings.goal || 'balanced'
  const plots = Math.max(0, Math.floor(inv['Crop Plot'] || 0))
  const now = Date.now()
  const horizon = horizonHours * 60 * 60 * 1000

  const activeHarvests = autoPlans.filter(p => new Date(p.harvestAt).getTime() > now)
  const readyCrops = autoPlans.filter(p => new Date(p.harvestAt).getTime() <= now)
  const freePlots = Math.max(0, plots - activeHarvests.length) + readyCrops.length

  const steps: OptimalStep[] = []
  const seedInv = { ...inv }

  // Simulate harvests from ready crops
  for (const rc of readyCrops) {
    const crop = CROPS.find(c => c.name === rc.crop)
    if (crop) {
      seedInv[crop.name] = (seedInv[crop.name] || 0) + 1
    }
  }

  let currentTime = now
  let totalProfit = 0
  let totalHarvests = 0
  let iteration = 0
  const maxIterations = 50

  while (iteration < maxIterations && currentTime < now + horizon) {
    const best = getBestCrop(seedInv, goal, targets)
    if (!best) break

    const availableSeeds = Math.floor(seedInv[seedName(best.name)] || 0)
    if (availableSeeds <= 0) break

    const plotsToUse = Math.min(freePlots, availableSeeds)
    if (plotsToUse <= 0) break

    const harvestTime = currentTime + best.minutes * 60_000
    if (harvestTime > now + horizon) break

    const yield_ = plotsToUse
    const profit = (best.sell - best.seed) * plotsToUse

    steps.push({
      crop: best.name,
      plotCount: plotsToUse,
      plantedAt: currentTime,
      harvestAt: harvestTime,
      expectedYield: yield_,
      expectedProfit: profit,
      reason: goal === 'craft' ? `Bahan craft` : `Best ${goal}: ${profitPerHour(best).toFixed(2)} SFL/h`
    })

    // Update simulated inventory
    seedInv[seedName(best.name)] = availableSeeds - plotsToUse
    seedInv[best.name] = (seedInv[best.name] || 0) + yield_
    totalProfit += profit
    totalHarvests += yield_
    currentTime = harvestTime
    iteration++
  }

  const summary = steps.length > 0
    ? `${steps.length} planting cycles, ${totalHarvests} harvests, ~${totalProfit.toFixed(1)} SFL profit in ${horizonHours}h`
    : `Tidak ada seed tersedia atau plot kosong. Beli seed dulu.`

  return { steps, totalProfit, totalHarvests, summary, goal }
}
