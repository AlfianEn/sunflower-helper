import { getExpansionPlan } from '../lib/expansion'
import type { InventoryItem } from '../lib/db'

export function ExpansionPanel({ inventory }: { inventory: InventoryItem[] }) {
  const plan = getExpansionPlan(inventory)

  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">ISLAND EXPANSION</div>
      <h2>Expansion Planner</h2>
      <p className="muted">{plan.summary}</p>

      <div className="expansionGrid">
        {plan.areas.map((a, i) => (
          <div className="expansionCard" key={i}>
            <div className="expansionHeader">
              <b>{a.name}</b>
              <span className="expansionLevel">Lv.{a.levelRequired}+</span>
            </div>
            <div className="expansionCost">
              {a.requirements.map((r, j) => {
                const m = a.missing.find(mm => mm.item === r.item)
                return (
                  <span className={m ? 'costMissing' : 'costOk'} key={j}>
                    {r.item}: {m ? `${m.have}/${m.needed}` : '✓'}
                  </span>
                )
              })}
              {a.sflCost > 0 && <span className="sflCost">💰 {a.sflCost} SFL</span>}
            </div>
            {a.missing.length === 0 && <span className="readyBadge">✓ READY</span>}
          </div>
        ))}
      </div>
    </section>
  )
}
