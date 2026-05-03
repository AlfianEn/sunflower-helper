import type { SmartAlert } from '../lib/smart-notify'

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'alertUrgent',
  high: 'alertHigh',
  medium: 'alertMedium',
  low: 'alertLow'
}

export function SmartAlertsPanel({ alerts }: { alerts: SmartAlert[] }) {
  if (alerts.length === 0) return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">SMART ALERTS</div>
      <h2>Notifikasi Cerdas</h2>
      <div className="emptyState">
        <span className="emptyIcon">✅</span>
        <p>Semua beres! Tidak ada alert.</p>
      </div>
    </section>
  )

  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">SMART ALERTS</div>
      <h2>{alerts.length} Alert Aktif</h2>
      <div className="alertList">
        {alerts.map((a, i) => (
          <div className={`alertCard ${PRIORITY_STYLES[a.priority]}`} key={i}>
            <div className="alertHeader">
              <span className="alertIcon">{a.icon}</span>
              <b>{a.title}</b>
              <span className="alertPriority">{a.priority}</span>
            </div>
            <p className="alertMessage">{a.message}</p>
            <small className="alertAction">→ {a.action}</small>
          </div>
        ))}
      </div>
    </section>
  )
}
