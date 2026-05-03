import { CROPS, profitPerHour } from './crops'
import { missingFor } from './crafting'
import type { AutoCropPlan, InventoryItem, CraftTarget, FarmSnapshot } from './db'
import { parseFarm } from './farmStatus'

export type CoachAction = { title: string; detail: string; priority: 'urgent' | 'high' | 'medium' | 'low'; tag?: string }
export type PlaybookStep = { label: string; detail: string; doneWhen?: string }
export type Playbook = { title: string; summary: string; steps: PlaybookStep[]; nextCheck: string; mode: string }
const seedName = (crop: string) => `${crop} Seed`
const qty = (inv: Record<string, number>, name: string) => Number(inv[name] || 0)
const group = (plans: AutoCropPlan[]) => plans.reduce<Record<string, number>>((a,p)=>(a[p.crop]=(a[p.crop]||0)+1,a),{})
const fmtGroup = (g: Record<string, number>) => Object.entries(g).map(([k,v])=>`${v} ${k}`).join(', ')
function bestPlant(inv: Record<string, number>, goal: string, targets: CraftTarget[]) {
  const craftNeed = targets.flatMap(t => missingFor(t.item, t.qty, inv).filter(m => m.missing > 0)).find(m => CROPS.some(c => c.name === m.name))
  const candidates = CROPS.map(c => ({...c, seeds: qty(inv, seedName(c.name)), pph: profitPerHour(c)})).filter(c => c.seeds > 0)
  if (goal === 'craft' && craftNeed) return candidates.find(c => c.name === craftNeed.name) || candidates[0]
  return candidates.sort((a,b)=>b.pph-a.pph)[0]
}
export function buildPlaybook(autoPlans: AutoCropPlan[], inventory: InventoryItem[], targets: CraftTarget[], settings: Record<string,string> = {}, snapshot: FarmSnapshot | null = null): Playbook {
  const now = Date.now(); const goal = settings.goal || 'balanced'; const inv = Object.fromEntries(inventory.map(i => [i.name, Number(i.qty)]))
  const plots = Math.max(0, qty(inv, 'Crop Plot')); const ready = autoPlans.filter(p=>new Date(p.harvestAt).getTime()<=now); const active = autoPlans.filter(p=>new Date(p.harvestAt).getTime()>now)
  const freePlots = Math.max(0, plots - active.length)
  const steps: PlaybookStep[] = []
  const status = parseFarm(snapshot)
  if (ready.length) steps.push({ label:`Harvest ${ready.length} plot`, detail:`Harvest: ${fmtGroup(group(ready))}.`, doneWhen:'Semua plot ready sudah kosong/terpanen.' })
  const plant = bestPlant(inv, goal, targets)
  const plantSlots = ready.length + freePlots
  if (plantSlots > 0 && plant) {
    const amount = Math.min(plantSlots, Math.floor(plant.seeds))
    if (amount > 0) steps.push({ label:`Tanam ${amount} ${plant.name}`, detail:`Pakai ${amount} ${seedName(plant.name)}. Mode ${goal}.`, doneWhen:`${amount} plot sudah ditanami ${plant.name}.` })
    if (amount < plantSlots) steps.push({ label:`Beli ${plantSlots - amount} seed tambahan`, detail:`Seed ${plant.name} kurang. Beli di Market lalu tanam sisa plot.`, doneWhen:'Tidak ada plot kosong.' })
  } else if (plantSlots > 0) steps.push({ label:'Beli seed dulu', detail:`Ada ${plantSlots} plot kosong tapi seed tidak cukup/terbaca. Buka Market dan beli seed.`, doneWhen:'Seed tersedia lalu tanam.' })
  const invMap = inv
  const missingTargets = targets.flatMap(t => missingFor(t.item, t.qty, invMap).filter(m=>m.missing>0).map(m=>({target:t.item,...m})))
  if (targets.length && missingTargets.length === 0) steps.push({ label:`Craft ${targets[0].item}`, detail:'Bahan terlihat cukup. Buka crafting/building terkait dan craft target.', doneWhen:'Target craft selesai.' })
  else if (missingTargets.length) { const m=missingTargets[0]; steps.push({ label:`Farm bahan ${m.name}`, detail:`Kurang ${m.missing} untuk ${m.target}. Jangan pecah fokus ke craft lain dulu.`, doneWhen:`${m.name} cukup.` }) }
  const readyCooking = status.cooking.filter(c=>c.ready)
  if (readyCooking.length) steps.push({ label:`Ambil masakan ready (${readyCooking.length})`, detail: readyCooking.map(c=>`${c.name} di ${c.building}`).join(', '), doneWhen:'Semua masakan ready sudah diambil.' })
  const readyResources = status.resources.filter(r=>r.ready)
  if (readyResources.length) { const g=readyResources.reduce<Record<string,number>>((a,r)=>(a[r.type]=(a[r.type]||0)+1,a),{}); steps.push({ label:`Ambil resource ready`, detail:Object.entries(g).map(([k,v])=>`${v} ${k}`).join(', '), doneWhen:'Pohon/batu/ore ready sudah diambil.' }) }
  const openDeliveries = status.deliveries.filter(d=>!d.completed)
  if (openDeliveries.length) steps.push({ label:`Cek delivery (${openDeliveries.length})`, detail: openDeliveries.map(d=>`${d.from}: ${Object.entries(d.items).map(([k,v])=>`${v} ${k}`).join(', ')}`).join(' | '), doneWhen:'Delivery yang bisa dipenuhi sudah dikirim.' })
  if (status.chores.length) steps.push({ label:'Kerjakan chore yang nyambung', detail: status.chores.slice(0,4).join(' | '), doneWhen:'Progress chore harian bertambah.' })
  steps.push({ label:'Daily quick check', detail:'Cek Daily Reward, Compost/Animals, dan event/seasonal task.', doneWhen:'Checklist harian selesai.' })
  const next = active.sort((a,b)=>new Date(a.harvestAt).getTime()-new Date(b.harvestAt).getTime())[0]
  const nextCheck = next ? `${Math.ceil((new Date(next.harvestAt).getTime()-now)/60000)} menit lagi (${next.crop})` : 'setelah tanam crop baru'
  const title = ready.length ? 'Sekarang: Harvest + Replant' : plantSlots > 0 ? 'Sekarang: Isi plot kosong' : 'Sekarang: Tunggu next harvest + daily'
  return { title, summary:`Goal: ${goal}. Crop aktif: ${active.length}. Ready: ${ready.length}. Plot kosong/siap isi: ${plantSlots}.`, steps: steps.slice(0,6), nextCheck, mode: goal }
}
export function buildCoach(autoPlans: AutoCropPlan[], inventory: InventoryItem[], targets: CraftTarget[], settings: Record<string,string> = {}, snapshot: FarmSnapshot | null = null): CoachAction[] {
  const p = buildPlaybook(autoPlans, inventory, targets, settings, snapshot)
  return p.steps.map((s,i)=>({priority:i===0?'urgent':'high', title:s.label, detail:s.detail, tag:`STEP ${i+1}`}))
}
