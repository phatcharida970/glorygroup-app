import { describe, it, expect } from 'vitest'
import { formatBaht, formatThaiDate, priceTrend } from '@/lib/format'

describe('formatBaht', () => {
  it('ใส่สัญลักษณ์บาทและคอมมา', () => {
    expect(formatBaht(2200)).toBe('฿2,200')
    expect(formatBaht(228.5)).toBe('฿228.50')
  })
})

describe('formatThaiDate', () => {
  it('แปลงเป็นวันที่ไทยแบบสั้น', () => {
    expect(formatThaiDate('2026-05-12')).toBe('12 พ.ค. 2569')
  })
})

describe('priceTrend', () => {
  it('ลดลง/เพิ่มขึ้น/เท่าเดิม', () => {
    expect(priceTrend(228, 250)).toBe('down') // ล่าสุด 228 < ก่อนหน้า 250
    expect(priceTrend(260, 250)).toBe('up')
    expect(priceTrend(250, 250)).toBe('same')
    expect(priceTrend(250, null)).toBe('same')
  })
})
