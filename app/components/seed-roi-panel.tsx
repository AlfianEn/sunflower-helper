import { calculateSeedROI } from '../lib/seed-roi'

export function SeedROIPanel() {
  const roi = calculateSeedROI()

  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">SEED ROI CALCULATOR</div>
      <h2>Profit Analysis</h2>
      <p className="muted">{roi.summary}</p>

      <div className="roiHighlights">
        <div className="roiCard best">
          <span className="roiBadge">Best PPH</span>
          <b>{roi.bestPPH.crop}</b>
          <span>{roi.bestPPH.profitPerHour.toFixed(2)} SFL/h</span>
        </div>
        <div className="roiCard">
          <span className="roiBadge">Best ROI</span>
          <b>{roi.bestROI.crop}</b>
          <span>{roi.bestROI.roi.toFixed(0)}% return</span>
        </div>
        <div className="roiCard">
          <span className="roiBadge">Fastest</span>
          <b>{roi.fastestReturn.crop}</b>
          <span>{roi.fastestReturn.growTime}</span>
        </div>
      </div>

      <div className="roiTable">
        <div className="roiHeader">
          <span>#</span><span>Crop</span><span>Cost</span><span>Sell</span><span>Profit</span><span>PPH</span><span>ROI</span><span>Time</span>
        </div>
        {roi.seeds.slice(0, 10).map((s, i) => (
          <div className={`roiRow ${i === 0 ? 'top' : ''}`} key={i}>
            <span>{s.rank}</span>
            <b>{s.crop}</b>
            <span>{s.seedCost}</span>
            <span>{s.sellPrice}</span>
            <span className="ok">+{s.profit}</span>
            <span className="pph">{s.profitPerHour.toFixed(2)}</span>
            <span>{s.roi.toFixed(0)}%</span>
            <span>{s.growTime}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
