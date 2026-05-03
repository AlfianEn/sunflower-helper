type ActivityEntry = { id: number; ts: string; type: string; name: string; detail: string }

const TYPE_ICONS: Record<string, string> = {
  harvest: '🌾', plant: '🌱', craft: '🔨', delivery: '📦', cook: '🍳',
  resource: '🪓', daily: '🎁', mushroom: '🍄', sync: '🔄', profit: '💰'
}

export function ActivityLogPanel({ activities }: { activities: ActivityEntry[] }) {
  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">ACTIVITY LOG</div>
      <h2>Riwayat Aktivitas</h2>
      <p className="muted">{activities.length} aktivitas terakhir.</p>

      {activities.length === 0 ? (
        <div className="emptyState">
          <span className="emptyIcon">📋</span>
          <p>Belum ada aktivitas tercatat.</p>
        </div>
      ) : (
        <div className="activityList">
          {activities.map((a, i) => (
            <div className="activityEntry" key={i}>
              <span className="activityIcon">{TYPE_ICONS[a.type] || '📌'}</span>
              <div className="activityInfo">
                <b>{a.name}</b>
                <span>{a.detail}</span>
              </div>
              <span className="activityTime">{new Date(a.ts).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
