import type { FarmSnapshot } from './db'

export type SyncStatus = {
  lastSync: number | null
  syncAge: number | null // minutes
  status: 'ok' | 'stale' | 'error'
  farmId: string
  totalSnapshots: number
  recentErrors: string[]
  autoSyncEnabled: boolean
}

export function getSyncStatus(snapshot: FarmSnapshot | null, farmId: string, totalSnapshots: number): SyncStatus {
  const now = Date.now()
  const lastSync = snapshot ? new Date(snapshot.fetchedAt).getTime() : null
  const syncAge = lastSync ? Math.round((now - lastSync) / 60000) : null
  
  let status: SyncStatus['status'] = 'ok'
  if (!snapshot) status = 'error'
  else if (syncAge !== null && syncAge > 30) status = 'stale'
  
  return {
    lastSync,
    syncAge,
    status,
    farmId,
    totalSnapshots,
    recentErrors: [],
    autoSyncEnabled: true
  }
}
