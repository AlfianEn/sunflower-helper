import { redirect } from 'next/navigation'
import { isAuthed, login, logout } from './lib/auth'
import { store } from './lib/db'
import { CROPS, getCrop, profitPerHour } from './lib/crops'
import { RECIPES, missingFor } from './lib/crafting'
import { sendTelegram } from './lib/notify'
import { buildCoach, buildPlaybook } from './lib/coach'
import { formatEta, parseFarm, serverNow } from './lib/farmStatus'
import { buildSimpleGuide } from './lib/simpleGuide'

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
async function setGoal(formData: FormData) { 'use server'; store.setSetting('goal', String(formData.get('goal')||'balanced')); redirect('/') }

export default async function Page({ searchParams }: { searchParams?: Promise<Record<string,string>> }) {
  const authed = await isAuthed()
  if (!authed) return <main className="wrap"><div className="card" style={{maxWidth:420,margin:'12vh auto'}}><div className="big">🌻 Sunflower Helper</div><p className="muted">Private planner for Sunflower Land.</p><form action={loginAction} className="row"><input name="password" type="password" placeholder="Password" autoFocus/><button>Login</button></form>{(await searchParams)?.bad && <p className="warn">Wrong password.</p>}</div></main>
  const settings = store.settings()
  const plans = store.activePlans()
  const autoPlans = store.autoPlans()
  const inventory = store.inventory()
  const targets = store.targets()
  const invMap = Object.fromEntries(inventory.map(i => [i.name, i.qty]))
  const snapshot = store.latestSnapshot()
  const coach = buildCoach(autoPlans, inventory, targets, settings, snapshot)
  const playbook = buildPlaybook(autoPlans, inventory, targets, settings, snapshot)
  const simpleGuide = buildSimpleGuide(autoPlans, inventory, targets, snapshot)
  const farmStatus = simpleGuide.status
  const now = serverNow()
  const readyCrops = autoPlans.filter(p => new Date(p.harvestAt).getTime() <= now)
  const activeCrops = autoPlans.filter(p => new Date(p.harvestAt).getTime() > now)
  const nextCrop = activeCrops.sort((a,b)=>new Date(a.harvestAt).getTime()-new Date(b.harvestAt).getTime())[0]
  const positiveInventory = inventory.filter(i => Number(i.qty) > 0)
  const seedStock = positiveInventory.filter(i => i.name.endsWith(' Seed'))
  const inventoryValue = positiveInventory.reduce((sum,i)=>sum+Number(i.qty),0)
  const targetGaps = targets.flatMap(t => missingFor(t.item,t.qty,invMap).filter(m=>m.missing>0).map(m=>({ target:t.item, ...m })))
  const criticalCount = readyCrops.length + farmStatus.summary.cookingReady + farmStatus.summary.resourcesReady + farmStatus.summary.deliveriesDoable + farmStatus.summary.dailyReady + farmStatus.summary.mushroomsReady
  const syncAgeMin = snapshot ? Math.max(0, Math.round((now - new Date(snapshot.fetchedAt).getTime()) / 60000)) : null
  const goalLabel = settings.goal || 'balanced'
  return <main className="wrap">
    <div className="hero premiumHero"><div><div className="eyebrow">PRIVATE SUNFLOWER LAND OPS</div><div className="big">🌻 Sunflower Helper</div><div className="muted">Assistant harian buat prioritas panen, delivery, cooking, resource, inventory, dan target craft.</div><div className="heroMeta"><span>Farm ID: {settings.farmId || process.env.SUNFLOWER_FARM_ID || 'not set'}</span><span>Goal: {goalLabel}</span><span>Sync: {syncAgeMin===null?'none':`${syncAgeMin}m ago`}</span></div></div><form action={logoutAction}><button className="danger">Logout</button></form></div>
    <section className="opsGrid" style={{marginBottom:14}}>
      <div className="card commandCard"><div className="eyebrow">COMMAND CENTER</div><h1>{simpleGuide.main.title}</h1><p>{simpleGuide.main.why}</p><div className="nextCheck">Next check: {playbook.nextCheck}</div></div>
      <div className="card metricCard urgent"><span>Perlu aksi</span><b>{criticalCount}</b><small>ready crop/cook/resource/delivery/daily</small></div>
      <div className="card metricCard"><span>Crop aktif</span><b>{activeCrops.length}</b><small>{readyCrops.length} ready · {nextCrop ? `${nextCrop.crop} ${formatEta(new Date(nextCrop.harvestAt).getTime())}` : 'no active crop'}</small></div>
      <div className="card metricCard"><span>Inventory</span><b>{positiveInventory.length}</b><small>{seedStock.length} seed types · total qty {inventoryValue.toFixed(0)}</small></div>
      <div className="card metricCard"><span>Craft gaps</span><b>{targetGaps.length}</b><small>{targets.length} active targets</small></div>
    </section>
    <section className="card simpleHero" style={{marginBottom:14}}><div className="eyebrow">FOCUSED ROUTE</div><h1>{simpleGuide.main.title}</h1><div className="simpleGrid"><div><b>Di mana?</b><p>{simpleGuide.main.where}</p></div><div><b>Kenapa?</b><p>{simpleGuide.main.why}</p></div><div><b>Selesai kalau</b><p>{simpleGuide.main.done}</p></div></div><h3>Urutan main sekarang</h3><ol className="simpleSteps">{simpleGuide.steps.map((s,i)=><li className={s.tone||''} key={i}><span className="stepNo">{i+1}</span><b>{s.title}</b><span>{s.where}</span><small>{s.why}</small></li>)}</ol></section>
    <section className="card playbook" style={{marginBottom:14}}><div className="eyebrow">PLAYBOOK MODE</div><h2>{playbook.title}</h2><p className="muted">{playbook.summary}</p><ol className="steps">{playbook.steps.map((step,i)=><li key={i}><b>{step.label}</b><p>{step.detail}</p>{step.doneWhen&&<small>Done kalau: {step.doneWhen}</small>}</li>)}</ol><div className="nextCheck">Next check: {playbook.nextCheck}</div></section>
    <div className="grid">
      <section className="card compact"><h2>Settings ringkas</h2><p className="muted">Auto-sync farm + inventory aktif. Guide berubah sesuai goal.</p><div className="row"><span className="pill ok">Auto sync: ON</span><span className="pill ok">Telegram: ON</span><span className="pill">Farm ID: {settings.farmId || process.env.SUNFLOWER_FARM_ID || '3132688624394422'}</span><span className="pill">Last sync: {snapshot ? new Date(snapshot.fetchedAt).toLocaleTimeString() : 'none'}</span></div><form action={setGoal} className="row" style={{marginTop:12}}><select name="goal" defaultValue={settings.goal || 'balanced'}><option value="balanced">Balanced</option><option value="profit">Profit</option><option value="craft">Craft target</option><option value="level">Level/XP</option></select><button>Set Goal</button></form><form action={testTelegram} style={{marginTop:12}}><button type="submit">Test Telegram</button></form></section>
      <section className="card compact"><h2>Manual fallback</h2><p className="muted">Opsional saja. Pakai ini kalau API game sedang telat/salah baca.</p><form action={addCrop} className="grid"><select name="crop">{CROPS.map(c=><option key={c.name}>{c.name}</option>)}</select><input name="plotCount" type="number" min="1" defaultValue="1"/><input name="plantedAt" type="datetime-local" title="Planted time, optional"/><input name="notes" placeholder="Notes"/><button>Add Manual Timer</button></form></section>
    </div>
    {(await searchParams)?.telegram === 'ok' && <section className="card ok" style={{marginTop:14}}>Telegram test sent.</section>}
    {(await searchParams)?.telegram === 'fail' && <section className="card warn" style={{marginTop:14}}>Telegram test failed. Check token/chat ID.</section>}
    <section className="card compact" style={{marginTop:14}}><h2>Action Board: status yang bisa dicek</h2><div className="statusGrid"><div className="statusTile"><b>{farmStatus.summary.cookingReady}</b><span>Cooking ready</span></div><div className="statusTile"><b>{farmStatus.summary.resourcesReady}</b><span>Resources</span></div><div className="statusTile good"><b>{farmStatus.summary.deliveriesDoable}</b><span>Delivery bisa</span></div><div className="statusTile warnTile"><b>{farmStatus.summary.deliveriesBlocked}</b><span>Delivery kurang</span></div><div className="statusTile"><b>{farmStatus.summary.choresOpen}</b><span>Chores</span></div><div className="statusTile"><b>{farmStatus.summary.animalsIdle}</b><span>Animals idle</span></div><div className="statusTile good"><b>{farmStatus.summary.dailyReady}</b><span>Daily</span></div><div className="statusTile good"><b>{farmStatus.summary.mushroomsReady}</b><span>Mushroom</span></div></div>
      <div className="grid" style={{marginTop:12}}>
        <div><h3>Masakan</h3>{farmStatus.cooking.length===0?<p className="muted">Tidak ada cooking queue.</p>:farmStatus.cooking.map(c=><div className={c.ready?'pill ok':'pill'} key={c.id}>{c.name} · {c.detail} · {formatEta(c.readyAt)}</div>)}</div>
        <div><h3>Resource ready</h3>{farmStatus.resources.filter(r=>r.ready).length===0?<p className="muted">Belum ada pohon/batu/ore ready.</p>:farmStatus.resources.filter(r=>r.ready).map(r=><div className="pill ok" key={r.id}>{r.name} · {r.detail}</div>)}</div>
        <div><h3>Delivery</h3>{farmStatus.deliveries.filter(d=>!d.completed).length===0?<p className="muted">Tidak ada delivery ready.</p>:farmStatus.deliveries.filter(d=>!d.completed).map(d=><div className={d.fulfillable?'pill ok':'pill warn'} key={d.id}>{d.from}: {Object.entries(d.items).map(([k,v])=>`${v} ${k}`).join(', ')} {d.fulfillable?'· bisa kirim':`· kurang ${Object.entries(d.missing).map(([k,v])=>`${v} ${k}`).join(', ')}`}</div>)}</div>
        <div><h3>Mushroom / Daily</h3>{farmStatus.mushrooms.length===0&&farmStatus.daily.length===0?<p className="muted">Tidak ada mushroom/daily ready.</p>:<>{farmStatus.mushrooms.map(m=><div className="pill ok" key={m.id}>{m.name} · {m.detail}</div>)}{farmStatus.daily.map(d=><div className="pill ok" key={d.id}>{d.name}</div>)}</>}</div>
      </div></section>
    <section className="card compact" style={{marginTop:14}}><h2>Detail: Auto harvest timers</h2><p className="muted">Ini dibaca otomatis dari Sunflower Land API. Tidak perlu input manual.</p>{autoPlans.length===0?<p className="muted">Belum ada crop aktif terbaca dari API.</p>:<table><thead><tr><th>Crop</th><th>Plot</th><th>ETA</th><th>Synced</th></tr></thead><tbody>{autoPlans.map(p=>{const ms=new Date(p.harvestAt).getTime()-now;const ready=ms<=0;return <tr key={p.plotId}><td>{p.crop}</td><td>{p.plotId}</td><td className={ready?'ok':''}>{ready?'Ready':`${Math.ceil(ms/60000)} min`}</td><td>{new Date(p.updatedAt).toLocaleTimeString()}</td></tr>})}</tbody></table>}</section>
    <section className="card" style={{marginTop:14}}><h2>Manual fallback timers</h2><p className="muted">Timer manual opsional kalau diperlukan.</p>{plans.length===0?<p className="muted">No manual timers.</p>:<table><thead><tr><th>Crop</th><th>Plots</th><th>ETA</th><th>Profit est.</th><th></th></tr></thead><tbody>{plans.map(p=>{const c=getCrop(p.crop);const ms=new Date(p.harvestAt).getTime()-now;const ready=ms<=0;return <tr key={p.id}><td>{p.crop}</td><td>{p.plotCount}</td><td className={ready?'ok':''}>{ready?'Ready':`${Math.ceil(ms/60000)} min`}</td><td>{((c.sell-c.seed)*p.plotCount).toFixed(2)} SFL</td><td><form action={markDone}><input type="hidden" name="id" value={p.id}/><button>Done</button></form></td></tr>})}</tbody></table>}</section>
    <section className="card compact" style={{marginTop:14}}><h2>Detail: Auto inventory & seed stock</h2><p className="muted">Inventory sekarang di-sync otomatis dari API farm. Input manual hanya fallback override.</p><form action={saveInventory} className="row"><input name="name" placeholder="Manual override item"/><input name="qty" type="number" step="0.01" placeholder="Qty"/><button>Override</button></form>{seedStock.length>0&&<div className="seedStrip">{seedStock.slice(0,12).map(i=><div key={i.name}><b>{i.name.replace(' Seed','')}</b><span>{i.qty} seeds</span></div>)}</div>}<div className="grid" style={{marginTop:12}}>{inventory.length===0?<p className="muted">No inventory yet.</p>:positiveInventory.slice(0,80).map(i=><div className="pill" key={i.name}>{i.name}: {i.qty}</div>)}</div></section>
    <section className="card compact" style={{marginTop:14}}><h2>Detail: Crafting planner</h2><p className="muted">Pilih target craft. Sistem akan bandingkan resep dengan inventory dan kasih tahu bahan yang kurang.</p><form action={addTarget} className="row"><select name="item">{Object.keys(RECIPES).map(r=><option key={r}>{r}</option>)}</select><input name="qty" type="number" min="1" defaultValue="1"/><input name="notes" placeholder="Target notes"/><button>Add Target</button></form>{targets.length===0?<p className="muted">No craft targets yet.</p>:targets.map(t=><div className="card" style={{marginTop:12}} key={t.id}><div className="row"><b>{t.item} x{t.qty}</b><form action={doneTarget}><input type="hidden" name="id" value={t.id}/><button>Done</button></form></div><div className="grid">{missingFor(t.item,t.qty,invMap).map(m=><div className={m.missing>0?'pill warn':'pill ok'} key={m.name}>{m.name}: have {m.have} / need {m.need} {m.missing>0?`· missing ${m.missing}`:'· OK'}</div>)}</div></div>)}</section>
    <section className="card compact" style={{marginTop:14}}><h2>Detail: Crop reference</h2><p className="muted">Referensi cepat crop, waktu tumbuh, estimasi profit, dan profit per jam. Data masih baseline/manual.</p><div className="grid">{[...CROPS].sort((a,b)=>profitPerHour(b)-profitPerHour(a)).map(c=><div className="pill" key={c.name}>{c.name}: {c.minutes}m · profit {(c.sell-c.seed).toFixed(2)} SFL · {profitPerHour(c).toFixed(3)}/h</div>)}</div></section>
  </main>
}
