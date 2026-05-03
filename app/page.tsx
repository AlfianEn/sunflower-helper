import { isAuthed } from './lib/auth'
import { store } from './lib/db'
import { missingFor } from './lib/crafting'
import { buildPlaybook } from './lib/coach'
import { serverNow } from './lib/farmStatus'
import { buildSimpleGuide } from './lib/simpleGuide'
import { buildSmartAlerts } from './lib/smart-notify'
import { generateWeeklyReport } from './lib/weekly-report'

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
import { ProductionOptimizer } from './components/production-optimizer'
import { MRPPanel } from './components/mrp-panel'
import { FarmTimeline } from './components/farm-timeline'
import { ProfitTrackerPanel } from './components/profit-tracker-panel'
import { EnergyPanel } from './components/energy-panel'
import { GoalsPanel } from './components/goals-panel'
import { QuestTracker } from './components/quest-tracker'
import { BuildingPlanner } from './components/building-planner'
import { SyncDashboard } from './components/sync-dashboard'
import { ActivityLogPanel } from './components/activity-log-panel'
import { SmartAlertsPanel } from './components/smart-alerts'
import { EfficiencyPanel } from './components/efficiency-panel'
import { SeasonalEventsPanel } from './components/seasonal-events'
import { FishingPanel } from './components/fishing-panel'
import { CompostPanel } from './components/compost-panel'
import { ExpansionPanel } from './components/expansion-panel'
import { WeeklyReportPanel } from './components/weekly-report-panel'
import { BotCommandsPanel } from './components/bot-commands-panel'

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

  // Profit tracker data
  const profitTrendRaw = store.profitTrend(7)
  const todayStats = store.todayStats()
  const trendByDate = new Map<string, { date: string; sfl: number; crops: number; deliveries: number }>()
  for (const r of profitTrendRaw) {
    const d = r.ts.slice(0, 10)
    if (!trendByDate.has(d)) trendByDate.set(d, { date: d, sfl: 0, crops: 0, deliveries: 0 })
    const t = trendByDate.get(d)!
    t.sfl += r.sflEarned
    t.crops += r.cropsHarvested
    t.deliveries += r.deliveriesDone
  }
  const profitTrend = Array.from(trendByDate.values()).sort((a, b) => a.date.localeCompare(b.date))

  // Smart alerts & activity
  const smartAlerts = buildSmartAlerts(snapshot, autoPlans, inventory, targets)
  const recentActivity = store.recentActivity(15)
  const totalSnapshots = store.totalSnapshots()

  // Weekly report
  const weeklyProfits = store.profitTrend(7)
  const weeklyReport = generateWeeklyReport(weeklyProfits as any, recentActivity as any)

  return (
    <main className="wrap">
      <HeroHeader farmId={farmId} goalLabel={goalLabel} syncAgeMin={syncAgeMin} />
      <CommandCenter
        title={simpleGuide.main.title}
        why={simpleGuide.main.why}
        nextCheck={playbook.nextCheck}
        metrics={{ criticalCount, activeCropCount: activeCrops.length, readyCropCount: readyCrops.length, nextCrop, inventoryTypes: positiveInventory.length, seedTypes: seedStock.length, inventoryQty, craftGaps: targetGaps.length, activeTargets: targets.length }}
      />
      <SmartAlertsPanel alerts={smartAlerts} />
      <FocusedRoute title={simpleGuide.main.title} where={simpleGuide.main.where} why={simpleGuide.main.why} done={simpleGuide.main.done} steps={simpleGuide.steps} />
      <PlaybookSection title={playbook.title} summary={playbook.summary} steps={playbook.steps} nextCheck={playbook.nextCheck} />

      {/* CORE FEATURES */}
      <div className="featuresGrid">
        <ProductionOptimizer autoPlans={autoPlans} inventory={inventory} targets={targets} settings={settings} now={now} />
        <FarmTimeline autoPlans={autoPlans} snapshot={snapshot} now={now} />
      </div>

      <div className="featuresGrid">
        <MRPPanel targets={targets} inventory={inventory} />
        <ProfitTrackerPanel data={{ today: todayStats, trend: profitTrend }} />
      </div>

      <div className="featuresGrid">
        <EnergyPanel snapshot={snapshot} goal={goalLabel} />
        <EfficiencyPanel snapshot={snapshot} autoPlans={autoPlans} inventory={inventory} />
      </div>

      <div className="featuresGrid">
        <GoalsPanel inventory={inventory} targets={targets} autoPlans={autoPlans} />
        <QuestTracker snapshot={snapshot} inventory={inventory} />
      </div>

      <div className="featuresGrid">
        <BuildingPlanner snapshot={snapshot} inventory={inventory} />
        <ExpansionPanel inventory={inventory} />
      </div>

      <div className="featuresGrid">
        <FishingPanel snapshot={snapshot} />
        <CompostPanel snapshot={snapshot} />
      </div>

      <div className="featuresGrid">
        <SeasonalEventsPanel />
        <SyncDashboard snapshot={snapshot} farmId={farmId} totalSnapshots={totalSnapshots} />
      </div>

      <div className="featuresGrid">
        <WeeklyReportPanel report={weeklyReport} />
        <ActivityLogPanel activities={recentActivity} />
      </div>

      <BotCommandsPanel />
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
