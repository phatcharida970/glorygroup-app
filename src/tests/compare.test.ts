import { describe, it, expect } from 'vitest'
import { buildComparison, type PriceInput } from '@/lib/compare'

const p = (dealerId: string, dealerName: string, price: number, observedAt: string): PriceInput =>
  ({ dealerId, dealerName, price, observedAt })

describe('buildComparison', () => {
  it('คืนค่าว่างเมื่อไม่มีราคา', () => {
    const r = buildComparison([])
    expect(r.rows).toEqual([])
    expect(r.cheapestPrice).toBeNull()
    expect(r.maxDiff).toBe(0)
  })

  it('เลือกราคาล่าสุดต่อร้าน (ตามวันที่)', () => {
    const r = buildComparison([
      p('d1', 'ร้าน A', 250, '2026-04-01'),
      p('d1', 'ร้าน A', 228, '2026-05-12'), // ใหม่กว่า → ใช้ตัวนี้
    ])
    expect(r.rows).toHaveLength(1)
    expect(r.rows[0].price).toBe(228)
  })

  it('เรียงถูก→แพง และทำเครื่องหมายถูกสุด', () => {
    const r = buildComparison([
      p('d1', 'ร้าน A', 245, '2026-05-03'),
      p('d2', 'ร้าน B', 228, '2026-05-12'),
      p('d3', 'ร้าน C', 250, '2026-04-28'),
    ])
    expect(r.rows.map(x => x.dealerId)).toEqual(['d2', 'd1', 'd3'])
    expect(r.rows[0].isCheapest).toBe(true)
    expect(r.rows[1].isCheapest).toBe(false)
    expect(r.cheapestPrice).toBe(228)
    expect(r.maxDiff).toBe(22)
  })

  it('ถูกสุดเท่ากันหลายเจ้า ติดธงทุกเจ้า', () => {
    const r = buildComparison([
      p('d1', 'A', 100, '2026-05-01'),
      p('d2', 'B', 100, '2026-05-01'),
      p('d3', 'C', 120, '2026-05-01'),
    ])
    expect(r.rows.filter(x => x.isCheapest)).toHaveLength(2)
  })

  it('วันที่เท่ากัน เลือกตัวที่ใส่ทีหลัง (index มากกว่า)', () => {
    const r = buildComparison([
      p('d1', 'A', 300, '2026-05-01'),
      p('d1', 'A', 280, '2026-05-01'), // index ทีหลัง = ล่าสุด
    ])
    expect(r.rows[0].price).toBe(280)
  })
})
