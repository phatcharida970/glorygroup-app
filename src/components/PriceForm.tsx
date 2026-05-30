'use client'
import { useState } from 'react'
import { addPrice } from '@/actions/prices'
import { createItem } from '@/actions/items'
import type { Item, Dealer } from '@/lib/types'

export function PriceForm({ items, dealers, defaultDealerId }: {
  items: Item[]; dealers: Dealer[]; defaultDealerId?: string
}) {
  const [items2, setItems2] = useState(items)
  const [itemId, setItemId] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState(''); const [newUnit, setNewUnit] = useState('')

  const doCreateItem = async () => {
    if (!newName.trim() || !newUnit.trim()) return
    const row = await createItem({ name: newName.trim(), unit: newUnit.trim() })
    setItems2([row, ...items2]); setItemId(row.id); setCreating(false)
  }

  return (
    <form action={addPrice} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">สินค้า *</label>
        {!creating ? (
          <div className="flex gap-2">
            <select name="item_id" required value={itemId} onChange={e => setItemId(e.target.value)} className="flex-1 rounded-lg border px-3 py-2">
              <option value="">— เลือกสินค้า —</option>
              {items2.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
            </select>
            <button type="button" onClick={() => setCreating(true)} className="rounded-lg border px-3">＋ ใหม่</button>
          </div>
        ) : (
          <div className="space-y-2 border rounded-lg p-3">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="ชื่อสินค้า เช่น ไม้อัด 4มม" className="w-full rounded-lg border px-3 py-2" />
            <input value={newUnit} onChange={e => setNewUnit(e.target.value)} placeholder="หน่วย เช่น แผ่น" className="w-full rounded-lg border px-3 py-2" />
            <div className="flex gap-2">
              <button type="button" onClick={doCreateItem} className="rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm">สร้าง</button>
              <button type="button" onClick={() => setCreating(false)} className="text-sm underline">ยกเลิก</button>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">ดีลเลอร์ *</label>
        <select name="dealer_id" required defaultValue={defaultDealerId ?? ''} className="w-full rounded-lg border px-3 py-2">
          <option value="">— เลือกร้าน —</option>
          {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">ราคา (บาท) *</label>
          <input name="price" type="number" step="0.01" min="0" required className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">วันที่ *</label>
          <input name="observed_at" type="date" required className="w-full rounded-lg border px-3 py-2" />
        </div>
      </div>
      <input name="note" placeholder="โน้ต (ถ้ามี)" className="w-full rounded-lg border px-3 py-2" />
      <button className="w-full rounded-xl bg-indigo-600 text-white py-3 font-medium">บันทึกราคา</button>
    </form>
  )
}
