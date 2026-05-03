import type { ProfitSnapshot } from './profit-tracker'

export type SFLMetrics = {
  currentRate: number // SFL per hour
  avgRate: number // average over period
  peakRate: number // best hour
  totalEarned: number
  hoursTracked: number
  projection24h: number
  projection7d: number
  summary: string
}

export function calculateSFLRate(profits: { ts: string; sflEarned: number }[]): SFLMetrics {
  if (profits.length === 0) {
    return {
      currentRate: 0, avgRate: 0, peakRate: 0,
      totalEarned: 0, hoursTracked: 0,
      projection24h: 0, projection7d: 0,
      summary: 'Belum ada data profit. Mulai main untuk tracking!'
    }
  }

  const totalEarned = profits.reduce((s, p) => s + p.sflEarned, 0)
  const firstTs = new Date(profits[0].ts).getTime()
  const lastTs = new Date(profits[profits.length - 1].ts).getTime()
  const hoursTracked = Math.max(1, (lastTs - firstTs) / (60 * 60 * 1000))

  // Current rate: last 1 hour
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  const recentProfits = profits.filter(p => new Date(p.ts).getTime() > oneHourAgo)
  const currentRate = recentProfits.reduce((s, p) => s + p.sflEarned, 0)

  // Average rate
  const avgRate = totalEarned / hoursTracked

  // Peak rate: best single hour
  const hourlyBuckets = new Map<number, number>()
  for (const p of profits) {
    const hour = Math.floor(new Date(p.ts).getTime() / (60 * 60 * 1000))
    hourlyBuckets.set(hour, (hourlyBuckets.get(hour) || 0) + p.sflEarned)
  }
  const peakRate = Math.max(...hourlyBuckets.values(), 0)

  const projection24h = avgRate * 24
  const projection7d = avgRate * 24 * 7

  const summary = `~${avgRate.toFixed(1)} SFL/h avg. Current: ${currentRate.toFixed(1)}/h. Peak: ${peakRate.toFixed(1)}/h`

  return {
    currentRate, avgRate, peakRate,
    totalEarned, hoursTracked,
    projection24h, projection7d,
    summary
  }
}
