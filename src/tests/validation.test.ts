import { describe, it, expect } from 'vitest'
import { customerSchema, dealerSchema, itemSchema, priceSchema } from '@/lib/validation'

describe('customerSchema', () => {
  it('ต้องมีชื่อ', () => {
    expect(customerSchema.safeParse({ name: '' }).success).toBe(false)
    expect(customerSchema.safeParse({ name: 'คุณสมชาย' }).success).toBe(true)
  })
  it('แท็กเป็น array ของ string และ default []', () => {
    const r = customerSchema.parse({ name: 'A' })
    expect(r.style_tags).toEqual([])
  })
})

describe('priceSchema', () => {
  it('price ต้อง > 0', () => {
    expect(priceSchema.safeParse({ item_id: 'i', dealer_id: 'd', price: 0, observed_at: '2026-05-01' }).success).toBe(false)
    expect(priceSchema.safeParse({ item_id: 'i', dealer_id: 'd', price: 10, observed_at: '2026-05-01' }).success).toBe(true)
  })
})

describe('itemSchema', () => {
  it('ต้องมีชื่อและหน่วย', () => {
    expect(itemSchema.safeParse({ name: 'ไม้อัด', unit: '' }).success).toBe(false)
    expect(itemSchema.safeParse({ name: 'ไม้อัด', unit: 'แผ่น' }).success).toBe(true)
  })
})

describe('dealerSchema', () => {
  it('rating อยู่ 0-5 ถ้ามี', () => {
    expect(dealerSchema.safeParse({ name: 'ร้าน', rating: 6 }).success).toBe(false)
    expect(dealerSchema.safeParse({ name: 'ร้าน', rating: 4.5 }).success).toBe(true)
  })
})
