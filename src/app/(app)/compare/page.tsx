import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { SearchBar } from '@/components/ui/SearchBar'
import { EmptyState } from '@/components/ui/EmptyState'

export const dynamic = 'force-dynamic'

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const supabase = await createClient()
  let query = supabase.from('items').select('*').order('name')
  if (q) query = query.ilike('name', `%${q}%`)
  const { data: items } = await query
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">เทียบราคา</h1>
        <Link href="/prices/new" className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm">💰 อัปเดตราคา</Link>
      </div>
      <Suspense fallback={null}>
        <SearchBar placeholder="ค้นหาสินค้า..." />
      </Suspense>
      {!items?.length ? <EmptyState text="ยังไม่มีสินค้า" ctaHref="/prices/new" ctaLabel="เพิ่มราคาสินค้าแรก" /> : (
        <ul className="space-y-2">{items.map(i => (
          <li key={i.id}><Link href={`/compare/${i.id}`} className="block rounded-xl border p-4 hover:bg-black/5">
            <span className="font-medium">{i.name}</span> <span className="text-sm opacity-60">/{i.unit}</span>
          </Link></li>
        ))}</ul>
      )}
    </div>
  )
}
