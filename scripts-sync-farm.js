const fs = require('fs')
const https = require('https')
const path = require('path')
const Database = require('better-sqlite3')
for (const line of fs.readFileSync('.env','utf8').split(/\n/)) { const m=line.match(/^([^=]+)=(.*)$/); if(m) process.env[m[1]]=m[2].replace(/^"|"$/g,'') }
const farmId = process.env.SUNFLOWER_FARM_ID || '3132688624394422'
const apiKey = process.env.SFL_API_KEY
const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'sunflower.db')
const db = new Database(dbPath)
db.exec(`CREATE TABLE IF NOT EXISTS farm_snapshots (id INTEGER PRIMARY KEY AUTOINCREMENT, farmId TEXT NOT NULL, fetchedAt TEXT NOT NULL, json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS auto_crop_plans (plotId TEXT PRIMARY KEY, crop TEXT NOT NULL, plantedAt TEXT, harvestAt TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', raw TEXT NOT NULL, updatedAt TEXT NOT NULL);`)
function getJson(url) { return new Promise((resolve,reject)=>{ const req=https.request(url,{headers:{Authorization:`Bearer ${apiKey}`,'x-api-key':apiKey,Accept:'application/json'}},res=>{let data='';res.on('data',d=>data+=d);res.on('end',()=>{try{resolve({status:res.statusCode,json:JSON.parse(data)})}catch(e){reject(new Error(`bad json ${res.statusCode}: ${data.slice(0,120)}`))}})}); req.on('error',reject); req.end() }) }
function findPlots(obj) {
  const out=[]
  function walk(v,p='') {
    if (!v || typeof v !== 'object') return
    if (!Array.isArray(v)) {
      for (const [k,val] of Object.entries(v)) {
        const low=k.toLowerCase()
        if ((low.includes('plot') || low.includes('crop')) && val && typeof val === 'object') out.push({path:p+'/'+k, value:val})
        walk(val,p+'/'+k)
      }
    } else v.forEach((x,i)=>walk(x,`${p}[${i}]`))
  }
  walk(obj)
  return out
}
function extractCropEntries(farm) {
  const entries=[]
  if (farm.crops && typeof farm.crops === 'object') {
    for (const [plotId, plot] of Object.entries(farm.crops)) {
      if (!plot || typeof plot !== 'object' || !plot.crop) continue
      const crop = plot.crop
      const name = crop.name
      const plantedAtMs = Number(crop.plantedAt || 0)
      const boostedTime = Number(crop.boostedTime || 0)
      if (name && plantedAtMs && boostedTime) {
        entries.push({ plotId, crop: String(name), plantedAt: new Date(plantedAtMs).toISOString(), harvestAt: new Date(plantedAtMs + boostedTime).toISOString(), raw: plot })
      }
    }
    return entries
  }
  const candidates=findPlots(farm)
  for (const c of candidates) {
    const v=c.value
    const items = Array.isArray(v) ? v.map((x,i)=>[String(i),x]) : Object.entries(v)
    for (const [id,row] of items) {
      if (!row || typeof row !== 'object') continue
      const crop = row.crop || row.name || row.planted?.crop || row.planted?.name || row.seed || row.seedName
      const plantedAt = row.plantedAt || row.planted_at || row.planted?.plantedAt || row.createdAt || row.created_at
      const harvestAt = row.harvestAt || row.harvest_at || row.readyAt || row.ready_at || row.planted?.harvestAt
      if (crop && harvestAt) entries.push({ plotId: `${c.path}/${id}`, crop: String(crop), plantedAt: plantedAt ? new Date(plantedAt).toISOString() : null, harvestAt: new Date(harvestAt).toISOString(), raw: row })
    }
  }
  return entries
}
;(async()=>{
  if (!apiKey) throw new Error('SFL_API_KEY missing')
  const {status,json}=await getJson(`https://api.sunflower-land.com/community/farms/${farmId}`)
  if (status !== 200) throw new Error(`SFL API HTTP ${status}: ${JSON.stringify(json).slice(0,200)}`)
  const now=new Date().toISOString()
  db.prepare('INSERT INTO farm_snapshots(farmId,fetchedAt,json) VALUES(?,?,?)').run(farmId, now, JSON.stringify(json))
  const farm=json.farm || json
  const entries=extractCropEntries(farm)
  for (const e of entries) db.prepare('INSERT INTO auto_crop_plans(plotId,crop,plantedAt,harvestAt,status,raw,updatedAt) VALUES(?,?,?,?,?,?,?) ON CONFLICT(plotId) DO UPDATE SET crop=excluded.crop, plantedAt=excluded.plantedAt, harvestAt=excluded.harvestAt, status=excluded.status, raw=excluded.raw, updatedAt=excluded.updatedAt').run(e.plotId,e.crop,e.plantedAt,e.harvestAt,'active',JSON.stringify(e.raw),now)
  fs.writeFileSync(path.join(process.cwd(),'data','last-farm-sync.json'), JSON.stringify({ok:true,status,farmId,fetchedAt:now,autoCropCount:entries.length,farmKeys:Object.keys(farm).slice(0,80)},null,2))
  console.log(`synced farm ${farmId}; autoCropCount=${entries.length}`)
})().catch(e=>{console.error(e.message); process.exit(1)})
