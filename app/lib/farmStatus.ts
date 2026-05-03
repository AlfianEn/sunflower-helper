import type { FarmSnapshot } from './db'
export type ResourceItem = { type:string; id:string; readyAt:number; ready:boolean }
export type CookingItem = { building:string; name:string; readyAt:number; ready:boolean }
export type DeliveryItem = { id:string; from:string; items:Record<string,number>; completed:boolean; ready:boolean; fulfillable:boolean }
export function parseFarm(snapshot: FarmSnapshot | null) {
  const empty = { resources: [] as ResourceItem[], cooking: [] as CookingItem[], deliveries: [] as DeliveryItem[], chores: [] as string[] }
  if (!snapshot) return empty
  const root = JSON.parse(snapshot.json); const farm = root.farm || root; const now = Date.now(); const inv = farm.inventory || {}; const resources: ResourceItem[]=[]
  const addTree=()=>{ for(const [id,node] of Object.entries<any>(farm.trees||{})){ const t=Number(node?.wood?.choppedAt ?? 0); if(t) resources.push({type:'Tree',id,readyAt:t+2*60*60*1000,ready:now-t>2*60*60*1000}) }}
  const addRock=(type:string,nodes:any,base:number)=>{ for(const [id,node] of Object.entries<any>(nodes||{})){ const t=Number(node?.stone?.minedAt ?? 0); if(t) resources.push({type,id,readyAt:t+base*1000,ready:now-t>=base*1000}) }}
  addTree(); addRock('Stone',farm.stones,4*60*60); addRock('Iron',farm.iron,8*60*60); addRock('Gold',farm.gold,24*60*60)
  const cooking: CookingItem[]=[]; for(const [building, arr] of Object.entries<any>(farm.buildings||{})){ if(!Array.isArray(arr)) continue; for(const b of arr){ for(const c of (b.crafting||[])){ const readyAt=Number(c.readyAt||0); cooking.push({building,name:c.name,readyAt,ready:readyAt<=now}) } } }
  const deliveries: DeliveryItem[]=(farm.delivery?.orders||[]).map((o:any)=>{ const fulfillable=Object.entries(o.items||{}).every(([name,need])=>Number(inv[name]||0)>=Number(need)); return {id:o.id,from:o.from,items:o.items||{},completed:!!o.completedAt,ready:(o.readyAt||0)<=now,fulfillable} }).filter((d:DeliveryItem)=>d.ready)
  const chores: string[]=Object.values<any>(farm.choreBoard?.chores||{}).filter((c:any)=>c.startedAt&&!c.completedAt&&!c.skippedAt).slice(0,8).map((c:any)=>c.name)
  return { resources, cooking, deliveries, chores }
}
