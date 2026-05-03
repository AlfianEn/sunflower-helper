import https from 'https'

export async function sendTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = (process.env.TELEGRAM_CHAT_ID || '').replace(/^telegram:/, '')
  if (!token || !chatId) return { ok: false, error: 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing' }
  const body = JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true })
  return await new Promise<{ ok: boolean; error?: string }>(resolve => {
    const req = https.request({ hostname: 'api.telegram.org', path: `/bot${token}/sendMessage`, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, res => {
      let data = ''; res.on('data', d => data += d); res.on('end', () => {
        try { const j = JSON.parse(data); resolve({ ok: !!j.ok, error: j.description }) }
        catch { resolve({ ok: res.statusCode ? res.statusCode >= 200 && res.statusCode < 300 : false }) }
      })
    })
    req.on('error', e => resolve({ ok: false, error: e.message }))
    req.write(body); req.end()
  })
}
