import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buildComparison, type PriceInput } from '@/lib/compare'
import { formatBaht, formatThaiDate } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function CompareDetail({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params
  const supabase = await createClient()
  const { data: item } = await supabase.from('items').select('*').eq('id', itemId).single()
  if (!item) notFound()
  const { data: rows } = await supabase
    .from('prices').select('price, observed_at, dealer_id, dealers(name)')
    .eq('item_id', itemId)
    .order('observed_at', { ascending: true })

  const input: PriceInput[] = (rows ?? []).map((r: any) => ({
    dealerId: r.dealer_id, dealerName: r.dealers?.name ?? '—',
    price: Number(r.price), observedAt: r.observed_at,
  }))
  const cmp = buildComparison(input)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{item.name} <span className="text-sm opacity-60">/{item.unit}</span></h1>
        <Link href={`/prices/new`} className="text-sm text-indigo-600">＋ อัปเดตราคา</Link>
      </div>

      {!cmp.rows.length ? <p className="opacity-60">ยังไม่มีราคา</p> : (
        <>
          <ul className="space-y-2">
            {cmp.rows.map(r => (
              <li key={r.dealerId} className={`rounded-xl border p-3 flex justify-between items-center ${r.isCheapest ? 'border-green-500 bg-green-500/10' : ''}`}>
                <Link href={`/dealers/${r.dealerId}`} className="font-medium underline">
                  {r.dealerName} {r.isCheapest && <span className="text-green-600 text-xs">● ถูกสุด</span>}
                </Link>
                <div className="text-right">
                  <div className={`font-bold ${r.isCheapest ? 'text-green-600' : ''}`}>{formatBaht(r.price)}<span className="text-xs opacity-60">/{item.unit}</span></div>
                  <div className="text-xs opacity-50">{formatThaiDate(r.observedAt)}</div>
                </div>
              </li>
            ))}
          </ul>
          {cmp.maxDiff > 0 && (
            <div className="rounded-xl bg-zinc-100 dark:bg-zinc-800 p-3 text-sm">
              💡 ต่างกันสูงสุด <b>{formatBaht(cmp.maxDiff)}</b>/{item.unit} — เลือกเจ้าถูกสุดช่วยประหยัด
            </div>
          )}
          <PriceHistory rows={input} />
        </>
      )}
    </div>
  )
}

function PriceHistory({ rows }: { rows: PriceInput[] }) {
  const byDealer = new Map<string, PriceInput[]>()
  rows.forEach(r => { const a = byDealer.get(r.dealerName) ?? []; a.push(r); byDealer.set(r.dealerName, a) })
  return (
    <div>
      <div className="text-xs uppercase opacity-50 mb-2">ประวัติราคา</div>
      <div className="space-y-3">
        {[...byDealer.entries()].map(([name, list]) => (
          <div key={name}>
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs opacity-70 flex flex-wrap gap-x-3">
              {list.map((p, i) => <span key={i}>{formatThaiDate(p.observedAt)}: {formatBaht(p.price)}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
