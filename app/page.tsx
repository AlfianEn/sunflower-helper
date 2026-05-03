import { isAuthed } from './lib/auth'
import { store } from './lib/db'
import { missingFor } from './lib/crafting'
import { buildPlaybook } from './lib/coach'
import { serverNow } from './lib/farmStatus'
import { buildSimpleGuide } from './lib/simpleGuide'
import { buildSmartAlerts } from './lib/smart-notify'
import { generateWeeklyReport } from './lib/weekly-report'
import { calculateSFLRate } from './lib/sfl-tracker'
import { calculateSeedROI } from './lib/seed-roi'

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
import { SFLTrackerPanel } from './components/sfl-tracker-panel'
import { SeedROIPanel } from './components/seed-roi-panel'
import { NPCPanel } from './components/npc-panel'
import { WearablesPanel } from './components/wearables-panel'
import { ExportPanel } from './components/export-panel'
import { KeyboardHelp } from './components/keyboard-shortcuts'
import { SkeletonCard } from './components/skeleton'

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

  // Data
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

  const smartAlerts = buildSmartAlerts(snapshot, autoPlans, inventory, targets)
  const recentActivity = store.recentActivity(15)
  const totalSnapshots = store.totalSnapshots()
  const weeklyReport = generateWeeklyReport(profitTrendRaw as any, recentActivity as any)
  const sflProfits = profitTrendRaw.map(p => ({ ts: p.ts, sflEarned: p.sflEarned }))

  return (
    <main className="wrap">
      <HeroHeader farmId={farmId} goalLabel={goalLabel} syncAgeMin={syncAgeMin} />
      <CommandCenter
        title={simpleGuide.main.title}
        why={simpleGuide.main.why}
        nextCheck={playbook.nextCheck}
        metrics={{ criticalCount, activeCropCount: activeCrops.length, readyCropCount: readyCrops.length, nextCrop, inventoryTypes: positiveInventory.length, seedTypes: seedStock.length, inventoryQty, craftGaps: targetGaps.length, activeTargets: targets.length }}
      />

      {/* TAB NAVIGATION */}
      <nav className="tabNav">
        <a href="#overview" className="tabBtn active" data-tab="overview"><span className="tabIcon">🌻</span><span className="tabLabel">Overview</span></a>
        <a href="#production" className="tabBtn" data-tab="production"><span className="tabIcon">🌾</span><span className="tabLabel">Production</span></a>
        <a href="#analytics" className="tabBtn" data-tab="analytics"><span className="tabIcon">📊</span><span className="tabLabel">Analytics</span></a>
        <a href="#tools" className="tabBtn" data-tab="tools"><span className="tabIcon">🔧</span><span className="tabLabel">Tools</span></a>
        <a href="#settings" className="tabBtn" data-tab="settings"><span className="tabIcon">⚙️</span><span className="tabLabel">Settings</span></a>
      </nav>

      {/* OVERVIEW TAB */}
      <div data-tab="overview" className="tabPanel">
        <SmartAlertsPanel alerts={smartAlerts} />
        <FocusedRoute title={simpleGuide.main.title} where={simpleGuide.main.where} why={simpleGuide.main.why} done={simpleGuide.main.done} steps={simpleGuide.steps} />
        <PlaybookSection title={playbook.title} summary={playbook.summary} steps={playbook.steps} nextCheck={playbook.nextCheck} />
        <StatusBoard status={farmStatus} />
        <CropTimers autoPlans={autoPlans} manualPlans={plans} now={now} />
      </div>

      {/* PRODUCTION TAB */}
      <div data-tab="production" className="tabPanel" style={{ display: 'none' }}>
        <ProductionOptimizer autoPlans={autoPlans} inventory={inventory} targets={targets} settings={settings} now={now} />
        <FarmTimeline autoPlans={autoPlans} snapshot={snapshot} now={now} />
        <MRPPanel targets={targets} inventory={inventory} />
        <EnergyPanel snapshot={snapshot} goal={goalLabel} />
        <QuestTracker snapshot={snapshot} inventory={inventory} />
        <BuildingPlanner snapshot={snapshot} inventory={inventory} />
        <ExpansionPanel inventory={inventory} />
        <FishingPanel snapshot={snapshot} />
        <CompostPanel snapshot={snapshot} />
      </div>

      {/* ANALYTICS TAB */}
      <div data-tab="analytics" className="tabPanel" style={{ display: 'none' }}>
        <ProfitTrackerPanel data={{ today: todayStats, trend: profitTrend }} />
        <SFLTrackerPanel profits={sflProfits} />
        <EfficiencyPanel snapshot={snapshot} autoPlans={autoPlans} inventory={inventory} />
        <SeedROIPanel />
        <GoalsPanel inventory={inventory} targets={targets} autoPlans={autoPlans} />
        <WeeklyReportPanel report={weeklyReport} />
        <ActivityLogPanel activities={recentActivity} />
      </div>

      {/* TOOLS TAB */}
      <div data-tab="tools" className="tabPanel" style={{ display: 'none' }}>
        <InventoryPanel inventory={inventory} />
        <CraftingPanel targets={targets} invMap={invMap} />
        <CropReference />
        <NPCPanel snapshot={snapshot} />
        <WearablesPanel snapshot={snapshot} />
        <SeasonalEventsPanel />
        <SyncDashboard snapshot={snapshot} farmId={farmId} totalSnapshots={totalSnapshots} />
        <BotCommandsPanel />
        <ExportPanel inventory={inventory} activities={recentActivity} profits={profitTrendRaw} />
      </div>

      {/* SETTINGS TAB */}
      <div data-tab="settings" className="tabPanel" style={{ display: 'none' }}>
        <SettingsPanel settings={settings} snapshot={snapshot} />
        <KeyboardHelp />
      </div>

      <Toasts telegram={params?.telegram} />

      {/* TAB SWITCHING SCRIPT */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function(){
          var btns = document.querySelectorAll('.tabBtn');
          var panels = document.querySelectorAll('.tabPanel');
          function show(tab) {
            btns.forEach(function(b){ b.classList.toggle('active', b.dataset.tab===tab) });
            panels.forEach(function(p){ p.style.display = p.dataset.tab===tab ? '' : 'none' });
          }
          btns.forEach(function(b){
            b.addEventListener('click', function(e){
              e.preventDefault();
              var tab = b.dataset.tab;
              show(tab);
              history.replaceState(null,'','#'+tab);
            });
          });
          var hash = location.hash.slice(1);
          if(hash) show(hash);
        })()
      `}} />
    </main>
  )
}
