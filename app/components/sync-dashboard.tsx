import { getSyncStatus } from '../lib/sync-monitor'
import type { FarmSnapshot } from '../lib/db'

export function SyncDashboard({ snapshot, farmId, totalSnapshots }: { snapshot: FarmSnapshot | null; farmId: string; totalSnapshots: number }) {
  const status = getSyncStatus(snapshot, farmId, totalSnapshots)
  const statusColors = { ok: '#86efac', stale: '#fde68a', error: '#ef4444' }
  const statusLabels = { ok: 'SYNCED', stale: 'STALE', error: 'NO DATA' }

  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">API SYNC MONITOR</div>
      <h2>Sync Status</h2>
      <div className="syncGrid">
        <div className="syncTile" style={{ borderColor: statusColors[status.status] }}>
          <span className="syncStatus" style={{ color: statusColors[status.status] }}>{statusLabels[status.status]}</span>
          <b>{status.syncAge !== null ? `${status.syncAge}m ago` : 'Never'}</b>
          <small>Farm ID: {status.farmId || 'not set'}</small>
        </div>
        <div className="syncTile">
          <span>Snapshots</span>
          <b>{status.totalSnapshots}</b>
          <small>Total synced</small>
        </div>
        <div className="syncTile">
          <span>Auto Sync</span>
          <b style={{ color: status.autoSyncEnabled ? '#86efac' : '#ef4444' }}>{status.autoSyncEnabled ? 'ON' : 'OFF'}</b>
          <small>Cron-based</small>
        </div>
      </div>
      {status.recentErrors.length > 0 && (
        <div className="syncErrors">
          <h3>Recent Errors:</h3>
          {status.recentErrors.map((e, i) => <p key={i} className="warn">{e}</p>)}
        </div>
      )}
    </section>
  )
}
