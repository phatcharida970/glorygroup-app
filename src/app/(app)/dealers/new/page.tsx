export const dynamic = 'force-dynamic'

import { DealerForm } from '@/components/DealerForm'
import { createDealer } from '@/actions/dealers'

export default function NewDealer() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">เพิ่มดีลเลอร์</h1>
      <DealerForm action={createDealer} submitLabel="บันทึก" />
    </div>
  )
}
