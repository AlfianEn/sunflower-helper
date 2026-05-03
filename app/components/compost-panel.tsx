import { parseCompost } from '../lib/compost'
import type { FarmSnapshot } from '../lib/db'

export function CompostPanel({ snapshot }: { snapshot: FarmSnapshot | null }) {
  const status = parseCompost(snapshot)

  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">COMPOST MANAGER</div>
      <h2>{status.summary}</h2>

      {status.bins.length === 0 ? (
        <div className="emptyState">
          <span className="emptyIcon">🪴</span>
          <p>Tidak ada compost bin terbaca.</p>
        </div>
      ) : (
        <div className="compostGrid">
          {status.bins.map((b, i) => (
            <div className={`compostCard ${b.ready ? 'ready' : ''}`} key={i}>
              <b>{b.name}</b>
              <span className="compostLevel">Lv.{b.level}</span>
              <span className={b.ready ? 'ok' : ''}>{b.ready ? 'Ready' : b.detail}</span>
              <small>{b.inputItem} → {b.outputQty}x {b.outputItem}</small>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
