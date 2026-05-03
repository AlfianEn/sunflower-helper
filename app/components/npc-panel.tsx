import { parseRelationships } from '../lib/npc-relationships'
import type { FarmSnapshot } from '../lib/db'

export function NPCPanel({ snapshot }: { snapshot: FarmSnapshot | null }) {
  const rel = parseRelationships(snapshot)

  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">NPC RELATIONSHIPS</div>
      <h2>{rel.summary}</h2>

      {rel.npcs.length === 0 ? (
        <div className="emptyState">
          <span className="emptyIcon">🤝</span>
          <p>Tidak ada data NPC terbaca.</p>
        </div>
      ) : (
        <div className="npcGrid">
          {rel.npcs.map((n, i) => (
            <div className="npcCard" key={i}>
              <span className="npcIcon">{n.icon}</span>
              <div className="npcInfo">
                <b>{n.npc}</b>
                <span className="npcLevel">{n.level}</span>
              </div>
              <div className="npcBar">
                <div className="npcBarFill" style={{ width: `${(n.friendship / n.maxFriendship) * 100}%` }} />
              </div>
              <span className="npcPoints">{n.friendship}/{n.maxFriendship}</span>
              <small>Gifts today: {n.giftsToday}/{n.maxGifts}</small>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
