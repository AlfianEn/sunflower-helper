import { isAuthed } from './lib/auth'
import { store } from './lib/db'
import { missingFor } from './lib/crafting'
import { buildPlaybook } from './lib/coach'
import { serverNow } from './lib/farmStatus'
import { buildSimpleGuide } from './lib/simpleGuide'

import { LoginPage } from './components/login-page'
import { HeroHeader } from './components/hero-header'
import { CommandCenter } from './components/command-center'
import { FocusedRoute } from './components/focused-route'
import { PlaybookSection } from './components/playbook'
import { StatusBoard } from './components/status-board'
import { CropTimers } from './components/crop-timers'
import { InventoryPanel } from './components/inventory-panel'
import { CraftingPanel } from './components/crafting-panel'
import { CropReference } from './components/crop-reference'
import { SettingsPanel } from './components/settings-panel'
import { Toasts } from './components/toast'

export default async function Page({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const params = await searchParams
  const authed = await isAuthed()
  if (!authed) return <LoginPage bad={!!params?.bad} />

  const settings = store.settings()
  const plans = store.activePlans()
  const autoPlans = store.autoPlans()
  const inventory = store.inventory()
  const targets = store.targets()
  const invMap = Object.fromEntries(inventory.map(i => [i.name, i.qty]))
  const snapshot = store.latestSnapshot()
  const now = serverNow()

  const simpleGuide = buildSimpleGuide(autoPlans, inventory, targets, snapshot)
  const playbook = buildPlaybook(autoPlans, inventory, targets, settings, snapshot)
  const farmStatus = simpleGuide.status

  const readyCrops = autoPlans.filter(p => new Date(p.harvestAt).getTime() <= now)
  const activeCrops = autoPlans.filter(p => new Date(p.harvestAt).getTime() > now)
  const nextCrop = activeCrops.sort((a, b) => new Date(a.harvestAt).getTime() - new Date(b.harvestAt).getTime())[0] || null
  const positiveInventory = inventory.filter(i => Number(i.qty) > 0)
  const seedStock = positiveInventory.filter(i => i.name.endsWith(' Seed'))
  const inventoryQty = positiveInventory.reduce((sum, i) => sum + Number(i.qty), 0)
  const targetGaps = targets.flatMap(t => missingFor(t.item, t.qty, invMap).filter(m => m.missing > 0))
  const criticalCount = readyCrops.length + farmStatus.summary.cookingReady + farmStatus.summary.resourcesReady + farmStatus.summary.deliveriesDoable + farmStatus.summary.dailyReady + farmStatus.summary.mushroomsReady
  const syncAgeMin = snapshot ? Math.max(0, Math.round((now - new Date(snapshot.fetchedAt).getTime()) / 60000)) : null
  const goalLabel = settings.goal || 'balanced'
  const farmId = settings.farmId || process.env.SUNFLOWER_FARM_ID || ''

  return (
    <main className="wrap">
      <HeroHeader farmId={farmId} goalLabel={goalLabel} syncAgeMin={syncAgeMin} />
      <CommandCenter
        title={simpleGuide.main.title}
        why={simpleGuide.main.why}
        nextCheck={playbook.nextCheck}
        metrics={{ criticalCount, activeCropCount: activeCrops.length, readyCropCount: readyCrops.length, nextCrop, inventoryTypes: positiveInventory.length, seedTypes: seedStock.length, inventoryQty, craftGaps: targetGaps.length, activeTargets: targets.length }}
      />
      <FocusedRoute title={simpleGuide.main.title} where={simpleGuide.main.where} why={simpleGuide.main.why} done={simpleGuide.main.done} steps={simpleGuide.steps} />
      <PlaybookSection title={playbook.title} summary={playbook.summary} steps={playbook.steps} nextCheck={playbook.nextCheck} />
      <SettingsPanel settings={settings} snapshot={snapshot} />
      <Toasts telegram={params?.telegram} />
      <StatusBoard status={farmStatus} />
      <CropTimers autoPlans={autoPlans} manualPlans={plans} now={now} />
      <InventoryPanel inventory={inventory} />
      <CraftingPanel targets={targets} invMap={invMap} />
      <CropReference />
    </main>
  )
}
