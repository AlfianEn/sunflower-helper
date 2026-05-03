// Data sync foundation: keeps a local snapshot file for future source-backed crop/craft updates.
const fs = require('fs')
const path = require('path')
const target = path.join(process.cwd(), 'data', 'sync-status.json')
fs.mkdirSync(path.dirname(target), { recursive: true })
fs.writeFileSync(target, JSON.stringify({ updatedAt: new Date().toISOString(), source: 'manual-seeded; ready for upstream GitHub/API mapping' }, null, 2))
console.log('sync-status updated')
