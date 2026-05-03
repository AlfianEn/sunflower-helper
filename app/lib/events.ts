export type SeasonalEvent = {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  rewards: { item: string; qty: number }[]
  status: 'active' | 'upcoming' | 'ended'
  daysLeft: number
  icon: string
}

// Known Sunflower Land events (can be extended)
const KNOWN_EVENTS: Omit<SeasonalEvent, 'status' | 'daysLeft'>[] = [
  {
    id: 'easter-2026',
    name: 'Easter Event',
    description: 'Kumpulkan Easter Eggs untuk reward eksklusif',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    rewards: [{ item: 'Easter Egg', qty: 10 }],
    icon: '🥚'
  },
  {
    id: 'summer-solstice-2026',
    name: 'Summer Solstice',
    description: 'Event musim panas dengan crop bonus',
    startDate: '2026-06-20',
    endDate: '2026-06-30',
    rewards: [{ item: 'Sunflower', qty: 50 }],
    icon: '☀️'
  },
  {
    id: 'halloween-2026',
    name: 'Halloween',
    description: 'Kumpulkan pumpkin untuk hadiah spesial',
    startDate: '2026-10-15',
    endDate: '2026-11-01',
    rewards: [{ item: 'Pumpkin', qty: 20 }],
    icon: '🎃'
  },
  {
    id: 'winter-2026',
    name: 'Winter Festival',
    description: 'Event musim dingin dengan crafting bonus',
    startDate: '2026-12-15',
    endDate: '2026-12-31',
    rewards: [{ item: 'Wood', qty: 100 }],
    icon: '❄️'
  }
]

export function getActiveEvents(): SeasonalEvent[] {
  const now = new Date()
  return KNOWN_EVENTS.map(event => {
    const start = new Date(event.startDate)
    const end = new Date(event.endDate)
    const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
    
    let status: SeasonalEvent['status']
    if (now < start) status = 'upcoming'
    else if (now > end) status = 'ended'
    else status = 'active'

    return { ...event, status, daysLeft }
  }).filter(e => e.status !== 'ended')
}
