import { logoutAction } from './actions'

export function HeroHeader({ farmId, goalLabel, syncAgeMin }: { farmId: string; goalLabel: string; syncAgeMin: number | null }) {
  return (
    <div className="hero premiumHero">
      <div>
        <div className="eyebrow">PRIVATE SUNFLOWER LAND OPS</div>
        <div className="big">🌻 Sunflower Helper</div>
        <div className="muted">Assistant harian buat prioritas panen, delivery, cooking, resource, inventory, dan target craft.</div>
        <div className="heroMeta">
          <span>Farm ID: {farmId || 'not set'}</span>
          <span>Goal: {goalLabel}</span>
          <span>Sync: {syncAgeMin === null ? 'none' : `${syncAgeMin}m ago`}</span>
        </div>
      </div>
      <form action={logoutAction}><button className="danger">Logout</button></form>
    </div>
  )
}
