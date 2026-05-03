import { buildEnergyPlan } from '../lib/energy'
import type { FarmSnapshot } from '../lib/db'

const CATEGORY_ICONS: Record<string, string> = {
  crop: '🌱',
  resource: '🪨',
  cooking: '🍳',
  craft: '🔨',
  animal: '🐔',
  other: '📌',
}

export function EnergyPanel({ snapshot, goal }: { snapshot: FarmSnapshot | null; goal: string }) {
  const plan = buildEnergyPlan(snapshot, goal)

  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">ENERGY MANAGER</div>
      <h2>Energy: {plan.currentEnergy}/{plan.maxEnergy}</h2>
      <p className="muted">{plan.summary}</p>

      <div className="energyBar">
        <div className="energyFill" style={{ width: `${(plan.currentEnergy / plan.maxEnergy) * 100}%` }} />
        <span className="energyText">{Math.round((plan.currentEnergy / plan.maxEnergy) * 100)}%</span>
      </div>

      {plan.actions.length > 0 && (
        <div className="energyActions">
          {plan.actions.map((a, i) => (
            <div className={`energyAction ${a.priority}`} key={i}>
              <span className="actionIcon">{CATEGORY_ICONS[a.category] || '⚡'}</span>
              <div className="actionInfo">
                <b>{a.name}</b>
                <span>{a.reason}</span>
              </div>
              <span className="actionCost">{a.cost} ⚡</span>
            </div>
          ))}
        </div>
      )}

      {plan.remaining < 0 && (
        <div className="energyWarning">
          ⚠️ Energy kurang {Math.abs(plan.remaining)} untuk semua aksi. Prioritaskan yang high priority.
        </div>
      )}
    </section>
  )
}
