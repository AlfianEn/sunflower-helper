import { getCrop, profitPerHour } from './crops'
import { missingFor, RECIPES } from './crafting'
import type { AutoCropPlan, InventoryItem, CraftTarget } from './db'

export type CoachAction = { title: string; detail: string; priority: 'urgent' | 'high' | 'medium' | 'low' }
export function buildCoach(autoPlans: AutoCropPlan[], inventory: InventoryItem[], targets: CraftTarget[]): CoachAction[] {
  const now = Date.now()
  const inv = Object.fromEntries(inventory.map(i => [i.name, i.qty]))
  const actions: CoachAction[] = []
  const ready = autoPlans.filter(p => new Date(p.harvestAt).getTime() <= now)
  if (ready.length) {
    const grouped = ready.reduce<Record<string, number>>((a,p)=>(a[p.crop]=(a[p.crop]||0)+1,a),{})
    actions.push({ priority: 'urgent', title: `Harvest sekarang: ${ready.length} plot ready`, detail: Object.entries(grouped).map(([k,v])=>`${k} x${v}`).join(', ') })
  }
  const soon = autoPlans.filter(p => { const ms = new Date(p.harvestAt).getTime()-now; return ms>0 && ms<=10*60_000 })
  if (soon.length) actions.push({ priority: 'high', title: `${soon.length} plot ready <10 menit`, detail: 'Tunggu sebentar, jangan mulai aktivitas panjang dulu.' })
  const missingTargets = targets.flatMap(t => missingFor(t.item, t.qty, inv).filter(m => m.missing > 0).map(m => ({ target: t.item, ...m })))
  if (missingTargets.length) {
    const m = missingTargets[0]
    actions.push({ priority: 'high', title: `Fokus bahan: ${m.name}`, detail: `Kurang ${m.missing} untuk ${m.target}. Prioritaskan farming/resource ini dulu.` })
  } else if (targets.length) {
    actions.push({ priority: 'high', title: 'Target craft sudah siap', detail: `Bahan untuk ${targets[0].item} terlihat cukup. Cek di game lalu craft.` })
  }
  const active = autoPlans.filter(p => new Date(p.harvestAt).getTime() > now)
  if (active.length) {
    const next = active[0]
    const min = Math.ceil((new Date(next.harvestAt).getTime()-now)/60000)
    actions.push({ priority: 'medium', title: `Next harvest: ${next.crop}`, detail: `Sekitar ${min} menit lagi. Bot akan remind otomatis.` })
  }
  const ranked = ['Soybean','Cabbage','Carrot','Pumpkin','Sunflower'].map(getCrop).sort((a,b)=>profitPerHour(b)-profitPerHour(a))
  actions.push({ priority: 'low', title: `Rekomendasi tanam berikutnya: ${ranked[0].name}`, detail: `Profit/hour baseline tertinggi dari data helper: ${profitPerHour(ranked[0]).toFixed(3)} SFL/jam. Sesuaikan dengan seed stock & target craft.` })
  if (!autoPlans.length) actions.unshift({ priority: 'urgent', title: 'Tidak ada crop aktif terbaca', detail: 'Kalau farm kosong, tanam crop di game. Kalau tidak kosong, API sync perlu dicek.' })
  return actions
}
