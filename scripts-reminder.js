const Database = require('better-sqlite3')
const path = require('path')
const https = require('https')
const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'sunflower.db')
const db = new Database(dbPath)
db.exec(`CREATE TABLE IF NOT EXISTS reminder_log (key TEXT PRIMARY KEY, sentAt TEXT NOT NULL);`)
function setting(key, fallback='') { const row = db.prepare('SELECT value FROM settings WHERE key=?').get(key); return row?.value ?? fallback }
function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = (process.env.TELEGRAM_CHAT_ID || setting('telegramChatId')).replace(/^telegram:/, '')
  if (!token || !chatId) { console.log('[NO_TELEGRAM_TOKEN]', text); return Promise.resolve(false) }
  const body = JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true })
  return new Promise(resolve => {
    const req = https.request({ hostname: 'api.telegram.org', path: `/bot${token}/sendMessage`, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, res => { res.resume(); res.on('end', () => resolve(res.statusCode >= 200 && res.statusCode < 300)) })
    req.on('error', () => resolve(false)); req.write(body); req.end()
  })
}
function logged(key){ return !!db.prepare('SELECT key FROM reminder_log WHERE key=?').get(key) }
function log(key){ db.prepare('INSERT OR REPLACE INTO reminder_log(key,sentAt) VALUES(?,?)').run(key, new Date().toISOString()) }
;(async () => {
  const now = Date.now()
  const remindReady = setting('remindReady', 'true') !== 'false'
  const beforeMin = Math.max(0, Number(setting('remindBeforeMinutes', '5') || 0))
  try { require('child_process').execFileSync(process.execPath, ['scripts-sync-farm.js'], { cwd: process.cwd(), stdio: 'inherit' }) } catch (e) { console.error('[sync-farm-failed]', e.message) }
  const manualPlans = db.prepare(`SELECT id, crop, plotCount, harvestAt, 'manual' as source FROM crop_plans WHERE status='active'`).all()
  const autoPlans = db.prepare(`SELECT plotId as id, crop, 1 as plotCount, harvestAt, 'auto' as source FROM auto_crop_plans WHERE status='active'`).all()
  const plans = [...autoPlans, ...manualPlans].sort((a,b)=>new Date(a.harvestAt)-new Date(b.harvestAt))
  for (const p of plans) {
    const harvest = new Date(p.harvestAt).getTime()
    const beforeKey = `before:${p.source}:${p.id}:${beforeMin}`
    if (beforeMin > 0 && !logged(beforeKey) && harvest - now > 0 && harvest - now <= beforeMin * 60_000) {
      await sendTelegram(`🌻 ${p.crop} x${p.plotCount} ready in ~${Math.ceil((harvest-now)/60000)} min. ${p.source === 'auto' ? 'Auto plot' : 'Plan'} #${p.id}`); log(beforeKey)
    }
    const readyKey = `ready:${p.source}:${p.id}`
    if (remindReady && !logged(readyKey) && harvest <= now) {
      await sendTelegram(`🌻 ${p.crop} x${p.plotCount} ready to harvest. ${p.source === 'auto' ? 'Auto plot' : 'Plan'} #${p.id}`); log(readyKey)
    }
  }

  const snap = db.prepare('SELECT json FROM farm_snapshots ORDER BY id DESC LIMIT 1').get()
  if (snap) {
    const parsed = JSON.parse(snap.json); const farm = parsed.farm || parsed; const inv = farm.inventory || {}; const nowMs = Date.now()
    const resources=[]
    const addTree=()=>{ for(const [id,node] of Object.entries(farm.trees||{})){ const t=Number((node.wood||{}).choppedAt||0); if(t && nowMs-t>2*60*60*1000) resources.push(`Tree:${id}`) } }
    const addRock=(type,nodes,base)=>{ for(const [id,node] of Object.entries(nodes||{})){ const t=Number((node.stone||{}).minedAt||0); if(t && nowMs-t>=base*1000) resources.push(`${type}:${id}`) } }
    addTree(); addRock('Stone', farm.stones, 4*60*60); addRock('Iron', farm.iron, 8*60*60); addRock('Gold', farm.gold, 24*60*60)
    if (resources.length && !logged(`resources:${resources.join(',')}`)) { await sendTelegram(`🌻 Resources ready: ${resources.length} node(s) — pohon/batu/ore siap diambil.`); log(`resources:${resources.join(',')}`) }
    const cooking=[]; for(const [building,arr] of Object.entries(farm.buildings||{})){ if(Array.isArray(arr)) for(const b of arr) for(const c of (b.crafting||[])) if(Number(c.readyAt||0)<=nowMs) cooking.push(`${c.name} (${building})`) }
    if (cooking.length && !logged(`cooking:${cooking.join(',')}`)) { await sendTelegram(`🍳 Masakan ready: ${cooking.join(', ')}`); log(`cooking:${cooking.join(',')}`) }
    const doable=(farm.delivery?.orders||[]).filter(o=>!o.completedAt && Number(o.readyAt||0)<=nowMs && Object.entries(o.items||{}).every(([k,v])=>Number(inv[k]||0)>=Number(v)))
    if (doable.length && !logged(`delivery:${doable.map(o=>o.id).join(',')}`)) { await sendTelegram(`📦 Delivery bisa dikirim: ${doable.map(o=>`${o.from}: ${Object.entries(o.items||{}).map(([k,v])=>`${v} ${k}`).join(', ')}`).join(' | ')}`); log(`delivery:${doable.map(o=>o.id).join(',')}`) }
  }

  const daily = setting('dailyReminderTime','')
  if (daily) {
    const d = new Date(); const hhmm = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; const key = `daily:${d.toISOString().slice(0,10)}:${daily}`
    if (hhmm === daily && !logged(key)) { await sendTelegram(`🌻 Daily Sunflower check: ${plans.length} active crop timer(s).`); log(key) }
  }
})()
