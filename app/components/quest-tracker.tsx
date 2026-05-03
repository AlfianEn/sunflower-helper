import { parseQuests } from '../lib/quests'
import type { FarmSnapshot, InventoryItem } from '../lib/db'

export function QuestTracker({ snapshot, inventory }: { snapshot: FarmSnapshot | null; inventory: InventoryItem[] }) {
  const quests = parseQuests(snapshot, inventory)
  const completable = quests.filter(q => q.canComplete)
  const inProgress = quests.filter(q => !q.canComplete && q.status !== 'completed')

  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">NPC QUEST TRACKER</div>
      <h2>Quests & Tasks</h2>
      <p className="muted">{completable.length} bisa diselesaikan, {inProgress.length} butuh bahan.</p>

      {quests.length === 0 ? (
        <div className="emptyState">
          <span className="emptyIcon">📋</span>
          <p>Tidak ada quest aktif terbaca dari API.</p>
        </div>
      ) : (
        <div className="questList">
          {quests.map((q, i) => (
            <div className={`questCard ${q.canComplete ? 'completable' : 'blocked'}`} key={i}>
              <div className="questHeader">
                <span className="questNpc">{q.npc}</span>
                {q.canComplete && <span className="readyBadge">✓ READY</span>}
              </div>
              <p className="questDesc">{q.description}</p>
              
              {q.requirements.length > 0 && (
                <div className="questReqs">
                  {q.requirements.map((r, j) => {
                    const m = q.missing.find(mm => mm.item === r.item)
                    return (
                      <span className={m ? 'reqMissing' : 'reqOk'} key={j}>
                        {r.item}: {m ? `${m.have}/${m.needed}` : '✓'}
                      </span>
                    )
                  })}
                </div>
              )}

              {(q.reward || q.sflReward > 0) && (
                <div className="questReward">
                  {q.reward && <span>🎁 {q.reward.qty}x {q.reward.item}</span>}
                  {q.sflReward > 0 && <span>💰 {q.sflReward} SFL</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
