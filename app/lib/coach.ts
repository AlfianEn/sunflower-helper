import { CROPS, getCrop, profitPerHour } from './crops'
import { missingFor } from './crafting'
import type { AutoCropPlan, InventoryItem, CraftTarget } from './db'

export type CoachAction = { title: string; detail: string; priority: 'urgent' | 'high' | 'medium' | 'low'; tag?: string }
const seedName = (crop: string) => `${crop} Seed`
const qty = (inv: Record<string, number>, name: string) => Number(inv[name] || 0)

export function buildCoach(autoPlans: AutoCropPlan[], inventory: InventoryItem[], targets: CraftTarget[], settings: Record<string,string> = {}): CoachAction[] {
  const now = Date.now()
  const inv = Object.fromEntries(inventory.map(i => [i.name, Number(i.qty)]))
  const actions: CoachAction[] = []
  const goal = settings.goal || 'balanced'
  const cropPlots = Math.max(0, qty(inv, 'Crop Plot'))
  const occupied = autoPlans.length
  const freePlots = Math.max(0, cropPlots - occupied)
  const ready = autoPlans.filter(p => new Date(p.harvestAt).getTime() <= now)
  if (ready.length) {
    const grouped = ready.reduce<Record<string, number>>((a,p)=>(a[p.crop]=(a[p.crop]||0)+1,a),{})
    actions.push({ priority: 'urgent', tag:'HARVEST', title: `Harvest sekarang: ${ready.length} plot`, detail: Object.entries(grouped).map(([k,v])=>`${k} x${v}`).join(', ') })
  }
  if (freePlots > 0) {
    const candidates = CROPS.map(c => ({...c, seeds: qty(inv, seedName(c.name)), pph: profitPerHour(c)})).filter(c => c.seeds > 0)
    const craftNeed = targets.flatMap(t => missingFor(t.item, t.qty, inv).filter(m => m.missing > 0)).find(m => CROPS.some(c => c.name === m.name))
    let pick = candidates.sort((a,b)=>b.pph-a.pph)[0]
    if (goal === 'craft' && craftNeed) pick = candidates.find(c => c.name === craftNeed.name) || pick
    if (pick) actions.push({ priority:'urgent', tag:'PLANT', title:`Tanam ${pick.name} di ${Math.min(freePlots, Math.floor(pick.seeds))} plot kosong`, detail:`Ada ${freePlots} plot kosong dan ${pick.seeds} ${seedName(pick.name)}. Mode: ${goal}.` })
    else actions.push({ priority:'high', tag:'BUY_SEED', title:`Beli seed dulu`, detail:`Ada ${freePlots} plot kosong tapi seed stock tidak terbaca/cukup. Buka Market dan beli seed sesuai target.` })
  }
  const soon = autoPlans.filter(p => { const ms = new Date(p.harvestAt).getTime()-now; return ms>0 && ms<=10*60_000 })
  if (soon.length) actions.push({ priority: 'high', tag:'WAIT', title: `${soon.length} plot ready <10 menit`, detail: 'Tunggu sebentar, lalu harvest dan tanam ulang.' })
  const missingTargets = targets.flatMap(t => missingFor(t.item, t.qty, inv).filter(m => m.missing > 0).map(m => ({ target: t.item, ...m })))
  if (missingTargets.length) {
    const m = missingTargets.sort((a,b)=>b.missing-a.missing)[0]
    actions.push({ priority: 'high', tag:'CRAFT_MATERIAL', title: `Fokus bahan: ${m.name}`, detail: `Kurang ${m.missing} untuk ${m.target}. Jangan craft target lain dulu.` })
  } else if (targets.length) {
    actions.push({ priority: 'high', tag:'CRAFT', title: 'Craft target sekarang', detail: `Bahan untuk ${targets[0].item} terlihat cukup. Buka game dan craft.` })
  }
  const active = autoPlans.filter(p => new Date(p.harvestAt).getTime() > now)
  if (active.length) {
    const next = active[0]
    const min = Math.ceil((new Date(next.harvestAt).getTime()-now)/60000)
    actions.push({ priority: 'medium', tag:'NEXT', title: `Next harvest: ${next.crop}`, detail: `Sekitar ${min} menit lagi. Bot akan remind otomatis.` })
  }
  const dailyChecks = ['Daily Reward','Chores','Delivery','Compost','Animals','Resource nodes']
  actions.push({ priority:'medium', tag:'DAILY', title:'Daily checklist', detail: dailyChecks.join(' · ') })
  if (!autoPlans.length) actions.unshift({ priority: 'urgent', tag:'SYNC', title: 'Tidak ada crop aktif terbaca', detail: 'Kalau farm kosong, tanam crop. Kalau tidak kosong, tekan sync/tunggu API update.' })
  return actions.slice(0,8)
}
