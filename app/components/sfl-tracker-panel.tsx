import { calculateSFLRate } from '../lib/sfl-tracker'

type ProfitEntry = { ts: string; sflEarned: number }

export function SFLTrackerPanel({ profits }: { profits: ProfitEntry[] }) {
  const metrics = calculateSFLRate(profits)

  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">SFL/HOUR TRACKER</div>
      <h2>Earning Rate</h2>
      <p className="muted">{metrics.summary}</p>

      <div className="sflMetrics">
        <div className="sflMetric">
          <span className="sflLabel">Current</span>
          <b className="sflValue">{metrics.currentRate.toFixed(1)}</b>
          <small>SFL/h</small>
        </div>
        <div className="sflMetric">
          <span className="sflLabel">Average</span>
          <b className="sflValue">{metrics.avgRate.toFixed(1)}</b>
          <small>SFL/h</small>
        </div>
        <div className="sflMetric">
          <span className="sflLabel">Peak</span>
          <b className="sflValue peak">{metrics.peakRate.toFixed(1)}</b>
          <small>SFL/h</small>
        </div>
        <div className="sflMetric">
          <span className="sflLabel">Total</span>
          <b className="sflValue">{metrics.totalEarned.toFixed(1)}</b>
          <small>SFL earned</small>
        </div>
      </div>

      <div className="sflProjections">
        <div className="projection">
          <span>24h projection:</span>
          <b>{metrics.projection24h.toFixed(1)} SFL</b>
        </div>
        <div className="projection">
          <span>7d projection:</span>
          <b>{metrics.projection7d.toFixed(1)} SFL</b>
        </div>
      </div>
    </section>
  )
}
