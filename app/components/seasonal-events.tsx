import { getActiveEvents } from '../lib/events'

export function SeasonalEventsPanel() {
  const events = getActiveEvents()

  if (events.length === 0) return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">SEASONAL EVENTS</div>
      <h2>Events</h2>
      <div className="emptyState">
        <span className="emptyIcon">📅</span>
        <p>Tidak ada event aktif saat ini.</p>
      </div>
    </section>
  )

  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">SEASONAL EVENTS</div>
      <h2>Event Aktif</h2>
      <div className="eventGrid">
        {events.map((e, i) => (
          <div className={`eventCard ${e.status}`} key={i}>
            <span className="eventIcon">{e.icon}</span>
            <div className="eventInfo">
              <b>{e.name}</b>
              <p>{e.description}</p>
              <small>{e.status === 'active' ? `${e.daysLeft} hari lagi` : 'Segera hadir'}</small>
            </div>
            {e.rewards.length > 0 && (
              <div className="eventRewards">
                {e.rewards.map((r, j) => <span key={j}>🎁 {r.qty}x {r.item}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
