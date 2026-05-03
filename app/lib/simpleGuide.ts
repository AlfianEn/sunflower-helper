import type { AutoCropPlan, InventoryItem, CraftTarget, FarmSnapshot } from './db'
import { parseFarm, formatEta } from './farmStatus'
import { CROPS, profitPerHour } from './crops'
import { missingFor } from './crafting'

type Step = { title:string; where:string; why:string; done:string; tone?:'urgent'|'good'|'warn' }
const seedName=(crop:string)=>`${crop} Seed`
const qty=(inv:Record<string,number>,name:string)=>Number(inv[name]||0)
const fmtItems=(items:Record<string,number>)=>Object.entries(items).map(([k,v])=>`${v} ${k}`).join(', ')
function bestSeed(inv:Record<string,number>){ return CROPS.map(c=>({...c,seeds:qty(inv,seedName(c.name)),pph:profitPerHour(c)})).filter(c=>c.seeds>0).sort((a,b)=>b.pph-a.pph)[0] }
export function buildSimpleGuide(autoPlans:AutoCropPlan[], inventory:InventoryItem[], targets:CraftTarget[], snapshot:FarmSnapshot|null){
  const inv=Object.fromEntries(inventory.map(i=>[i.name,Number(i.qty)])); const status=parseFarm(snapshot); const now=Date.now(); const steps:Step[]=[]
  const readyCrops=autoPlans.filter(p=>new Date(p.harvestAt).getTime()<=now)
  if(readyCrops.length) steps.push({tone:'urgent',title:`Panen ${readyCrops.length} crop dulu`,where:'Di farm plot yang sudah ready.',why:'Kalau belum dipanen, plot tidak bisa ditanami ulang.',done:'Semua plot ready sudah kosong.'})
  const plots=Math.max(0,qty(inv,'Crop Plot')); const active=autoPlans.filter(p=>new Date(p.harvestAt).getTime()>now); const slots=Math.max(0,plots-active.length)+readyCrops.length; const seed=bestSeed(inv)
  if(slots>0 && seed) steps.push({title:`Tanam ${Math.min(slots,Math.floor(seed.seeds))} ${seed.name}`,where:'Di crop plot kosong.',why:`Ini seed terbaik yang kebaca dari inventory sekarang (${seed.seeds} seed).`,done:'Tidak ada plot kosong.'})
  const cook=status.cooking.filter(c=>c.ready)[0]; if(cook) steps.push({tone:'urgent',title:`Ambil ${cook.name}`,where:`Buka ${cook.detail || 'building cooking'}.`,why:'Masakan sudah ready, kalau tidak diambil queue berikutnya tertahan.',done:'Queue cooking kosong / item masuk inventory.'})
  const res=status.resources.filter(r=>r.ready); if(res.length){ const names=[...new Set(res.map(r=>r.name))].join(', '); const loc=res.slice(0,4).map(r=>`${r.name} ${r.detail||''}`).join(' | '); steps.push({title:`Ambil resource: ${names}`,where:loc,why:'Resource node sudah selesai cooldown.',done:'Node sudah diambil dan timer cooldown reset.'}) }
  const doable=status.deliveries.find(d=>!d.completed&&d.fulfillable); if(doable) steps.push({tone:'good',title:`Kirim delivery ke ${doable.from}`,where:'Buka Delivery/Town Center/NPC terkait.',why:`Bahan cukup: ${fmtItems(doable.items)}.`,done:'Delivery marked completed.'})
  const blocked=status.deliveries.find(d=>!d.completed&&!d.fulfillable); if(blocked) steps.push({tone:'warn',title:`Jangan kirim delivery ${blocked.from} dulu`,where:'Delivery list.',why:`Kurang: ${fmtItems(blocked.missing)}.`,done:'Farm/craft bahan yang kurang dulu.'})
  const mush=status.mushrooms[0]; if(mush) steps.push({title:`Ambil ${mush.name}`,where:mush.detail||'Di farm map.',why:'Mushroom sedang spawn.',done:'Mushroom hilang dari map setelah sync.'})
  const daily=status.daily[0]; if(daily) steps.push({title:'Ambil Daily Reward',where:'Daily reward/chest.',why:'Reward harian sudah tersedia.',done:'Chest sudah claimed.'})
  if(targets.length){ const miss=targets.flatMap(t=>missingFor(t.item,t.qty,inv).filter(m=>m.missing>0).map(m=>({target:t.item,...m})))[0]; if(miss) steps.push({title:`Fokus cari ${miss.name}`,where:'Sesuai sumber item itu.',why:`Kurang ${miss.missing} untuk craft ${miss.target}.`,done:`${miss.name} sudah cukup.`}) }
  if(!steps.length){ const next=active.sort((a,b)=>new Date(a.harvestAt).getTime()-new Date(b.harvestAt).getTime())[0]; steps.push({tone:'good',title:'Tidak ada aksi penting sekarang',where:'Tunggu timer berikutnya.',why:next?`Next crop: ${next.crop} dalam ${formatEta(new Date(next.harvestAt).getTime())}.`:'Belum ada timer aktif.',done:'Cek lagi nanti.'}) }
  return { main:steps[0], steps:steps.slice(0,5), status }
}
