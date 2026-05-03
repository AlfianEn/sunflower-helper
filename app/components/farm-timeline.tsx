import { buildTimeline, groupByHour } from '../lib/timeline'
import type { AutoCropPlan, FarmSnapshot } from '../lib/db'

const TYPE_ICONS: Record<string, string> = {
  harvest: '🌾',
  cooking: '🍳',
  resource: '🪓',
  delivery: '📦',
  daily: '🎁',
  mushroom: '🍄',
  manual: '📝',
}

export function FarmTimeline({ autoPlans, snapshot, now }: { autoPlans: AutoCropPlan[]; snapshot: FarmSnapshot | null; now: number }) {
  const events = buildTimeline(autoPlans, snapshot, now)
  const groups = groupByHour(events)

  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">FARM TIMELINE</div>
      <h2>Jadwal hari ini</h2>
      <p className="muted">Timeline semua event yang perlu diperhatikan.</p>

      {groups.length === 0 ? (
        <div className="emptyState">
          <span className="emptyIcon">📅</span>
          <p>Tidak ada event terjadwal.</p>
        </div>
      ) : (
        <div className="timelineContainer">
          {groups.map((g, i) => (
            <div className="timelineGroup" key={i}>
              <div className="timelineHour">
                <span className={`hourBadge ${g.hour === 'NOW' ? 'now' : ''}`}>{g.hour}</span>
                <span className="hourCount">{g.events.length} events</span>
              </div>
              <div className="timelineEvents">
                {g.events.map((e, j) => (
                  <div className={`timelineEvent ${e.status}`} key={j}>
                    <span className="eventIcon">{TYPE_ICONS[e.type] || '📌'}</span>
                    <div className="eventInfo">
                      <b>{e.name}</b>
                      <span>{e.detail}</span>
                    </div>
                    {e.status === 'ready' && <span className="readyBadge">READY</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
