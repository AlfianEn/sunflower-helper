import { CROPS } from '../lib/crops'
import { setGoal, testTelegram, addCrop } from './actions'

export function SettingsPanel({ settings, snapshot }: { settings: Record<string, string>; snapshot: { fetchedAt: string } | null }) {
  return (
    <div className="grid">
      <section className="card compact">
        <h2>Settings</h2>
        <p className="muted">Auto-sync aktif. Guide berubah sesuai goal.</p>
        <div className="row">
          <span className="pill ok">Auto sync: ON</span>
          <span className="pill ok">Telegram: ON</span>
          <span className="pill">Farm ID: {settings.farmId || 'not set'}</span>
          <span className="pill">Last sync: {snapshot ? new Date(snapshot.fetchedAt).toLocaleTimeString() : 'none'}</span>
        </div>
        <form action={setGoal} className="row" style={{ marginTop: 12 }}>
          <select name="goal" defaultValue={settings.goal || 'balanced'}>
            <option value="balanced">Balanced</option>
            <option value="profit">Profit</option>
            <option value="craft">Craft target</option>
            <option value="level">Level/XP</option>
          </select>
          <button>Set Goal</button>
        </form>
        <form action={testTelegram} style={{ marginTop: 12 }}><button type="submit">Test Telegram</button></form>
      </section>
      <section className="card compact">
        <h2>Manual fallback</h2>
        <p className="muted">Opsional. Pakai kalau API game telat/salah baca.</p>
        <form action={addCrop} className="grid">
          <select name="crop">{CROPS.map(c => <option key={c.name}>{c.name}</option>)}</select>
          <input name="plotCount" type="number" min="1" defaultValue="1" />
          <input name="plantedAt" type="datetime-local" title="Planted time, optional" />
          <input name="notes" placeholder="Notes" />
          <button>Add Manual Timer</button>
        </form>
      </section>
    </div>
  )
}
