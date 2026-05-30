export type PriceInput = {
  dealerId: string
  dealerName: string
  price: number
  observedAt: string // ISO date 'YYYY-MM-DD'
}

export type ComparisonRow = PriceInput & { isCheapest: boolean }

export type Comparison = {
  rows: ComparisonRow[]
  cheapestPrice: number | null
  maxDiff: number
}

export function buildComparison(prices: PriceInput[]): Comparison {
  // 1) ราคาล่าสุดต่อร้าน: เก็บ index ไว้ทำ tie-break เมื่อ observedAt เท่ากัน
  const latestByDealer = new Map<string, { row: PriceInput; idx: number }>()
  prices.forEach((row, idx) => {
    const cur = latestByDealer.get(row.dealerId)
    if (!cur) { latestByDealer.set(row.dealerId, { row, idx }); return }
    const newer = row.observedAt > cur.row.observedAt
    const sameDateLater = row.observedAt === cur.row.observedAt && idx > cur.idx
    if (newer || sameDateLater) latestByDealer.set(row.dealerId, { row, idx })
  })

  const latest = [...latestByDealer.values()].map(v => v.row)
  if (latest.length === 0) return { rows: [], cheapestPrice: null, maxDiff: 0 }

  // 2) เรียงถูก→แพง
  latest.sort((a, b) => a.price - b.price)
  const cheapestPrice = latest[0].price
  const maxPrice = latest[latest.length - 1].price

  // 3) ติดธงถูกสุด
  const rows: ComparisonRow[] = latest.map(r => ({ ...r, isCheapest: r.price === cheapestPrice }))

  return { rows, cheapestPrice, maxDiff: Math.round((maxPrice - cheapestPrice) * 100) / 100 }
}
