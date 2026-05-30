export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { SearchBar } from '@/components/ui/SearchBar'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function DealersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const supabase = await createClient()
  let query = supabase.from('dealers').select('*').order('updated_at', { ascending: false })
  if (q) query = query.ilike('name', `%${q}%`)
  const { data: dealers } = await query
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">ดีลเลอร์</h1>
        <Link href="/dealers/new" className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm">➕ เพิ่ม</Link>
      </div>
      <Suspense fallback={<div className="w-full rounded-xl border px-4 py-3 mb-4 opacity-50">ค้นหาชื่อร้าน...</div>}>
        <SearchBar placeholder="ค้นหาชื่อร้าน..." />
      </Suspense>
      {!dealers?.length ? (
        <EmptyState text="ยังไม่มีดีลเลอร์" ctaHref="/dealers/new" ctaLabel="เพิ่มร้านแรก" />
      ) : (
        <ul className="space-y-2">
          {dealers.map(d => (
            <li key={d.id}>
              <Link href={`/dealers/${d.id}`} className="block rounded-xl border p-4 hover:bg-black/5">
                <div className="font-medium">{d.name} {d.rating ? <span className="text-amber-500 text-sm">★ {d.rating}</span> : null}</div>
                <div className="text-sm opacity-70">{(d.categories ?? []).join(' · ')}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
