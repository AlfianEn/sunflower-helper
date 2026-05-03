import type { ProfitSnapshot } from './profit-tracker'
import type { ActivityEntry } from './activity-log'

export type WeeklyReport = {
  weekStart: string
  weekEnd: string
  totalSfl: number
  totalCrops: number
  totalDeliveries: number
  totalCrafts: number
  topActivity: string
  highlights: string[]
  recommendations: string[]
  summary: string
}

export function generateWeeklyReport(
  profits: ProfitSnapshot[],
  activities: ActivityEntry[]
): WeeklyReport {
  const now = new Date()
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const weekEnd = now.toISOString().slice(0, 10)

  const totalSfl = profits.reduce((s, p) => s + p.sflEarned, 0)
  const totalCrops = profits.reduce((s, p) => s + p.cropsHarvested, 0)
  const totalDeliveries = profits.reduce((s, p) => s + p.deliveriesDone, 0)
  const totalCrafts = profits.reduce((s, p) => s + p.itemsCrafted, 0)

  // Find most common activity type
  const typeCounts = activities.reduce<Record<string, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1
    return acc
  }, {})
  const topActivity = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none'

  const highlights: string[] = []
  if (totalSfl > 0) highlights.push(`Earned ${totalSfl.toFixed(1)} SFL`)
  if (totalCrops > 0) highlights.push(`Harvested ${totalCrops} crops`)
  if (totalDeliveries > 0) highlights.push(`Completed ${totalDeliveries} deliveries`)
  if (totalCrafts > 0) highlights.push(`Crafted ${totalCrafts} items`)

  const recommendations: string[] = []
  if (totalCrops < 10) recommendations.push('Tanam lebih banyak crop untuk maximize profit')
  if (totalDeliveries < 3) recommendations.push('Selesaikan lebih banyak delivery untuk bonus SFL')
  if (activities.length < 20) recommendations.push('Aktif lebih sering untuk progress lebih cepat')

  const summary = highlights.length > 0
    ? `Minggu ini: ${highlights.join('. ')}.`
    : 'Belum ada data minggu ini. Mulai main untuk tracking!'

  return {
    weekStart,
    weekEnd,
    totalSfl,
    totalCrops,
    totalDeliveries,
    totalCrafts,
    topActivity,
    highlights,
    recommendations,
    summary
  }
}
