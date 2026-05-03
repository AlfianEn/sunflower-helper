import type { FarmSnapshot, InventoryItem, AutoCropPlan, CraftTarget } from './db'
import { parseFarm } from './farmStatus'
import { missingFor } from './crafting'

export type SmartAlert = {
  id: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  category: 'crop' | 'cooking' | 'resource' | 'delivery' | 'energy' | 'craft' | 'daily' | 'mushroom'
  title: string
  message: string
  action: string
  icon: string
}

export function buildSmartAlerts(
  snapshot: FarmSnapshot | null,
  autoPlans: AutoCropPlan[],
  inventory: InventoryItem[],
  targets: CraftTarget[]
): SmartAlert[] {
  const alerts: SmartAlert[] = []
  const now = Date.now()
  const farm = parseFarm(snapshot)
  const inv = Object.fromEntries(inventory.map(i => [i.name, Number(i.qty)]))

  // Ready crops - URGENT
  const readyCrops = autoPlans.filter(p => new Date(p.harvestAt).getTime() <= now)
  if (readyCrops.length > 0) {
    alerts.push({
      id: 'crops-ready',
      priority: 'urgent',
      category: 'crop',
      title: `${readyCrops.length} crop siap panen!`,
      message: readyCrops.map(c => c.crop).join(', '),
      action: 'Panen sekarang agar bisa tanam ulang',
      icon: '🌾'
    })
  }

  // Next crop coming soon
  const nextCrops = autoPlans
    .filter(p => new Date(p.harvestAt).getTime() > now)
    .sort((a, b) => new Date(a.harvestAt).getTime() - new Date(b.harvestAt).getTime())
  if (nextCrops.length > 0) {
    const next = nextCrops[0]
    const mins = Math.round((new Date(next.harvestAt).getTime() - now) / 60000)
    if (mins <= 10) {
      alerts.push({
        id: 'crop-soon',
        priority: 'medium',
        category: 'crop',
        title: `${next.crop} ready dalam ${mins}m`,
        message: `Plot ${next.plotId}`,
        action: 'Siap-siap panen',
        icon: '⏰'
      })
    }
  }

  // Cooking ready
  const readyCooking = farm.cooking.filter(c => c.ready)
  if (readyCooking.length > 0) {
    alerts.push({
      id: 'cooking-ready',
      priority: 'high',
      category: 'cooking',
      title: `${readyCooking.length} masakan siap`,
      message: readyCooking.map(c => `${c.name} di ${c.detail || 'building'}`).join(', '),
      action: 'Ambil sekarang, queue berikutnya tertahan',
      icon: '🍳'
    })
  }

  // Resources ready
  const readyResources = farm.resources.filter(r => r.ready)
  if (readyResources.length > 0) {
    alerts.push({
      id: 'resources-ready',
      priority: 'medium',
      category: 'resource',
      title: `${readyResources.length} resource siap`,
      message: [...new Set(readyResources.map(r => r.name))].join(', '),
      action: 'Ambil sebelum cooldown reset',
      icon: '🪓'
    })
  }

  // Deliveries doable
  const doableDeliveries = farm.deliveries.filter(d => !d.completed && d.fulfillable)
  if (doableDeliveries.length > 0) {
    alerts.push({
      id: 'delivery-doable',
      priority: 'high',
      category: 'delivery',
      title: `${doableDeliveries.length} delivery bisa dikirim`,
      message: doableDeliveries.map(d => d.from).join(', '),
      action: 'Kirim sekarang untuk dapat reward',
      icon: '📦'
    })
  }

  // Daily reward
  if (farm.daily.length > 0) {
    alerts.push({
      id: 'daily-ready',
      priority: 'medium',
      category: 'daily',
      title: 'Daily reward tersedia',
      message: 'Reward harian sudah bisa di-claim',
      action: 'Claim sekarang',
      icon: '🎁'
    })
  }

  // Mushrooms
  if (farm.mushrooms.length > 0) {
    alerts.push({
      id: 'mushroom-ready',
      priority: 'low',
      category: 'mushroom',
      title: `${farm.mushrooms.length} mushroom muncul`,
      message: farm.mushrooms.map(m => `${m.name} ${m.detail || ''}`).join(', '),
      action: 'Ambil kalau lewat',
      icon: '🍄'
    })
  }

  // Craft gaps warning
  if (targets.length > 0) {
    const target = targets[0]
    const gaps = missingFor(target.item, target.qty, inv).filter(m => m.missing > 0)
    if (gaps.length > 0) {
      const top = gaps[0]
      alerts.push({
        id: 'craft-gap',
        priority: 'medium',
        category: 'craft',
        title: `Craft target butuh ${top.name}`,
        message: `Kurang ${top.missing} ${top.name} untuk ${target.item}`,
        action: `Fokus cari ${top.name}`,
        icon: '🔨'
      })
    }
  }

  return alerts.sort((a, b) => {
    const order = { urgent: 0, high: 1, medium: 2, low: 3 }
    return order[a.priority] - order[b.priority]
  })
}
