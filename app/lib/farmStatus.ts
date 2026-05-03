import type { FarmSnapshot } from './db'
export type TimedItem = { type:string; id:string; name:string; readyAt:number; ready:boolean; detail?:string; x?:number; y?:number }
export type DeliveryItem = { id:string; from:string; items:Record<string,number>; completed:boolean; ready:boolean; fulfillable:boolean; missing:Record<string,number>; reward?:any }
export type FarmStatus = { resources:TimedItem[]; cooking:TimedItem[]; deliveries:DeliveryItem[]; chores:TimedItem[]; animals:TimedItem[]; buildings:TimedItem[]; daily:TimedItem[]; mushrooms:TimedItem[]; summary:Record<string,number> }
const DAY=24*60*60*1000
export const serverNow = () => Date.now()
const n=(v:any)=>Number(v||0)
const countReady=(xs:TimedItem[])=>xs.filter(x=>x.ready).length
export function parseFarm(snapshot: FarmSnapshot | null): FarmStatus {
  const empty: FarmStatus={resources:[],cooking:[],deliveries:[],chores:[],animals:[],buildings:[],daily:[],mushrooms:[],summary:{}}
  if(!snapshot) return empty
  const root=JSON.parse(snapshot.json); const farm=root.farm||root; const now=serverNow(); const inv=farm.inventory||{}
  const resources:TimedItem[]=[]
  const addTree=()=>{ for(const [id,node] of Object.entries<any>(farm.trees||{})){ const t=n(node?.wood?.choppedAt); if(t){ const readyAt=t+2*60*60*1000; resources.push({type:'resource',id:`tree:${id}`,name:'Tree',readyAt,ready:now-t>2*60*60*1000,x:node.x,y:node.y,detail:`x:${node.x ?? '-'} y:${node.y ?? '-'}`}) } }}
  const addRock=(name:string,nodes:any,baseSec:number)=>{ for(const [id,node] of Object.entries<any>(nodes||{})){ const t=n(node?.stone?.minedAt); if(t){ const readyAt=t+baseSec*1000; resources.push({type:'resource',id:`${name}:${id}`,name,readyAt,ready:now-t>=baseSec*1000,x:node.x,y:node.y,detail:`x:${node.x ?? '-'} y:${node.y ?? '-'}`}) } }}
  addTree(); addRock('Stone',farm.stones,4*60*60); addRock('Iron',farm.iron,8*60*60); addRock('Gold',farm.gold,24*60*60); addRock('Crimstone',farm.crimstones,24*60*60); addRock('Sunstone',farm.sunstones,3*24*60*60)
  const cooking:TimedItem[]=[]; for(const [building,arr] of Object.entries<any>(farm.buildings||{})){ if(Array.isArray(arr)) for(const b of arr){ if(n(b.readyAt)>now) cooking.push({type:'building',id:`building:${building}:${b.id}`,name:String(building),readyAt:n(b.readyAt),ready:false,detail:'building under construction'}) ; for(const c of (b.crafting||[])){ const readyAt=n(c.readyAt); cooking.push({type:'cooking',id:`cook:${building}:${c.name}:${readyAt}`,name:c.name,readyAt,ready:readyAt<=now,detail:String(building)}) } } }
  const deliveries:DeliveryItem[]=(farm.delivery?.orders||[]).filter((o:any)=>n(o.readyAt)<=now).map((o:any)=>{ const missing:Record<string,number>={}; for(const [k,v] of Object.entries(o.items||{})){ const m=Number(v)-Number(inv[k]||0); if(m>0) missing[k]=m } return {id:o.id,from:o.from,items:o.items||{},completed:!!o.completedAt,ready:n(o.readyAt)<=now,fulfillable:Object.keys(missing).length===0,missing,reward:o.reward} })
  const chores:TimedItem[]=Object.entries<any>(farm.choreBoard?.chores||{}).filter(([,c])=>c.startedAt&&!c.completedAt&&!c.skippedAt).map(([id,c])=>({type:'chore',id:`chore:${id}`,name:c.name,readyAt:0,ready:true,detail:`reward ${Object.entries(c.reward?.items||{}).map(([k,v])=>`${v} ${k}`).join(', ')}`}))
  const animals:TimedItem[]=[]; for(const [house,obj] of [['Hen House',farm.henHouse],['Barn',farm.barn]] as any){ for(const [id,a] of Object.entries<any>(obj?.animals||{})){ animals.push({type:'animal',id:`animal:${house}:${id}`,name:a.type,readyAt:0,ready:a.state==='idle',detail:`${house} · ${a.state}`}) }}
  const buildings:TimedItem[]=cooking.filter(x=>x.type==='building')
  const daily:TimedItem[]=[]; const chest=n(farm.dailyRewards?.chest?.collectedAt); if(!chest || now-chest>=DAY) daily.push({type:'daily',id:'daily:chest',name:'Daily Reward Chest',readyAt:chest+DAY,ready:true})
  const mushrooms:TimedItem[]=Object.entries<any>(farm.mushrooms?.mushrooms||{}).map(([id,m])=>({type:'mushroom',id:`mushroom:${id}`,name:m.name||'Mushroom',readyAt:0,ready:true,detail:`x${m.amount||1} · x:${m.x ?? '-'} y:${m.y ?? '-'}`,x:m.x,y:m.y}))
  const summary={resourcesReady:countReady(resources),cookingReady:countReady(cooking.filter(x=>x.type==='cooking')),deliveriesDoable:deliveries.filter(d=>!d.completed&&d.fulfillable).length,deliveriesBlocked:deliveries.filter(d=>!d.completed&&!d.fulfillable).length,choresOpen:chores.length,animalsIdle:animals.filter(a=>a.ready).length,dailyReady:daily.length,mushroomsReady:mushrooms.length,buildingsInProgress:buildings.length}
  return {resources,cooking:cooking.filter(x=>x.type==='cooking'),deliveries,chores,animals,buildings,daily,mushrooms,summary}
}
export function formatEta(ms:number){ const now=serverNow(); if(ms<=now) return 'ready'; const m=Math.ceil((ms-now)/60000); if(m<60) return `${m}m`; const h=Math.floor(m/60), r=m%60; return r?`${h}h ${r}m`:`${h}h` }
