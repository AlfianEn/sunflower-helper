'use client'

import { useState, useEffect } from 'react'

export function SyncIndicator({ lastSync }: { lastSync: number | null }) {
  const [syncing, setSyncing] = useState(false)
  const [age, setAge] = useState<number | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastSync) setAge(Math.round((Date.now() - lastSync) / 60000))
    }, 10000)
    return () => clearInterval(interval)
  }, [lastSync])

  return (
    <div className={`syncIndicator ${syncing ? 'syncing' : ''} ${age !== null && age > 30 ? 'stale' : ''}`}>
      <span className="syncDot" />
      <span className="syncText">
        {syncing ? 'Syncing...' : age !== null ? `Synced ${age}m ago` : 'Not synced'}
      </span>
    </div>
  )
}
