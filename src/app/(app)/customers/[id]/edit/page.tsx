export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { CustomerForm } from '@/components/CustomerForm'
import { updateCustomer } from '@/actions/customers'
import { createClient } from '@/lib/supabase/server'
import { BackButton } from '@/components/ui/BackButton'

export default async function EditCustomer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('customers').select('*').eq('id', id).single()
  if (!data) notFound()
  const action = updateCustomer.bind(null, id)
  return (
    <div className="space-y-4">
      <BackButton href={`/customers/${id}`} />
      <h1 className="text-xl font-bold">แก้ไขลูกค้า</h1>
      <CustomerForm action={action} defaultValue={data} submitLabel="บันทึกการแก้ไข" />
    </div>
  )
}
