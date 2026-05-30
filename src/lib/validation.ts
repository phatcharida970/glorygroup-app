import { z } from 'zod'

const tags = z.array(z.string()).default([])

export const customerSchema = z.object({
  name: z.string().min(1, 'กรุณาใส่ชื่อ'),
  phone: z.string().optional().nullable(),
  line_id: z.string().optional().nullable(),
  project_name: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  budget: z.string().optional().nullable(),
  style_tags: tags,
  color_material_tags: tags,
  dislikes: z.string().optional().nullable(),
  rooms: tags,
  notes: z.string().optional().nullable(),
})

export const dealerSchema = z.object({
  name: z.string().min(1, 'กรุณาใส่ชื่อร้าน'),
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
  categories: tags,
  phone: z.string().optional().nullable(),
  line_id: z.string().optional().nullable(),
  location_text: z.string().optional().nullable(),
  map_url: z.string().url('ลิงก์ไม่ถูกต้อง').optional().or(z.literal('')).nullable(),
  credit_terms: z.string().optional().nullable(),
  shipping_note: z.string().optional().nullable(),
  min_order: z.string().optional().nullable(),
  hours: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const itemSchema = z.object({
  name: z.string().min(1, 'กรุณาใส่ชื่อสินค้า'),
  unit: z.string().min(1, 'กรุณาใส่หน่วย'),
  category: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const priceSchema = z.object({
  item_id: z.string().min(1),
  dealer_id: z.string().min(1),
  price: z.coerce.number().positive('ราคาต้องมากกว่า 0'),
  observed_at: z.string().min(1),
  note: z.string().optional().nullable(),
})

export type CustomerInput = z.infer<typeof customerSchema>
export type DealerInput = z.infer<typeof dealerSchema>
export type ItemInput = z.infer<typeof itemSchema>
export type PriceInput = z.infer<typeof priceSchema>
