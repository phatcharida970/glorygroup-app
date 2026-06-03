export const dynamic = 'force-dynamic'

import { DealerForm } from '@/components/DealerForm'
import { createDealer } from '@/actions/dealers'
import { BackButton } from '@/components/ui/BackButton'

export default function NewDealer() {
  return (
    <div className="space-y-4">
      <BackButton href="/dealers" />
      <h1 className="text-xl font-bold">เพิ่มดีลเลอร์</h1>
      <DealerForm action={createDealer} submitLabel="บันทึก" />
    </div>
  )
}
