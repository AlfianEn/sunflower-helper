import { RECIPES, missingFor } from '../lib/crafting'
import { addTarget, doneTarget } from './actions'

type Target = { id: number; item: string; qty: number; notes: string | null }

export function CraftingPanel({ targets, invMap }: { targets: Target[]; invMap: Record<string, number> }) {
  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <h2>Crafting planner</h2>
      <p className="muted">Pilih target craft. Sistem bandingkan resep dengan inventory.</p>
      <form action={addTarget} className="row">
        <select name="item">{Object.keys(RECIPES).map(r => <option key={r}>{r}</option>)}</select>
        <input name="qty" type="number" min="1" defaultValue="1" />
        <input name="notes" placeholder="Target notes" />
        <button>Add Target</button>
      </form>
      {targets.length === 0 ? <p className="muted">No craft targets yet.</p> : targets.map(t => (
        <div className="card" style={{ marginTop: 12 }} key={t.id}>
          <div className="row">
            <b>{t.item} x{t.qty}</b>
            <form action={doneTarget}><input type="hidden" name="id" value={t.id} /><button>Done</button></form>
          </div>
          <div className="grid">
            {missingFor(t.item, t.qty, invMap).map(m => (
              <div className={m.missing > 0 ? 'pill warn' : 'pill ok'} key={m.name}>
                {m.name}: have {m.have} / need {m.need} {m.missing > 0 ? `· missing ${m.missing}` : '· OK'}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
