export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'

const fmt = (n: number) =>
  n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function StatCard({ label, value, sub, color = '' }: {
  label: string; value: string; sub?: string; color?: string
}) {
  return (
    <div className="rounded-xl border p-4 space-y-1">
      <div className="text-xs opacity-50 uppercase">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs opacity-60">{sub}</div>}
    </div>
  )
}

export default async function SummaryPage() {
  const supabase = await createClient()

  const [{ data: projects }, { data: items }] = await Promise.all([
    supabase.from('projects').select('id, name, sale_price, status, customer_id, customers(name)').order('created_at', { ascending: false }),
    supabase.from('project_items').select('project_id, amount, payment_status, expense_type'),
  ])

  // คำนวณต้นทุนแต่ละงาน
  const costMap: Record<string, number> = {}
  const paidMap: Record<string, number> = {}
  const depositMap: Record<string, number> = {}
  const pendingMap: Record<string, number> = {}
  let totalMaterial = 0, totalLabor = 0

  for (const it of items ?? []) {
    const amt = Number(it.amount) || 0
    costMap[it.project_id] = (costMap[it.project_id] ?? 0) + amt

    if (it.payment_status === 'paid') {
      paidMap[it.project_id] = (paidMap[it.project_id] ?? 0) + amt
    } else if (it.payment_status === 'deposit') {
      depositMap[it.project_id] = (depositMap[it.project_id] ?? 0) + amt
    } else {
      pendingMap[it.project_id] = (pendingMap[it.project_id] ?? 0) + amt
    }

    if (it.expense_type === 'material') totalMaterial += amt
    else if (it.expense_type === 'labor') totalLabor += amt
  }

  // สรุปรวม
  let totalRevenue = 0, totalCost = 0
  let totalPaid = 0, totalDeposit = 0, totalPending = 0
  let countAll = 0, countDone = 0, countActive = 0

  for (const p of projects ?? []) {
    const sale = Number(p.sale_price) || 0
    const cost = costMap[p.id] ?? 0
    totalRevenue += sale
    totalCost += cost
    totalPaid += paidMap[p.id] ?? 0
    totalDeposit += depositMap[p.id] ?? 0
    totalPending += pendingMap[p.id] ?? 0
    countAll++
    if (p.status === 'done') countDone++
    else countActive++
  }

  const totalProfit = totalRevenue - totalCost
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">📊 สรุปบัญชี</h1>

      {/* ภาพรวมการเงิน */}
      <section>
        <h2 className="text-sm font-semibold opacity-60 uppercase mb-3">ภาพรวมการเงิน</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="รายได้รวม" value={`฿${fmt(totalRevenue)}`} />
          <StatCard label="ค่าใช้จ่ายรวม" value={`฿${fmt(totalCost)}`} />
          <StatCard
            label="กำไรสุทธิ"
            value={`${totalProfit >= 0 ? '+' : ''}฿${fmt(totalProfit)}`}
            color={totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}
          />
          <StatCard
            label="อัตรากำไร"
            value={`${margin.toFixed(1)}%`}
            color={margin >= 20 ? 'text-green-600' : margin >= 0 ? 'text-amber-600' : 'text-red-600'}
          />
        </div>
      </section>

      {/* สถานะงาน */}
      <section>
        <h2 className="text-sm font-semibold opacity-60 uppercase mb-3">สถานะงาน</h2>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="งานทั้งหมด" value={String(countAll)} />
          <StatCard label="กำลังดำเนินการ" value={String(countActive)} color="text-amber-600" />
          <StatCard label="เสร็จแล้ว" value={String(countDone)} color="text-green-600" />
        </div>
      </section>

      {/* แยกประเภทค่าใช้จ่าย */}
      <section>
        <h2 className="text-sm font-semibold opacity-60 uppercase mb-3">แยกประเภทค่าใช้จ่าย</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="🧱 ค่าของ" value={`฿${fmt(totalMaterial)}`} color="text-blue-600" />
          <StatCard label="🔨 ค่าแรง" value={`฿${fmt(totalLabor)}`} color="text-rose-600" />
        </div>
      </section>

      {/* สรุปการชำระเงิน */}
      <section>
        <h2 className="text-sm font-semibold opacity-60 uppercase mb-3">สรุปการชำระเงิน (ค่าใช้จ่าย)</h2>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="✅ ชำระแล้ว" value={`฿${fmt(totalPaid)}`} color="text-green-600" />
          <StatCard label="💰 มัดจำแล้ว" value={`฿${fmt(totalDeposit)}`} color="text-amber-600" />
          <StatCard label="⏳ รอชำระ" value={`฿${fmt(totalPending)}`} color="text-zinc-500" />
        </div>
      </section>

      {/* รายละเอียดแต่ละงาน */}
      <section>
        <h2 className="text-sm font-semibold opacity-60 uppercase mb-3">รายละเอียดแต่ละงาน</h2>
        {!projects?.length ? (
          <p className="text-sm opacity-50">ยังไม่มีงาน</p>
        ) : (
          <div className="space-y-2">
            {projects.map(p => {
              const sale = Number(p.sale_price) || 0
              const cost = costMap[p.id] ?? 0
              const profit = sale - cost
              const customer = (p.customers as unknown as { name: string } | null)?.name
              return (
                <div key={p.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-medium text-sm">{p.name}</div>
                      {customer && <div className="text-xs opacity-60">👤 {customer}</div>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      p.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {p.status === 'done' ? '✅ เสร็จ' : '🔄 ดำเนินการ'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="opacity-50">รายได้</div>
                      <div className="font-medium">฿{fmt(sale)}</div>
                    </div>
                    <div className="text-center">
                      <div className="opacity-50">ค่าใช้จ่าย</div>
                      <div className="font-medium">฿{fmt(cost)}</div>
                    </div>
                    <div className="text-center">
                      <div className="opacity-50">กำไร</div>
                      <div className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profit >= 0 ? '+' : ''}฿{fmt(profit)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
