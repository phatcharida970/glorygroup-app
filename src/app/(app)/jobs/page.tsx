export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/EmptyState'

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export default async function JobsPage() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, sale_price, status, customer_id, customers(name)')
    .order('updated_at', { ascending: false })

  // ดึงยอดรวมค่าใช้จ่ายแต่ละงาน
  const { data: costs } = await supabase
    .from('project_items')
    .select('project_id, amount')

  const costMap: Record<string, number> = {}
  for (const c of costs ?? []) {
    costMap[c.project_id] = (costMap[c.project_id] ?? 0) + (c.amount ?? 0)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">งาน</h1>
        <Link href="/jobs/new" className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm">
          ➕ เพิ่มงาน
        </Link>
      </div>

      {!projects?.length ? (
        <EmptyState text="ยังไม่มีงาน" ctaHref="/jobs/new" ctaLabel="เพิ่มงานแรก" />
      ) : (
        <ul className="space-y-2">
          {projects.map(p => {
            const totalCost = costMap[p.id] ?? 0
            const profit = (p.sale_price ?? 0) - totalCost
            const customer = (p.customers as unknown as { name: string } | null)?.name
            return (
              <li key={p.id}>
                <Link href={`/jobs/${p.id}`} className="block rounded-xl border p-4 hover:bg-black/5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      {customer && <div className="text-xs opacity-60 mt-0.5">👤 {customer}</div>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      p.status === 'done'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {p.status === 'done' ? '✅ เสร็จ' : '🔄 ดำเนินการ'}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs opacity-70">
                    <span>ขาย {fmt(p.sale_price ?? 0)} ฿</span>
                    <span>ต้นทุน {fmt(totalCost)} ฿</span>
                    <span className={profit >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      กำไร {profit >= 0 ? '+' : ''}{fmt(profit)} ฿
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
