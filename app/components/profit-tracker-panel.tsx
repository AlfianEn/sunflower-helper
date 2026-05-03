type ProfitData = {
  today: { sflEarned: number; cropsHarvested: number; deliveriesDone: number; itemsCrafted: number }
  trend: { date: string; sfl: number; crops: number; deliveries: number }[]
}

export function ProfitTrackerPanel({ data }: { data: ProfitData }) {
  const maxSfl = Math.max(...data.trend.map(t => t.sfl), 1)

  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">PROFIT TRACKER</div>
      <h2>Analytics</h2>

      <div className="profitStats">
        <div className="profitStat">
          <span className="profitLabel">Hari ini</span>
          <b className="profitValue">{data.today.sflEarned.toFixed(1)} SFL</b>
        </div>
        <div className="profitStat">
          <span className="profitLabel">Crops</span>
          <b className="profitValue">{data.today.cropsHarvested}</b>
        </div>
        <div className="profitStat">
          <span className="profitLabel">Deliveries</span>
          <b className="profitValue">{data.today.deliveriesDone}</b>
        </div>
        <div className="profitStat">
          <span className="profitLabel">Crafted</span>
          <b className="profitValue">{data.today.itemsCrafted}</b>
        </div>
      </div>

      {data.trend.length > 0 && (
        <div className="profitChart">
          <h3>Trend (7 hari)</h3>
          <div className="chartBars">
            {data.trend.map((t, i) => (
              <div className="chartBar" key={i}>
                <div className="barFill" style={{ height: `${(t.sfl / maxSfl) * 100}%` }} />
                <span className="barLabel">{t.date.slice(5)}</span>
                <span className="barValue">{t.sfl.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.trend.length === 0 && (
        <div className="emptyState">
          <span className="emptyIcon">📊</span>
          <p>Belum ada data trend. Profit akan tercatat otomatis setelah beberapa hari.</p>
        </div>
      )}
    </section>
  )
}
