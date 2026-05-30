import { createClient } from '@/lib/supabase/server'
import { PriceForm } from '@/components/PriceForm'

export const dynamic = 'force-dynamic'

export default async function NewPrice({ searchParams }: { searchParams: Promise<{ dealer?: string }> }) {
  const { dealer } = await searchParams
  const supabase = await createClient()
  const [{ data: items }, { data: dealers }] = await Promise.all([
    supabase.from('items').select('*').order('name'),
    supabase.from('dealers').select('*').order('name'),
  ])
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">อัปเดตราคา</h1>
      <PriceForm items={items ?? []} dealers={dealers ?? []} defaultDealerId={dealer} />
    </div>
  )
}
