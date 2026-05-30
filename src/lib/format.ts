export function formatBaht(n: number): string {
  const hasFraction = Math.round(n * 100) % 100 !== 0
  const body = n.toLocaleString('en-US', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })
  return `฿${body}`
}

export function formatThaiDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`
}

export function priceTrend(latest: number, previous: number | null): 'up' | 'down' | 'same' {
  if (previous === null) return 'same'
  if (latest < previous) return 'down'
  if (latest > previous) return 'up'
  return 'same'
}
