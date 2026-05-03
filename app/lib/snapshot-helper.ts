import type { FarmSnapshot } from './db'

export function safeParseSnapshot(snapshot: FarmSnapshot | null): any | null {
  if (!snapshot) return null
  try {
    const root = JSON.parse(snapshot.json)
    return root.farm || root
  } catch {
    return null
  }
}

export function getInventoryFromSnapshot(snapshot: FarmSnapshot | null): Record<string, number> {
  const farm = safeParseSnapshot(snapshot)
  return farm?.inventory || {}
}
