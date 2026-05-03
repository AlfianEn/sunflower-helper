import type { FarmSnapshot, AutoCropPlan, InventoryItem } from './db'
import { parseFarm } from './farmStatus'

export type EfficiencyResult = {
  score: number // 0-100
  breakdown: {
    cropUtilization: number // % plots active
    harvestTimeliness: number // % harvested on time
    resourceEfficiency: number // % resources collected
    deliveryRate: number // % deliveries completed
    dailyConsistency: number // % daily rewards claimed
  }
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F'
  summary: string
  tips: string[]
}

export function calculateEfficiency(
  snapshot: FarmSnapshot | null,
  autoPlans: AutoCropPlan[],
  inventory: InventoryItem[]
): EfficiencyResult {
  const farm = parseFarm(snapshot)
  const inv = Object.fromEntries(inventory.map(i => [i.name, Number(i.qty)]))
  const now = Date.now()
  const tips: string[] = []

  // Crop utilization: % of plots with active crops
  const plots = Math.floor(inv['Crop Plot'] || 0)
  const activePlots = autoPlans.filter(p => new Date(p.harvestAt).getTime() > now).length
  const cropUtilization = plots > 0 ? Math.min(100, Math.round((activePlots / plots) * 100)) : 0
  if (cropUtilization < 80) tips.push('Tanam di semua plot kosong untuk maximize yield')

  // Harvest timeliness: % of crops harvested within 5min of ready
  const readyCrops = autoPlans.filter(p => new Date(p.harvestAt).getTime() <= now)
  const harvestTimeliness = autoPlans.length > 0 ? Math.max(0, 100 - (readyCrops.length * 10)) : 100
  if (readyCrops.length > 2) tips.push('Panen crop yang sudah ready, jangan tunggu lama')

  // Resource efficiency: % of resources collected
  const totalResources = farm.resources.length
  const collectedResources = farm.resources.filter(r => !r.ready).length
  const resourceEfficiency = totalResources > 0 ? Math.round((collectedResources / totalResources) * 100) : 100
  if (resourceEfficiency < 70) tips.push('Ambil resource yang sudah ready untuk reset cooldown')

  // Delivery rate
  const totalDeliveries = farm.deliveries.filter(d => !d.completed).length
  const doableDeliveries = farm.deliveries.filter(d => !d.completed && d.fulfillable).length
  const deliveryRate = totalDeliveries > 0 ? Math.round(((totalDeliveries - doableDeliveries) / totalDeliveries) * 100) : 100
  if (doableDeliveries > 0) tips.push('Kirim delivery yang sudah bisa, jangan tunda')

  // Daily consistency
  const dailyReady = farm.daily.length > 0 ? 0 : 100
  const dailyConsistency = dailyReady
  if (farm.daily.length > 0) tips.push('Claim daily reward setiap hari')

  const score = Math.round(
    cropUtilization * 0.3 +
    harvestTimeliness * 0.25 +
    resourceEfficiency * 0.2 +
    deliveryRate * 0.15 +
    dailyConsistency * 0.1
  )

  let grade: EfficiencyResult['grade']
  if (score >= 95) grade = 'S'
  else if (score >= 85) grade = 'A'
  else if (score >= 70) grade = 'B'
  else if (score >= 50) grade = 'C'
  else if (score >= 30) grade = 'D'
  else grade = 'F'

  const summary = `Score ${score}/100 (${grade}). ${tips.length > 0 ? tips[0] : 'Farm berjalan efisien!'}`

  return {
    score,
    breakdown: { cropUtilization, harvestTimeliness, resourceEfficiency, deliveryRate, dailyConsistency },
    grade,
    summary,
    tips
  }
}
