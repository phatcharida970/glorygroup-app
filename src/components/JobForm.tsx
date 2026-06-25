'use client'
import { useRef, useState, useTransition, useEffect } from 'react'
import dynamic from 'next/dynamic'

const ItemImageUploader = dynamic(
  () => import('@/components/ItemImageUploader').then(m => m.ItemImageUploader),
  { ssr: false, loading: () => <div className="pl-7 text-xs opacity-30">โหลด...</div> }
)

interface Customer { id: string; name: string }
interface Dealer   { id: string; name: string }

interface LineItem {
  localId: string
  existingId: string
  tempId: string
  name: string
  amount: string
  dealer_id: string
  notes: string
  payment_type: 'cash' | 'transfer' | ''
  bank_info: string
  payment_status: 'paid' | 'deposit' | 'pending' | ''
  deposit_amount: string
  expense_type: 'material' | 'labor' | ''
}

interface Props {
  action: (fd: FormData) => Promise<{ error: string } | void>
  submitLabel?: string
  customers: Customer[]
  dealers: Dealer[]
  defaults?: {
    name?: string
    customer_name?: string
    customer_id?: string
    sale_price?: number
    status?: string
    notes?: string
    items?: {
      existingId?: string
      name: string
      amount: number
      dealer_id: string | null
      notes: string | null
      payment_type?: string | null
      bank_info?: string | null
      payment_status?: string | null
      deposit_amount?: number | null
      expense_type?: string | null
    }[]
  }
  itemImages?: Record<string, { id: string; url: string; storagePath?: string }[]>
}

let _uid = 0
const uid = () => String(++_uid)
function blankItem(tempId = ''): LineItem {
  return { localId: uid(), existingId: '', tempId, name: '', amount: '', dealer_id: '', notes: '', payment_type: '', bank_info: '', payment_status: '', deposit_amount: '', expense_type: '' }
}

// ── Combobox ลูกค้า ──────────────────────────────────────────────
function CustomerCombobox({ customers, defaultName, defaultId }: {
  customers: Customer[]
  defaultName?: string
  defaultId?: string
}) {
  const [query, setQuery] = useState(defaultName ?? '')
  const [selectedId, setSelectedId] = useState(defaultId ?? '')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = query.trim()
    ? customers.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : customers

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <input type="hidden" name="customer_id" value={selectedId} />
      <input type="hidden" name="customer_name" value={query.trim()} />
      <div className="relative">
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setSelectedId(''); setOpen(true) }}
          onFocus={() => setOpen(true)}
          className="w-full rounded-xl border px-4 py-3 text-sm pr-10"
          placeholder="พิมพ์ชื่อลูกค้า หรือเพิ่มใหม่..."
          autoComplete="off"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(''); setSelectedId('') }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">×</button>
        )}
      </div>
      {query.trim() && (
        <div className="mt-1 text-xs opacity-60">
          {selectedId ? '✅ เชื่อมกับลูกค้าที่มีอยู่' : `✨ จะสร้างลูกค้าใหม่ "${query.trim()}" อัตโนมัติ`}
        </div>
      )}
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-xl border bg-white dark:bg-zinc-900 shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(c => (
            <li key={c.id}>
              <button type="button" onMouseDown={() => { setQuery(c.name); setSelectedId(c.id); setOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Main Form ─────────────────────────────────────────────────────
export function JobForm({ action, submitLabel = 'บันทึก', customers, dealers, defaults, itemImages = {} }: Props) {
  const [items, setItems] = useState<LineItem[]>(
    defaults?.items?.length
      ? defaults.items.map(it => ({
          localId: uid(),
          existingId: it.existingId ?? '',
          tempId: it.existingId ?? '',  // จะถูก fill โดย useEffect บน client
          name: it.name,
          amount: String(it.amount),
          dealer_id: it.dealer_id ?? '',
          notes: it.notes ?? '',
          payment_type: (it.payment_type ?? '') as 'cash' | 'transfer' | '',
          bank_info: it.bank_info ?? '',
          payment_status: (it.payment_status ?? '') as 'paid' | 'deposit' | 'pending' | '',
          deposit_amount: it.deposit_amount != null ? String(it.deposit_amount) : '',
          expense_type: (it.expense_type ?? '') as 'material' | 'labor' | '',
        }))
      : [blankItem()]
  )
  const [pending, startTransition] = useTransition()
  const [errMsg, setErrMsg] = useState('')
  const [saved, setSaved] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const totalCost = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0)
  const [salePrice, setSalePrice] = useState(String(defaults?.sale_price ?? ''))
  const profit = (parseFloat(salePrice) || 0) - totalCost

  // เติม tempId ให้ทุก item ที่ยังไม่มี (runs หลัง hydration เท่านั้น)
  useEffect(() => {
    setItems(prev => prev.map(it =>
      it.tempId ? it : { ...it, tempId: crypto.randomUUID() }
    ))
  }, [])

  const newItemRef = useRef<HTMLDivElement>(null)
  const shouldScrollRef = useRef(false)
  const addItem = () => {
    shouldScrollRef.current = true
    setItems(p => [...p, blankItem(crypto.randomUUID())])
  }
  useEffect(() => {
    if (shouldScrollRef.current) {
      shouldScrollRef.current = false
      newItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  })
  const removeItem = (localId: string) => setItems(p => p.filter(it => it.localId !== localId))
  const updateItem = (localId: string, field: keyof Omit<LineItem, 'localId'>, val: string) =>
    setItems(p => p.map(it => it.localId === localId ? { ...it, [field]: val } : it))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(formRef.current!)
    fd.set('items', JSON.stringify(
      items
        .filter(it => it.name.trim())
        .map((it, i) => ({
          existingId: it.existingId || null,
          tempId: it.tempId,
          name: it.name.trim(),
          amount: parseFloat(it.amount) || 0,
          dealer_id: it.dealer_id || null,
          notes: it.notes.trim() || null,
          payment_type: it.payment_type || null,
          bank_info: (it.payment_type === 'transfer' && it.bank_info.trim()) ? it.bank_info.trim() : null,
          payment_status: it.payment_status || null,
          deposit_amount: (it.payment_status === 'deposit' && it.deposit_amount) ? parseFloat(it.deposit_amount) : null,
          expense_type: it.expense_type || null,
          sort_order: i,
        }))
    ))
    setErrMsg('')
    startTransition(async () => {
      try {
        const result = await action(fd)
        if (result && 'error' in result) {
          setErrMsg(result.error)
        } else {
          setSaved(true)
          setTimeout(() => window.location.reload(), 1500)
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('REDIRECT')) throw err
        setErrMsg(msg || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
      }
    })
  }

  const fmt = (n: number) =>
    n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      {/* ชื่องาน */}
      <label className="block">
        <span className="text-sm font-medium">ชื่องาน *</span>
        <input name="name" required defaultValue={defaults?.name}
          className="mt-1 w-full rounded-xl border px-4 py-3 text-sm"
          placeholder="เช่น บ้านคุณมานะ — ห้องนั่งเล่น" />
      </label>

      {/* ลูกค้า */}
      <div>
        <span className="text-sm font-medium">ลูกค้า</span>
        <div className="mt-1">
          <CustomerCombobox customers={customers} defaultName={defaults?.customer_name} defaultId={defaults?.customer_id} />
        </div>
      </div>

      {/* ราคาขาย */}
      <label className="block">
        <span className="text-sm font-medium">ราคาขาย (บาท)</span>
        <input name="sale_price" type="number" min="0" step="0.01"
          value={salePrice} onChange={e => setSalePrice(e.target.value)}
          className="mt-1 w-full rounded-xl border px-4 py-3 text-sm" placeholder="0.00" />
      </label>

      {/* รายการค่าใช้จ่าย */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">รายการค่าใช้จ่าย</span>
          <button type="button" onClick={addItem} className="text-sm text-indigo-600 underline cursor-pointer">➕ เพิ่มรายการ</button>
        </div>
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={it.localId} ref={idx === items.length - 1 ? newItemRef : undefined} className="rounded-xl border p-3 space-y-2 bg-zinc-50 dark:bg-zinc-800">
              {/* ชื่อรายการ */}
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-50 w-5 text-center">{idx + 1}</span>
                <input value={it.name} onChange={e => updateItem(it.localId, 'name', e.target.value)}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm"
                  placeholder="ชื่อรายการ เช่น โซฟา, กระเบื้อง" />
                <button type="button" onClick={() => removeItem(it.localId)}
                  className="text-red-500 text-lg leading-none px-1 cursor-pointer">×</button>
              </div>
              {/* ราคา + ดีลเลอร์ */}
              <div className="flex gap-2 pl-7">
                <input value={it.amount} onChange={e => updateItem(it.localId, 'amount', e.target.value)}
                  type="number" min="0" step="0.01"
                  className="w-36 rounded-lg border px-3 py-2 text-sm" placeholder="ราคา (บาท)" />
                <select value={it.dealer_id} onChange={e => updateItem(it.localId, 'dealer_id', e.target.value)}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm bg-white dark:bg-zinc-900">
                  <option value="">ดีลเลอร์ (ไม่ระบุ)</option>
                  {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              {/* ประเภทค่าใช้จ่าย */}
              <div className="pl-7">
                <div className="flex gap-2">
                  {([['material','🧱 ค่าของ','bg-blue-600 text-white border-blue-600'],['labor','🔨 ค่าแรง','bg-rose-600 text-white border-rose-600']] as [string,string,string][]).map(([v,label,ac]) => (
                    <button key={v} type="button"
                      onClick={() => updateItem(it.localId, 'expense_type', it.expense_type === v ? '' : v)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${it.expense_type === v ? ac : 'border-zinc-200 opacity-60 hover:opacity-100'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* วิธีจ่าย — ปุ่มเลือก */}
              <div className="pl-7 space-y-2">
                <div className="flex gap-2">
                  {([['', 'วิธีจ่าย'], ['cash', '💵 เงินสด'], ['transfer', '🏦 โอน']] as [string,string][]).map(([v, label]) => (
                    <button key={v} type="button"
                      onClick={() => updateItem(it.localId, 'payment_type', v)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                        it.payment_type === v
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-zinc-200 opacity-60 hover:opacity-100'
                      }`}
                    >{label}</button>
                  ))}
                </div>
                {it.payment_type === 'transfer' && (
                  <input value={it.bank_info} onChange={e => updateItem(it.localId, 'bank_info', e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="ธนาคาร + เลขบัญชี เช่น กสิกร 123-4-56789-0" />
                )}
              </div>

              {/* สถานะการชำระ — ปุ่มเลือก */}
              <div className="pl-7 space-y-2">
                <div className="flex gap-2 flex-wrap">
                  {([
                    ['paid',    '✅ ชำระแล้ว',  'bg-green-600 text-white border-green-600'],
                    ['deposit', '💰 มัดจำ',      'bg-amber-500 text-white border-amber-500'],
                    ['pending', '⏳ รอชำระ',     'bg-zinc-500 text-white border-zinc-500'],
                  ] as [string,string,string][]).map(([v, label, activeClass]) => (
                    <button key={v} type="button"
                      onClick={() => updateItem(it.localId, 'payment_status', it.payment_status === v ? '' : v)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                        it.payment_status === v ? activeClass : 'border-zinc-200 opacity-60 hover:opacity-100'
                      }`}
                    >{label}</button>
                  ))}
                </div>
                {it.payment_status === 'deposit' && (
                  <input
                    value={it.deposit_amount}
                    onChange={e => updateItem(it.localId, 'deposit_amount', e.target.value)}
                    type="number" min="0" step="0.01"
                    className="w-full rounded-lg border border-amber-400 px-3 py-2 text-sm"
                    placeholder="ยอดมัดจำ (บาท)"
                  />
                )}
              </div>

              {/* รูปบิล — ใช้ existingId ถ้ามี ไม่งั้นใช้ tempId */}
              <ItemImageUploader
                itemId={it.existingId || it.tempId}
                images={it.existingId ? (itemImages[it.existingId] ?? []) : []}
              />
            </div>
          ))}
        </div>
      </div>

      {/* สรุป */}
      <div className="rounded-xl border p-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="opacity-70">ค่าใช้จ่ายรวม</span>
          <span className="font-medium">{fmt(totalCost)} บาท</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-70">ราคาขาย</span>
          <span className="font-medium">{fmt(parseFloat(salePrice) || 0)} บาท</span>
        </div>
        <div className="flex justify-between border-t pt-1 font-semibold">
          <span>กำไร</span>
          <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
            {profit >= 0 ? '+' : ''}{fmt(profit)} บาท
          </span>
        </div>
      </div>

      {/* สถานะ */}
      <label className="block">
        <span className="text-sm font-medium">สถานะ</span>
        <select name="status" defaultValue={defaults?.status ?? 'active'}
          className="mt-1 w-full rounded-xl border px-4 py-3 text-sm bg-white dark:bg-zinc-900">
          <option value="active">🔄 กำลังดำเนินการ</option>
          <option value="done">✅ เสร็จแล้ว</option>
        </select>
      </label>

      {/* โน้ต */}
      <label className="block">
        <span className="text-sm font-medium">โน้ต</span>
        <textarea name="notes" rows={3} defaultValue={defaults?.notes ?? ''}
          className="mt-1 w-full rounded-xl border px-4 py-3 text-sm resize-none"
          placeholder="บันทึกเพิ่มเติม..." />
      </label>

      {errMsg && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          ❌ {errMsg}
        </div>
      )}

      {saved && (
        <div className="rounded-xl bg-green-50 border border-green-300 px-4 py-3 text-sm text-green-700 text-center font-medium animate-pulse">
          ✅ บันทึกเรียบร้อยแล้ว กำลังรีเฟรช...
        </div>
      )}

      <button type="submit" disabled={pending || saved}
        className="w-full rounded-xl bg-indigo-600 text-white py-3 font-medium disabled:opacity-60 cursor-pointer">
        {pending ? 'กำลังบันทึก...' : submitLabel}
      </button>
    </form>
  )
}
