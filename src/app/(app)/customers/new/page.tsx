export const dynamic = 'force-dynamic'

import { CustomerForm } from '@/components/CustomerForm'
import { createCustomer } from '@/actions/customers'
import { BackButton } from '@/components/ui/BackButton'

export default function NewCustomer() {
  return (
    <div className="space-y-4">
      <BackButton href="/customers" />
      <h1 className="text-xl font-bold">เพิ่มลูกค้า</h1>
      <CustomerForm action={createCustomer} submitLabel="บันทึก" />
    </div>
  )
}
