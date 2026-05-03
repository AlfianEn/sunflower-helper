import { buildGoalSchedule } from '../lib/goals'
import type { InventoryItem, CraftTarget, AutoCropPlan } from '../lib/db'

export function GoalsPanel({ inventory, targets, autoPlans }: { inventory: InventoryItem[]; targets: CraftTarget[]; autoPlans: AutoCropPlan[] }) {
  // Default goals - in production, these would be user-configurable
  const defaultGoals = [
    { name: 'Profit maximizer', type: 'profit' as const, priority: 1 },
    { name: targets[0]?.item || 'Craft target', type: 'craft' as const, priority: 2 },
    { name: 'Level up', type: 'level' as const, priority: 3 },
  ]

  const schedule = buildGoalSchedule(defaultGoals, inventory, targets, autoPlans)

  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">MULTI-GOAL SCHEDULER</div>
      <h2>Goals & Prioritas</h2>
      <p className="muted">{schedule.summary}</p>

      {schedule.conflicts.length > 0 && (
        <div className="goalConflicts">
          {schedule.conflicts.map((c, i) => (
            <div className="conflictBadge" key={i}>⚠️ {c}</div>
          ))}
        </div>
      )}

      <div className="goalList">
        {schedule.goals.map((g, i) => (
          <div className={`goalCard ${g.status}`} key={i}>
            <div className="goalHeader">
              <span className="goalPriority">#{g.priority}</span>
              <b>{g.name}</b>
              <span className={`goalStatus ${g.status}`}>{g.status}</span>
            </div>
            <div className="goalProgress">
              <div className="progressBar">
                <div className="progressFill" style={{ width: `${g.progress}%` }} />
              </div>
              <span>{g.progress}%</span>
            </div>
            <div className="goalMeta">
              <span>ETA: {g.eta}</span>
            </div>
            {g.blockers.length > 0 && (
              <div className="goalBlockers">
                {g.blockers.map((b, j) => (
                  <span className="blockerBadge" key={j}>{b}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="currentFocus">
        <span className="focusLabel">FOCUS SEKARANG:</span>
        <b>{schedule.currentFocus}</b>
      </div>
    </section>
  )
}
