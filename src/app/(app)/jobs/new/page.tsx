export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { JobForm } from '@/components/JobForm'
import { createJob } from '@/actions/jobs'
import { BackButton } from '@/components/ui/BackButton'

export default async function NewJobPage() {
  const supabase = await createClient()
  const [{ data: customers }, { data: dealers }] = await Promise.all([
    supabase.from('customers').select('id, name').order('name'),
    supabase.from('dealers').select('id, name').order('name'),
  ])

  return (
    <div className="space-y-4">
      <BackButton href="/jobs" />
      <h1 className="text-xl font-bold">เพิ่มงานใหม่</h1>
      <JobForm
        action={createJob}
        submitLabel="บันทึกงาน"
        customers={customers ?? []}
        dealers={dealers ?? []}
      />
    </div>
  )
}
