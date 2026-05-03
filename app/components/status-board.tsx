import { formatEta } from '../lib/farmStatus'

type FarmStatus = {
  summary: Record<string, number>
  cooking: { id: string; name: string; ready: boolean; readyAt: number; detail?: string }[]
  resources: { id: string; name: string; ready: boolean; detail?: string }[]
  deliveries: { id: string; from: string; items: Record<string, number>; completed: boolean; fulfillable: boolean; missing: Record<string, number> }[]
  mushrooms: { id: string; name: string; detail?: string }[]
  daily: { id: string; name: string }[]
}

export function StatusBoard({ status }: { status: FarmStatus }) {
  const s = status.summary
  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <h2>Action Board</h2>
      <div className="statusGrid">
        <StatusTile value={s.cookingReady} label="Cooking ready" />
        <StatusTile value={s.resourcesReady} label="Resources" />
        <StatusTile value={s.deliveriesDoable} label="Delivery bisa" variant="good" />
        <StatusTile value={s.deliveriesBlocked} label="Delivery kurang" variant="warn" />
        <StatusTile value={s.choresOpen} label="Chores" />
        <StatusTile value={s.animalsIdle} label="Animals idle" />
        <StatusTile value={s.dailyReady} label="Daily" variant="good" />
        <StatusTile value={s.mushroomsReady} label="Mushroom" variant="good" />
      </div>
      <div className="grid" style={{ marginTop: 12 }}>
        <DetailList title="Masakan" empty="Tidak ada cooking queue."
          items={status.cooking.map(c => ({ key: c.id, cls: c.ready ? 'ok' : '', text: `${c.name} · ${c.detail || ''} · ${formatEta(c.readyAt)}` }))} />
        <DetailList title="Resource ready" empty="Belum ada pohon/batu/ore ready."
          items={status.resources.filter(r => r.ready).map(r => ({ key: r.id, cls: 'ok', text: `${r.name} · ${r.detail || ''}` }))} />
        <DetailList title="Delivery" empty="Tidak ada delivery ready."
          items={status.deliveries.filter(d => !d.completed).map(d => ({
            key: d.id, cls: d.fulfillable ? 'ok' : 'warn',
            text: `${d.from}: ${Object.entries(d.items).map(([k, v]) => `${v} ${k}`).join(', ')} ${d.fulfillable ? '· bisa kirim' : `· kurang ${Object.entries(d.missing).map(([k, v]) => `${v} ${k}`).join(', ')}`}`
          }))} />
        <DetailList title="Mushroom / Daily" empty="Tidak ada mushroom/daily ready."
          items={[
            ...status.mushrooms.map(m => ({ key: m.id, cls: 'ok' as const, text: `${m.name} · ${m.detail || ''}` })),
            ...status.daily.map(d => ({ key: d.id, cls: 'ok' as const, text: d.name }))
          ]} />
      </div>
    </section>
  )
}

function StatusTile({ value, label, variant }: { value: number; label: string; variant?: 'good' | 'warn' }) {
  const cls = variant === 'good' ? 'good' : variant === 'warn' ? 'warnTile' : ''
  return <div className={`statusTile ${cls}`}><b>{value}</b><span>{label}</span></div>
}

function DetailList({ title, empty, items }: { title: string; empty: string; items: { key: string; cls: string; text: string }[] }) {
  return (
    <div>
      <h3>{title}</h3>
      {items.length === 0 ? <p className="muted">{empty}</p> : items.map(i => <div className={`pill ${i.cls}`} key={i.key}>{i.text}</div>)}
    </div>
  )
}
