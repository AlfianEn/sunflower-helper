const Database = require('better-sqlite3')
const path = require('path')
const https = require('https')
const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'sunflower.db')
const db = new Database(dbPath)
db.exec(`CREATE TABLE IF NOT EXISTS reminder_log (cropPlanId INTEGER PRIMARY KEY, sentAt TEXT NOT NULL);`)
const due = db.prepare(`SELECT * FROM crop_plans WHERE status='active' AND datetime(harvestAt) <= datetime('now') AND id NOT IN (SELECT cropPlanId FROM reminder_log) ORDER BY harvestAt ASC`).all()
function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const rawChat = process.env.TELEGRAM_CHAT_ID || ''
  const chatId = rawChat.replace(/^telegram:/, '')
  if (!token || !chatId) { console.log('[NO_TELEGRAM_TOKEN]', text); return Promise.resolve(false) }
  const body = JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true })
  return new Promise(resolve => {
    const req = https.request({ hostname: 'api.telegram.org', path: `/bot${token}/sendMessage`, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, res => { res.resume(); res.on('end', () => resolve(res.statusCode >= 200 && res.statusCode < 300)) })
    req.on('error', () => resolve(false)); req.write(body); req.end()
  })
}
;(async () => {
  for (const p of due) {
    const msg = `🌻 Sunflower Helper\n${p.crop} x${p.plotCount} ready to harvest.\nPlan #${p.id}`
    await sendTelegram(msg)
    console.log(`[DUE] ${p.crop} x${p.plotCount} ready. plan=${p.id}`)
    db.prepare('INSERT OR REPLACE INTO reminder_log(cropPlanId,sentAt) VALUES(?,?)').run(p.id, new Date().toISOString())
  }
})()
