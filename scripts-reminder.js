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
  const plans = db.prepare(`SELECT * FROM crop_plans WHERE status='active' ORDER BY harvestAt ASC`).all()
  for (const p of plans) {
    const harvest = new Date(p.harvestAt).getTime()
    const beforeKey = `before:${p.id}:${beforeMin}`
    if (beforeMin > 0 && !logged(beforeKey) && harvest - now > 0 && harvest - now <= beforeMin * 60_000) {
      await sendTelegram(`🌻 ${p.crop} x${p.plotCount} ready in ~${Math.ceil((harvest-now)/60000)} min. Plan #${p.id}`); log(beforeKey)
    }
    const readyKey = `ready:${p.id}`
    if (remindReady && !logged(readyKey) && harvest <= now) {
      await sendTelegram(`🌻 ${p.crop} x${p.plotCount} ready to harvest. Plan #${p.id}`); log(readyKey)
    }
  }
  const daily = setting('dailyReminderTime','')
  if (daily) {
    const d = new Date(); const hhmm = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; const key = `daily:${d.toISOString().slice(0,10)}:${daily}`
    if (hhmm === daily && !logged(key)) { await sendTelegram(`🌻 Daily Sunflower check: ${plans.length} active crop timer(s).`); log(key) }
  }
})()
