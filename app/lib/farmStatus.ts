import type { FarmSnapshot } from './db'
export type ResourceItem = { type:string; id:string; readyAt:number; ready:boolean }
export type CookingItem = { building:string; name:string; readyAt:number; ready:boolean }
export type DeliveryItem = { id:string; from:string; items:Record<string,number>; completed:boolean; ready:boolean }
export function parseFarm(snapshot: FarmSnapshot | null) {
  const empty = { resources: [] as ResourceItem[], cooking: [] as CookingItem[], deliveries: [] as DeliveryItem[], chores: [] as string[] }
  if (!snapshot) return empty
  const root = JSON.parse(snapshot.json); const farm = root.farm || root; const now = Date.now(); const resources: ResourceItem[]=[]
  const addRes=(type:string, nodes:any, field:string, baseMs:number)=>{ if(!nodes) return; for(const [id,node] of Object.entries<any>(nodes)){ const t=Number(node?.[field]?.choppedAt ?? node?.[field]?.minedAt ?? 0); if(t) resources.push({type,id,readyAt:t+baseMs-(Number(node?.[field]?.boostedTime||0)),ready:t+baseMs-(Number(node?.[field]?.boostedTime||0))<=now}) }}
  addRes('Tree', farm.trees, 'wood', 2*60*60*1000); addRes('Stone', farm.stones, 'stone', 4*60*60*1000); addRes('Iron', farm.iron, 'stone', 8*60*60*1000); addRes('Gold', farm.gold, 'stone', 24*60*60*1000)
  const cooking: CookingItem[]=[]; for(const [building, arr] of Object.entries<any>(farm.buildings||{})){ if(!Array.isArray(arr)) continue; for(const b of arr){ for(const c of (b.crafting||[])){ cooking.push({building,name:c.name,readyAt:Number(c.readyAt||0),ready:Number(c.readyAt||0)<=now}) } } }
  const deliveries: DeliveryItem[] = (farm.delivery?.orders||[]).map((o:any)=>({id:o.id,from:o.from,items:o.items||{},completed:!!o.completedAt,ready:(o.readyAt||0)<=now}))
  const chores: string[] = Object.values<any>(farm.choreBoard?.chores||{}).filter((c:any)=>!c.completedAt).slice(0,8).map((c:any)=>c.name)
  return { resources, cooking, deliveries, chores }
}
