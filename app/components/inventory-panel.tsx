import { saveInventory } from './actions'

type Item = { name: string; qty: number }

export function InventoryPanel({ inventory }: { inventory: Item[] }) {
  const positive = inventory.filter(i => Number(i.qty) > 0)
  const seeds = positive.filter(i => i.name.endsWith(' Seed'))
  const extraSeeds = seeds.length > 12 ? seeds.length - 12 : 0

  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <h2>Inventory & seed stock</h2>
      <p className="muted">Auto-sync dari API farm. Manual override hanya fallback.</p>
      <form action={saveInventory} className="row">
        <input name="name" placeholder="Manual override item" />
        <input name="qty" type="number" step="0.01" placeholder="Qty" />
        <button>Override</button>
      </form>
      {seeds.length > 0 && (
        <div className="seedStrip">
          {seeds.slice(0, 12).map(i => (
            <div key={i.name}><b>{i.name.replace(' Seed', '')}</b><span>{i.qty} seeds</span></div>
          ))}
          {extraSeeds > 0 && <div className="seedMore"><b>+{extraSeeds}</b><span>more seeds</span></div>}
        </div>
      )}
      <div className="grid" style={{ marginTop: 12 }}>
        {positive.length === 0 ? <p className="muted">No inventory yet.</p> : positive.slice(0, 80).map(i => (
          <div className="pill" key={i.name}>{i.name}: {i.qty}</div>
        ))}
      </div>
    </section>
  )
}
