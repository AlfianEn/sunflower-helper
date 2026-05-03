import { optimizeProduction } from '../lib/optimizer'
import type { AutoCropPlan, InventoryItem, CraftTarget } from '../lib/db'
import { formatEta } from '../lib/farmStatus'

export function ProductionOptimizer({ autoPlans, inventory, targets, settings, now }: {
  autoPlans: AutoCropPlan[]; inventory: InventoryItem[]; targets: CraftTarget[]; settings: Record<string, string>; now: number
}) {
  const result = optimizeProduction(autoPlans, inventory, targets, settings, 24)
  
  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">PRODUCTION OPTIMIZER</div>
      <h2>Optimal crop plan (24h)</h2>
      <p className="muted">{result.summary}</p>
      {result.steps.length > 0 ? (
        <div className="optimizerGrid">
          {result.steps.slice(0, 8).map((s, i) => (
            <div className="optimizerStep" key={i}>
              <div className="stepHeader">
                <span className="stepNum">{i + 1}</span>
                <b>{s.crop} x{s.plotCount}</b>
              </div>
              <div className="stepBody">
                <span>🌱 Tanam: {new Date(s.plantedAt).toLocaleTimeString()}</span>
                <span>🌾 Panen: {formatEta(s.harvestAt)}</span>
                <span>💰 +{s.expectedProfit.toFixed(1)} SFL</span>
              </div>
              <small>{s.reason}</small>
            </div>
          ))}
        </div>
      ) : (
        <div className="emptyState">
          <span className="emptyIcon">🌱</span>
          <p>Tidak ada seed tersedia atau plot kosong. Beli seed dulu.</p>
        </div>
      )}
      {result.steps.length > 0 && (
        <div className="optimizerSummary">
          <span>Total: {result.totalHarvests} harvests</span>
          <span>Profit: ~{result.totalProfit.toFixed(1)} SFL</span>
          <span>Goal: {result.goal}</span>
        </div>
      )}
    </section>
  )
}
