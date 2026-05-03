import { CROPS, profitPerHour } from '../lib/crops'

export function CropReference() {
  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <h2>Crop reference</h2>
      <p className="muted">Referensi cepat crop, waktu tumbuh, estimasi profit.</p>
      <div className="grid">
        {[...CROPS].sort((a, b) => profitPerHour(b) - profitPerHour(a)).map(c => (
          <div className="pill" key={c.name}>{c.name}: {c.minutes}m · profit {(c.sell - c.seed).toFixed(2)} SFL · {profitPerHour(c).toFixed(3)}/h</div>
        ))}
      </div>
    </section>
  )
}
