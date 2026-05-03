import { CROPS, profitPerHour } from './crops'

export type SeedROI = {
  crop: string
  seedCost: number
  sellPrice: number
  profit: number
  profitPerHour: number
  roi: number // return on investment %
  growTime: string
  rank: number
}

export type ROIResult = {
  seeds: SeedROI[]
  bestROI: SeedROI
  bestPPH: SeedROI
  fastestReturn: SeedROI
  summary: string
}

export function calculateSeedROI(): ROIResult {
  const seeds: SeedROI[] = CROPS.map(c => {
    const profit = c.sell - c.seed
    const pph = profitPerHour(c)
    const roi = c.seed > 0 ? (profit / c.seed) * 100 : 0
    const hours = c.minutes / 60
    const growTime = hours < 1 ? `${c.minutes}m` : hours < 24 ? `${hours.toFixed(1)}h` : `${(hours / 24).toFixed(1)}d`

    return {
      crop: c.name,
      seedCost: c.seed,
      sellPrice: c.sell,
      profit,
      profitPerHour: pph,
      roi,
      growTime,
      rank: 0
    }
  }).sort((a, b) => b.profitPerHour - a.profitPerHour)

  seeds.forEach((s, i) => s.rank = i + 1)

  const bestROI = [...seeds].sort((a, b) => b.roi - a.roi)[0]
  const bestPPH = seeds[0]
  const fastestReturn = [...seeds].sort((a, b) => a.seedCost - b.seedCost)[0]

  const summary = `Best PPH: ${bestPPH.crop} (${bestPPH.profitPerHour.toFixed(2)}/h). Best ROI: ${bestROI.crop} (${bestROI.roi.toFixed(0)}%). Fastest: ${fastestReturn.crop}`

  return { seeds, bestROI, bestPPH, fastestReturn, summary }
}
