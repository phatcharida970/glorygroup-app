export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { SearchBar } from '@/components/ui/SearchBar'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const supabase = await createClient()
  let query = supabase.from('customers').select('*').order('updated_at', { ascending: false })
  if (q) query = query.ilike('name', `%${q}%`)
  const { data: customers } = await query

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">ลูกค้า</h1>
        <Link href="/customers/new" className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm">➕ เพิ่ม</Link>
      </div>
      <Suspense fallback={<div className="w-full rounded-xl border px-4 py-3 mb-4 opacity-50">ค้นหาชื่อลูกค้า...</div>}>
        <SearchBar placeholder="ค้นหาชื่อลูกค้า..." />
      </Suspense>
      {!customers?.length ? (
        <EmptyState text="ยังไม่มีลูกค้า" ctaHref="/customers/new" ctaLabel="เพิ่มลูกค้าคนแรก" />
      ) : (
        <ul className="space-y-2">
          {customers.map(c => (
            <li key={c.id}>
              <Link href={`/customers/${c.id}`} className="block rounded-xl border p-4 hover:bg-black/5">
                <div className="font-medium">{c.name}</div>
                <div className="text-sm opacity-70">{[...(c.style_tags ?? [])].slice(0, 3).join(' · ') || c.project_name || ''}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
