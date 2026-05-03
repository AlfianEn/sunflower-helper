import { getCrop } from '../lib/crops'
import { markDone } from './actions'

type AutoPlan = { plotId: string; crop: string; harvestAt: string; updatedAt: string }
type ManualPlan = { id: number; crop: string; plotCount: number; harvestAt: string; status: string }

export function CropTimers({ autoPlans, manualPlans, now }: { autoPlans: AutoPlan[]; manualPlans: ManualPlan[]; now: number }) {
  return (
    <>
      <section className="card compact" style={{ marginTop: 14 }}>
        <h2>Auto harvest timers</h2>
        <p className="muted">Dibaca otomatis dari Sunflower Land API.</p>
        {autoPlans.length === 0 ? <p className="muted">Belum ada crop aktif terbaca dari API.</p> : (
          <div className="timerGrid">
            {autoPlans.map(p => {
              const ms = new Date(p.harvestAt).getTime() - now
              const ready = ms <= 0
              return (
                <div className={`timerCard ${ready ? 'ready' : ''}`} key={p.plotId}>
                  <b>{p.crop}</b>
                  <span className={ready ? 'ok' : ''}>{ready ? 'Ready' : `${Math.ceil(ms / 60000)}m`}</span>
                  <small>plot {p.plotId}</small>
                </div>
              )
            })}
          </div>
        )}
      </section>
      <section className="card" style={{ marginTop: 14 }}>
        <h2>Manual fallback timers</h2>
        <p className="muted">Timer manual opsional kalau diperlukan.</p>
        {manualPlans.length === 0 ? <p className="muted">No manual timers.</p> : (
          <table>
            <thead><tr><th>Crop</th><th>Plots</th><th>ETA</th><th>Profit</th><th></th></tr></thead>
            <tbody>
              {manualPlans.map(p => {
                const c = getCrop(p.crop)
                const ms = new Date(p.harvestAt).getTime() - now
                const ready = ms <= 0
                return (
                  <tr key={p.id}>
                    <td>{p.crop}</td>
                    <td>{p.plotCount}</td>
                    <td className={ready ? 'ok' : ''}>{ready ? 'Ready' : `${Math.ceil(ms / 60000)}m`}</td>
                    <td>{((c.sell - c.seed) * p.plotCount).toFixed(2)} SFL</td>
                    <td><form action={markDone}><input type="hidden" name="id" value={p.id} /><button>Done</button></form></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}
