export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateJob, deleteJob } from '@/actions/jobs'
import { getAttachments } from '@/lib/attachments'
import { JobForm } from '@/components/JobForm'
import { BackButton } from '@/components/ui/BackButton'

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const supabase = await createClient()

    const [{ data: project, error: e1 }, { data: items, error: e2 }, { data: customers }, { data: dealers }] =
      await Promise.all([
        supabase.from('projects').select('*, customers(name)').eq('id', id).single(),
        supabase.from('project_items').select('*').eq('project_id', id).order('sort_order'),
        supabase.from('customers').select('id, name').order('name'),
        supabase.from('dealers').select('id, name').order('name'),
      ])

    if (e1) return <div className="p-4 text-red-600 text-sm">DB error (projects): {e1.message}</div>
    if (e2) return <div className="p-4 text-red-600 text-sm">DB error (items): {e2.message}</div>
    if (!project) notFound()

    // โหลดรูปบิลทุก item
    const itemImages: Record<string, { id: string; url: string }[]> = {}
    await Promise.all(
      (items ?? []).map(async it => {
        try {
          itemImages[it.id] = await getAttachments('project_item', it.id)
        } catch {
          itemImages[it.id] = []
        }
      })
    )

    const customer = (project.customers as unknown as { name: string } | null)

    return (
      <div className="space-y-4">
        <BackButton href="/jobs" />
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">แก้ไขงาน</h1>
          <form action={deleteJob.bind(null, id)}>
            <button className="text-sm text-red-500 underline">ลบงาน</button>
          </form>
        </div>

        <JobForm
          action={updateJob.bind(null, id)}
          submitLabel="💾 บันทึก"
          customers={customers ?? []}
          dealers={dealers ?? []}
          itemImages={itemImages}
          defaults={{
            name: project.name,
            customer_id: project.customer_id ?? '',
            customer_name: customer?.name ?? '',
            sale_price: project.sale_price ?? 0,
            status: project.status,
            notes: project.notes ?? '',
            items: (items ?? []).map(it => ({
              existingId: it.id,
              name: it.name,
              amount: it.amount,
              dealer_id: it.dealer_id ?? null,
              notes: it.notes ?? null,
              payment_type: it.payment_type ?? null,
              bank_info: it.bank_info ?? null,
              payment_status: it.payment_status ?? null,
              deposit_amount: it.deposit_amount ?? null,
              expense_type: it.expense_type ?? null,
            })),
          }}
        />
      </div>
    )
  } catch (err: unknown) {
    return (
      <div className="p-4 space-y-2">
        <div className="text-red-600 font-bold">Debug Error:</div>
        <pre className="text-xs bg-red-50 p-3 rounded overflow-auto">{String(err)}</pre>
      </div>
    )
  }
}
