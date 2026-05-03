import { parseFishing } from '../lib/fishing'
import type { FarmSnapshot } from '../lib/db'
import { formatEta } from '../lib/farmStatus'

export function FishingPanel({ snapshot }: { snapshot: FarmSnapshot | null }) {
  const status = parseFishing(snapshot)

  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">FISHING & CRAB TRAPS</div>
      <h2>{status.summary}</h2>

      {status.spots.length === 0 ? (
        <div className="emptyState">
          <span className="emptyIcon">🎣</span>
          <p>Tidak ada fishing spot/crab trap terbaca.</p>
        </div>
      ) : (
        <div className="fishingGrid">
          {status.spots.map((s, i) => (
            <div className={`fishingCard ${s.ready ? 'ready' : ''}`} key={i}>
              <span className="fishingIcon">{s.type === 'fishing' ? '🎣' : '🦀'}</span>
              <b>{s.name}</b>
              <span className={s.ready ? 'ok' : ''}>{s.ready ? 'Ready' : s.readyAt ? formatEta(s.readyAt) : 'Unknown'}</span>
              <small>{s.detail}</small>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
