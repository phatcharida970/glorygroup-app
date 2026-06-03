export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { DealerForm } from '@/components/DealerForm'
import { updateDealer } from '@/actions/dealers'
import { createClient } from '@/lib/supabase/server'
import { BackButton } from '@/components/ui/BackButton'

export default async function EditDealer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('dealers').select('*').eq('id', id).single()
  if (!data) notFound()
  return (
    <div className="space-y-4">
      <BackButton href={`/dealers/${id}`} />
      <h1 className="text-xl font-bold">แก้ไขดีลเลอร์</h1>
      <DealerForm action={updateDealer.bind(null, id)} defaultValue={data} submitLabel="บันทึกการแก้ไข" />
    </div>
  )
}
