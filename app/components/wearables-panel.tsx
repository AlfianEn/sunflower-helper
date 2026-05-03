import { parseWearables } from '../lib/wearables'
import type { FarmSnapshot } from '../lib/db'

export function WearablesPanel({ snapshot }: { snapshot: FarmSnapshot | null }) {
  const data = parseWearables(snapshot)

  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">WEARABLES & EQUIPMENT</div>
      <h2>{data.summary}</h2>

      {data.equipped.length > 0 && (
        <div className="wearableSection">
          <h3>Equipped</h3>
          <div className="wearableGrid">
            {data.equipped.map((w, i) => (
              <div className="wearableCard equipped" key={i}>
                <b>{w.name}</b>
                <span>{w.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.inventory.length > 0 && (
        <div className="wearableSection">
          <h3>Wardrobe ({data.inventory.length})</h3>
          <div className="wearableGrid">
            {data.inventory.slice(0, 12).map((w, i) => (
              <div className="wearableCard" key={i}>
                <b>{w.name}</b>
                <span>{w.bonus}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.equipped.length === 0 && data.inventory.length === 0 && (
        <div className="emptyState">
          <span className="emptyIcon">👔</span>
          <p>Tidak ada wearable data.</p>
        </div>
      )}
    </section>
  )
}
