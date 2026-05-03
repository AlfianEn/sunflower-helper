import { redirect } from 'next/navigation'
import { isAuthed, login, logout } from './lib/auth'
import { store } from './lib/db'
import { CROPS, getCrop, profitPerHour } from './lib/crops'
import { RECIPES, missingFor } from './lib/crafting'
import { sendTelegram } from './lib/notify'

async function loginAction(formData: FormData) { 'use server'; if (await login(String(formData.get('password')||''))) redirect('/'); redirect('/?bad=1') }
async function logoutAction() { 'use server'; await logout(); redirect('/') }
async function saveSettings(formData: FormData) { 'use server';
  store.setSetting('farmId', String(formData.get('farmId')||''))
  store.setSetting('telegramChatId', String(formData.get('telegramChatId')||''))
  store.setSetting('remindReady', formData.get('remindReady') ? 'true' : 'false')
  store.setSetting('remindBeforeMinutes', String(formData.get('remindBeforeMinutes')||'0'))
  store.setSetting('dailyReminderTime', String(formData.get('dailyReminderTime')||''))
  redirect('/')
}
async function addCrop(formData: FormData) { 'use server';
  const crop = getCrop(String(formData.get('crop')||'Sunflower'))
  const plotCount = Math.max(1, Number(formData.get('plotCount')||1))
  const plantedRaw = String(formData.get('plantedAt')||'')
  const plantedAt = plantedRaw ? new Date(plantedRaw) : new Date()
  const harvestAt = new Date(plantedAt.getTime() + crop.minutes * 60_000)
  store.addCropPlan({ crop: crop.name, plotCount, plantedAt, harvestAt, notes:String(formData.get('notes')||'') || null })
  redirect('/')
}
async function markDone(formData: FormData) { 'use server'; store.markDone(Number(formData.get('id'))); redirect('/') }
async function saveInventory(formData: FormData) { 'use server'; store.setInventory(String(formData.get('name')||''), Number(formData.get('qty')||0)); redirect('/') }
async function addTarget(formData: FormData) { 'use server'; store.addTarget(String(formData.get('item')||''), Number(formData.get('qty')||1), String(formData.get('notes')||'') || null); redirect('/') }
async function doneTarget(formData: FormData) { 'use server'; store.doneTarget(Number(formData.get('id'))); redirect('/') }
async function testTelegram() { 'use server'; const r = await sendTelegram('🌻 Sunflower Helper test dari dashboard OK.'); redirect('/?telegram=' + (r.ok ? 'ok' : 'fail')) }

export default async function Page({ searchParams }: { searchParams?: Promise<Record<string,string>> }) {
  const authed = await isAuthed()
  if (!authed) return <main className="wrap"><div className="card" style={{maxWidth:420,margin:'12vh auto'}}><div className="big">🌻 Sunflower Helper</div><p className="muted">Private planner for Sunflower Land.</p><form action={loginAction} className="row"><input name="password" type="password" placeholder="Password" autoFocus/><button>Login</button></form>{(await searchParams)?.bad && <p className="warn">Wrong password.</p>}</div></main>
  const settings = store.settings()
  const plans = store.activePlans()
  const inventory = store.inventory()
  const targets = store.targets()
  const invMap = Object.fromEntries(inventory.map(i => [i.name, i.qty]))
  const now = Date.now()
  return <main className="wrap">
    <div className="hero"><div><div className="big">🌻 Sunflower Command Center</div><div className="muted">Farm ID: {settings.farmId || process.env.SUNFLOWER_FARM_ID || 'not set'}</div></div><form action={logoutAction}><button className="danger">Logout</button></form></div>
    <div className="grid">
      <section className="card"><h2>Settings</h2><form action={saveSettings} className="grid"><input name="farmId" defaultValue={settings.farmId || process.env.SUNFLOWER_FARM_ID || '3132688624394422'} placeholder="Farm ID"/><input name="telegramChatId" defaultValue={settings.telegramChatId || process.env.TELEGRAM_CHAT_ID || 'telegram:840251768'} placeholder="Telegram chat id"/><label className="row"><input type="checkbox" name="remindReady" defaultChecked={settings.remindReady !== 'false'}/> Remind when ready</label><input name="remindBeforeMinutes" type="number" min="0" defaultValue={settings.remindBeforeMinutes || '5'} placeholder="Minutes before ready"/><input name="dailyReminderTime" type="time" defaultValue={settings.dailyReminderTime || ''} title="Daily reminder time"/><button>Save</button></form><form action={testTelegram}><button type="submit">Send test Telegram</button></form></section>
      <section className="card"><h2>Add crop timer</h2><form action={addCrop} className="grid"><select name="crop">{CROPS.map(c=><option key={c.name}>{c.name}</option>)}</select><input name="plotCount" type="number" min="1" defaultValue="1"/><input name="plantedAt" type="datetime-local" title="Planted time, optional"/><input name="notes" placeholder="Notes"/><button>Add Timer</button></form></section>
    </div>
    {(await searchParams)?.telegram === 'ok' && <section className="card ok" style={{marginTop:14}}>Telegram test sent.</section>}
    {(await searchParams)?.telegram === 'fail' && <section className="card warn" style={{marginTop:14}}>Telegram test failed. Check token/chat ID.</section>}
    <section className="card" style={{marginTop:14}}><h2>Active timers</h2>{plans.length===0?<p className="muted">No active timers yet.</p>:<table><thead><tr><th>Crop</th><th>Plots</th><th>ETA</th><th>Profit est.</th><th></th></tr></thead><tbody>{plans.map(p=>{const c=getCrop(p.crop);const ms=new Date(p.harvestAt).getTime()-now;const ready=ms<=0;return <tr key={p.id}><td>{p.crop}</td><td>{p.plotCount}</td><td className={ready?'ok':''}>{ready?'Ready':`${Math.ceil(ms/60000)} min`}</td><td>{((c.sell-c.seed)*p.plotCount).toFixed(2)} SFL</td><td><form action={markDone}><input type="hidden" name="id" value={p.id}/><button>Done</button></form></td></tr>})}</tbody></table>}</section>
    <section className="card" style={{marginTop:14}}><h2>Inventory</h2><form action={saveInventory} className="row"><input name="name" placeholder="Item/crop name"/><input name="qty" type="number" step="0.01" placeholder="Qty"/><button>Save Item</button></form><div className="grid" style={{marginTop:12}}>{inventory.length===0?<p className="muted">No inventory yet.</p>:inventory.map(i=><div className="pill" key={i.name}>{i.name}: {i.qty}</div>)}</div></section>
    <section className="card" style={{marginTop:14}}><h2>Crafting planner</h2><form action={addTarget} className="row"><select name="item">{Object.keys(RECIPES).map(r=><option key={r}>{r}</option>)}</select><input name="qty" type="number" min="1" defaultValue="1"/><input name="notes" placeholder="Target notes"/><button>Add Target</button></form>{targets.length===0?<p className="muted">No craft targets yet.</p>:targets.map(t=><div className="card" style={{marginTop:12}} key={t.id}><div className="row"><b>{t.item} x{t.qty}</b><form action={doneTarget}><input type="hidden" name="id" value={t.id}/><button>Done</button></form></div><div className="grid">{missingFor(t.item,t.qty,invMap).map(m=><div className={m.missing>0?'pill warn':'pill ok'} key={m.name}>{m.name}: have {m.have} / need {m.need} {m.missing>0?`· missing ${m.missing}`:'· OK'}</div>)}</div></div>)}</section>
    <section className="card" style={{marginTop:14}}><h2>Crop reference</h2><div className="grid">{[...CROPS].sort((a,b)=>profitPerHour(b)-profitPerHour(a)).map(c=><div className="pill" key={c.name}>{c.name}: {c.minutes}m · profit {(c.sell-c.seed).toFixed(2)} SFL · {profitPerHour(c).toFixed(3)}/h</div>)}</div></section>
  </main>
}
