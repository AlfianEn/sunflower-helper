import { calculateEfficiency } from '../lib/efficiency'
import type { FarmSnapshot, AutoCropPlan, InventoryItem } from '../lib/db'

export function EfficiencyPanel({ snapshot, autoPlans, inventory }: { snapshot: FarmSnapshot | null; autoPlans: AutoCropPlan[]; inventory: InventoryItem[] }) {
  const eff = calculateEfficiency(snapshot, autoPlans, inventory)
  const gradeColors: Record<string, string> = { S: '#f7c948', A: '#86efac', B: '#60a5fa', C: '#fde68a', D: '#f59e0b', F: '#ef4444' }

  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">EFFICIENCY SCORE</div>
      <h2>Farm Performance</h2>

      <div className="efficiencyHero">
        <div className="gradeCircle" style={{ borderColor: gradeColors[eff.grade] }}>
          <span className="gradeLetter" style={{ color: gradeColors[eff.grade] }}>{eff.grade}</span>
          <span className="gradeScore">{eff.score}</span>
        </div>
        <p className="efficiencySummary">{eff.summary}</p>
      </div>

      <div className="efficiencyBreakdown">
        <EffBar label="Crop Utilization" value={eff.breakdown.cropUtilization} />
        <EffBar label="Harvest Timeliness" value={eff.breakdown.harvestTimeliness} />
        <EffBar label="Resource Efficiency" value={eff.breakdown.resourceEfficiency} />
        <EffBar label="Delivery Rate" value={eff.breakdown.deliveryRate} />
        <EffBar label="Daily Consistency" value={eff.breakdown.dailyConsistency} />
      </div>

      {eff.tips.length > 0 && (
        <div className="efficiencyTips">
          <h3>💡 Tips:</h3>
          {eff.tips.map((t, i) => <p key={i}>{t}</p>)}
        </div>
      )}
    </section>
  )
}

function EffBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="effBar">
      <div className="effBarHeader">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="effBarTrack">
        <div className="effBarFill" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
