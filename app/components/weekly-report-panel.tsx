type WeeklyData = {
  weekStart: string
  weekEnd: string
  totalSfl: number
  totalCrops: number
  totalDeliveries: number
  totalCrafts: number
  highlights: string[]
  recommendations: string[]
  summary: string
}

export function WeeklyReportPanel({ report }: { report: WeeklyData }) {
  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">WEEKLY REPORT</div>
      <h2>Ringkasan Mingguan</h2>
      <p className="muted">{report.weekStart} → {report.weekEnd}</p>

      <div className="weeklyStats">
        <div className="weeklyStat">
          <b>{report.totalSfl.toFixed(1)}</b>
          <span>SFL</span>
        </div>
        <div className="weeklyStat">
          <b>{report.totalCrops}</b>
          <span>Crops</span>
        </div>
        <div className="weeklyStat">
          <b>{report.totalDeliveries}</b>
          <span>Deliveries</span>
        </div>
        <div className="weeklyStat">
          <b>{report.totalCrafts}</b>
          <span>Crafted</span>
        </div>
      </div>

      {report.highlights.length > 0 && (
        <div className="weeklyHighlights">
          <h3>✨ Highlights</h3>
          {report.highlights.map((h, i) => <p key={i}>{h}</p>)}
        </div>
      )}

      {report.recommendations.length > 0 && (
        <div className="weeklyRecommendations">
          <h3>💡 Rekomendasi</h3>
          {report.recommendations.map((r, i) => <p key={i}>{r}</p>)}
        </div>
      )}
    </section>
  )
}
