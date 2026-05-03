export const CROPS = [
  { name: 'Sunflower', minutes: 1, seed: 0.01, sell: 0.02, xp: 0.01 },
  { name: 'Potato', minutes: 5, seed: 0.1, sell: 0.14, xp: 0.02 },
  { name: 'Rhubarb', minutes: 10, seed: 0.15, sell: 0.24, xp: 0.03 },
  { name: 'Pumpkin', minutes: 30, seed: 0.2, sell: 0.4, xp: 0.1 },
  { name: 'Zucchini', minutes: 30, seed: 0.3, sell: 0.4, xp: 0.15 },
  { name: 'Carrot', minutes: 60, seed: 0.5, sell: 0.8, xp: 0.2 },
  { name: 'Yam', minutes: 60, seed: 0.7, sell: 0.8, xp: 0.25 },
  { name: 'Cabbage', minutes: 120, seed: 1, sell: 1.5, xp: 0.4 },
  { name: 'Broccoli', minutes: 120, seed: 1.5, sell: 2.2, xp: 0.5 },
  { name: 'Soybean', minutes: 180, seed: 1.25, sell: 2.3, xp: 0.6 },
  { name: 'Beetroot', minutes: 240, seed: 2, sell: 2.8, xp: 0.8 },
  { name: 'Pepper', minutes: 240, seed: 2.5, sell: 3, xp: 1 },
  { name: 'Cauliflower', minutes: 480, seed: 3, sell: 4.25, xp: 1.5 },
  { name: 'Parsnip', minutes: 720, seed: 5, sell: 6.5, xp: 2 },
  { name: 'Eggplant', minutes: 960, seed: 6, sell: 8, xp: 2.5 },
  { name: 'Corn', minutes: 1200, seed: 7, sell: 9, xp: 3 },
  { name: 'Radish', minutes: 1440, seed: 7, sell: 9.5, xp: 3.2 },
  { name: 'Wheat', minutes: 1440, seed: 5, sell: 7, xp: 3 },
  { name: 'Kale', minutes: 2160, seed: 10, sell: 10, xp: 4 },
  { name: 'Barley', minutes: 2880, seed: 12, sell: 12, xp: 5 },
] as const

export function getCrop(name: string) {
  return CROPS.find(c => c.name.toLowerCase() === name.toLowerCase()) ?? CROPS[0]
}
export function profitPerHour(crop: { minutes: number; seed: number; sell: number }) {
  return (crop.sell - crop.seed) / (crop.minutes / 60)
}
