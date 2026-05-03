import { parseBuildings } from '../lib/buildings'
import type { FarmSnapshot, InventoryItem } from '../lib/db'

export function BuildingPlanner({ snapshot, inventory }: { snapshot: FarmSnapshot | null; inventory: InventoryItem[] }) {
  const plan = parseBuildings(snapshot, inventory)
  const upgradable = plan.buildings.filter(b => b.canUpgrade)

  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">BUILDING UPGRADE PLANNER</div>
      <h2>Buildings</h2>
      <p className="muted">{plan.summary}</p>

      {plan.buildings.length === 0 ? (
        <div className="emptyState">
          <span className="emptyIcon">🏗️</span>
          <p>Belum ada data building terbaca dari API.</p>
        </div>
      ) : (
        <div className="buildingGrid">
          {plan.buildings.map((b, i) => (
            <div className={`buildingCard ${b.canUpgrade ? 'upgradable' : ''}`} key={i}>
              <div className="buildingHeader">
                <b>{b.name}</b>
                <span className="buildingLevel">Lv.{b.level}/{b.maxLevel}</span>
              </div>

              {b.nextUpgradeCost.length > 0 ? (
                <div className="upgradeInfo">
                  <div className="upgradeCost">
                    <span className="costLabel">Upgrade ke Lv.{b.level + 1}:</span>
                    {b.nextUpgradeCost.map((c, j) => (
                      <span className={b.missing.find(m => m.item === c.item) ? 'costMissing' : 'costOk'} key={j}>
                        {c.item}: {b.missing.find(m => m.item === c.item)?.have || c.qty}/{c.qty}
                      </span>
                    ))}
                    {b.sflCost > 0 && <span className="sflCost">💰 {b.sflCost} SFL</span>}
                  </div>
                  {b.canUpgrade && <span className="readyBadge">✓ BISA UPGRADE</span>}
                </div>
              ) : (
                <div className="maxLevel">
                  <span className="maxBadge">MAX LEVEL</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {plan.totalGaps.length > 0 && (
        <div className="buildingGaps">
          <h3>Total material gaps:</h3>
          <div className="gapList">
            {plan.totalGaps.map((g, i) => (
              <div className="gapItem" key={i}>
                <b>{g.item}</b>
                <span className="warn">-{g.gap}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
