import { formatEta } from '../lib/farmStatus'

type MetricData = {
  criticalCount: number
  activeCropCount: number
  readyCropCount: number
  nextCrop: { crop: string; harvestAt: string } | null
  inventoryTypes: number
  seedTypes: number
  inventoryQty: number
  craftGaps: number
  activeTargets: number
}

export function CommandCenter({ title, why, nextCheck, metrics }: {
  title: string; why: string; nextCheck: string; metrics: MetricData
}) {
  const allClear = metrics.criticalCount === 0
  return (
    <section className="opsGrid" style={{ marginBottom: 14 }}>
      <div className="card commandCard">
        <div className="eyebrow">COMMAND CENTER</div>
        <h1>{title}</h1>
        <p>{why}</p>
        <div className="nextCheck">Next check: {nextCheck}</div>
      </div>
      <div className={`card metricCard ${allClear ? 'allClear' : 'urgent'}`}>
        <span>{allClear ? 'Semua beres' : 'Perlu aksi'}</span>
        <b>{allClear ? '✓' : metrics.criticalCount}</b>
        <small>{allClear ? 'Tidak ada yang urgent' : 'ready crop/cook/resource/delivery'}</small>
      </div>
      <div className="card metricCard">
        <span>Crop aktif</span>
        <b>{metrics.activeCropCount}</b>
        <small>{metrics.readyCropCount} ready{metrics.nextCrop ? ` · ${metrics.nextCrop.crop} ${formatEta(new Date(metrics.nextCrop.harvestAt).getTime())}` : ''}</small>
      </div>
      <div className="card metricCard">
        <span>Inventory</span>
        <b>{metrics.inventoryTypes}</b>
        <small>{metrics.seedTypes} seed types · qty {metrics.inventoryQty.toFixed(0)}</small>
      </div>
      <div className="card metricCard">
        <span>Craft gaps</span>
        <b>{metrics.craftGaps}</b>
        <small>{metrics.activeTargets} active targets</small>
      </div>
    </section>
  )
}
