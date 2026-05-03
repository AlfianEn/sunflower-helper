export function exportToCSV(data: Record<string, any>[], filename: string): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  
  return csv
}

export function downloadCSV(data: Record<string, any>[], filename: string) {
  const csv = exportToCSV(data, filename)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportToJSON(data: any, filename: string): string {
  return JSON.stringify(data, null, 2)
}
