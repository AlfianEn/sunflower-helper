import { computeMRP } from '../lib/mrp'
import type { CraftTarget, InventoryItem } from '../lib/db'

export function MRPPanel({ targets, inventory }: { targets: CraftTarget[]; inventory: InventoryItem[] }) {
  if (targets.length === 0) return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">MATERIAL REQUIREMENTS</div>
      <h2>MRP Planner</h2>
      <p className="muted">Tambah target craft dulu di Crafting Planner untuk melihat material requirements.</p>
    </section>
  )

  const mrp = computeMRP(targets, inventory)

  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">MATERIAL REQUIREMENTS</div>
      <h2>MRP Analysis</h2>
      <p className="muted">{mrp.summary}</p>
      
      {mrp.targets.map((t, i) => (
        <div className="mrpTarget" key={i}>
          <div className="mrpHeader">
            <b>{t.item} x{t.qty}</b>
            <span className={t.canCraft ? 'pill ok' : 'pill warn'}>
              {t.canCraft ? '✓ Ready' : '✗ Missing'}
            </span>
          </div>
          <div className="mrpMaterials">
            {t.materials.map((m, j) => (
              <div className={`mrpMaterial ${m.gap > 0 ? 'gap' : 'sufficient'}`} key={j}>
                <div className="mrpName">
                  <span>{m.name}</span>
                  <small>{m.source}</small>
                </div>
                <div className="mrpQty">
                  <span className={m.gap > 0 ? 'warn' : 'ok'}>{m.have}/{m.needed}</span>
                  {m.gap > 0 && <span className="gapBadge">-{m.gap}</span>}
                </div>
                <small className="mrpTime">{m.estimatedTime}</small>
              </div>
            ))}
          </div>
        </div>
      ))}

      {mrp.totalGaps.length > 0 && (
        <div className="mrpGaps">
          <h3>Total gaps yang perlu diisi:</h3>
          <div className="gapList">
            {mrp.totalGaps.map((g, i) => (
              <div className="gapItem" key={i}>
                <b>{g.name}</b>
                <span className="warn">-{g.gap}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
