import type { AutoCropPlan, InventoryItem, CraftTarget, FarmSnapshot, CropPlan } from './db'
import { parseFarm, formatEta } from './farmStatus'
import { calculateEfficiency } from './efficiency'

export type BotCommandResponse = {
  command: string
  text: string
  parseMode?: 'HTML' | 'Markdown'
}

const NL = String.fromCharCode(10)

export function handleFarmCommand(
  autoPlans: AutoCropPlan[],
  manualPlans: CropPlan[],
  inventory: InventoryItem[],
  targets: CraftTarget[],
  snapshot: FarmSnapshot | null
): BotCommandResponse {
  const now = Date.now()
  const readyCrops = autoPlans.filter(p => new Date(p.harvestAt).getTime() <= now)
  const activeCrops = autoPlans.filter(p => new Date(p.harvestAt).getTime() > now)
  const farm = parseFarm(snapshot)
  const inv = Object.fromEntries(inventory.map(i => [i.name, Number(i.qty)]))
  const plots = Math.floor(inv['Crop Plot'] || 0)

  const lines = [
    '🌻 <b>Farm Status</b>',
    '',
    `📊 Plots: ${activeCrops.length}/${plots} aktif, ${readyCrops.length} ready`,
    `🍳 Cooking: ${farm.summary.cookingReady} ready`,
    `🪓 Resources: ${farm.summary.resourcesReady} ready`,
    `📦 Delivery: ${farm.summary.deliveriesDoable} bisa, ${farm.summary.deliveriesBlocked} kurang`,
    `🎁 Daily: ${farm.summary.dailyReady ? '✓' : '✗'}`,
    `🍄 Mushroom: ${farm.summary.mushroomsReady}`,
  ]

  if (readyCrops.length > 0) {
    lines.push('', '🌾 <b>Crop ready:</b>')
    for (const c of readyCrops.slice(0, 5)) {
      lines.push(`  • ${c.crop} (plot ${c.plotId})`)
    }
  }

  if (activeCrops.length > 0) {
    const next = activeCrops.sort((a, b) => new Date(a.harvestAt).getTime() - new Date(b.harvestAt).getTime())[0]
    lines.push('', `⏰ Next: ${next.crop} dalam ${formatEta(new Date(next.harvestAt).getTime())}`)
  }

  return { command: '/farm', text: lines.join(NL), parseMode: 'HTML' }
}

export function handleProfitCommand(
  todayStats: { sflEarned: number; cropsHarvested: number; deliveriesDone: number; itemsCrafted: number }
): BotCommandResponse {
  const lines = [
    '💰 <b>Profit Hari Ini</b>',
    '',
    `SFL Earned: ${todayStats.sflEarned.toFixed(1)}`,
    `Crops: ${todayStats.cropsHarvested}`,
    `Deliveries: ${todayStats.deliveriesDone}`,
    `Crafted: ${todayStats.itemsCrafted}`,
  ]
  return { command: '/profit', text: lines.join(NL), parseMode: 'HTML' }
}

export function handleNextCommand(
  autoPlans: AutoCropPlan[],
  snapshot: FarmSnapshot | null
): BotCommandResponse {
  const now = Date.now()
  const farm = parseFarm(snapshot)

  const upcoming: { name: string; time: number; type: string }[] = []

  for (const p of autoPlans.filter(p => new Date(p.harvestAt).getTime() > now)) {
    upcoming.push({ name: p.crop, time: new Date(p.harvestAt).getTime(), type: '🌾' })
  }
  for (const c of farm.cooking.filter(c => !c.ready)) {
    upcoming.push({ name: c.name, time: c.readyAt, type: '🍳' })
  }
  for (const r of farm.resources.filter(r => !r.ready)) {
    upcoming.push({ name: r.name, time: r.readyAt, type: '🪓' })
  }

  upcoming.sort((a, b) => a.time - b.time)

  const lines = ['⏰ <b>Upcoming Events</b>', '']

  if (upcoming.length === 0) {
    lines.push('Tidak ada event terjadwal.')
  } else {
    for (const e of upcoming.slice(0, 8)) {
      const mins = Math.round((e.time - now) / 60000)
      lines.push(`${e.type} ${e.name}: ${mins}m lagi`)
    }
  }

  return { command: '/next', text: lines.join(NL), parseMode: 'HTML' }
}

export function handleEfficiencyCommand(
  snapshot: FarmSnapshot | null,
  autoPlans: AutoCropPlan[],
  inventory: InventoryItem[]
): BotCommandResponse {
  const eff = calculateEfficiency(snapshot, autoPlans, inventory)
  const lines = [
    `📈 <b>Efficiency: ${eff.score}/100 (${eff.grade})</b>`,
    '',
    `🌾 Crop: ${eff.breakdown.cropUtilization}%`,
    `⏰ Harvest: ${eff.breakdown.harvestTimeliness}%`,
    `🪓 Resource: ${eff.breakdown.resourceEfficiency}%`,
    `📦 Delivery: ${eff.breakdown.deliveryRate}%`,
    `🎁 Daily: ${eff.breakdown.dailyConsistency}%`,
  ]
  if (eff.tips.length > 0) {
    lines.push('', '💡 <b>Tips:</b>')
    for (const t of eff.tips.slice(0, 3)) {
      lines.push(`  • ${t}`)
    }
  }
  return { command: '/efficiency', text: lines.join(NL), parseMode: 'HTML' }
}
