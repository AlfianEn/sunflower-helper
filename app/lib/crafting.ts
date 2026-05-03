export const RECIPES: Record<string, Record<string, number>> = {
  'Basic Scarecrow': { Sunflower: 20, Wood: 5 },
  'Nancy': { Sunflower: 200, Wood: 50 },
  'Kuebiko': { Sunflower: 1000, Wood: 100, Gold: 1 },
  'Hen House': { Wood: 200, Stone: 50, Iron: 10 },
  'Kitchen': { Wood: 50, Stone: 20, Iron: 5 },
  'Bakery': { Wood: 100, Stone: 50, Wheat: 50 },
}
export function missingFor(item: string, qty: number, inv: Record<string, number>) {
  const recipe = RECIPES[item] || {}
  return Object.entries(recipe).map(([name, need]) => ({ name, need: need * qty, have: inv[name] || 0, missing: Math.max(0, need * qty - (inv[name] || 0)) }))
}
