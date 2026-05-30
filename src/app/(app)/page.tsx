import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  const [{ count: customers }, { count: dealers }, { count: items }] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('dealers').select('*', { count: 'exact', head: true }),
    supabase.from('items').select('*', { count: 'exact', head: true }),
  ])
  const actions = [
    { href: '/customers/new', label: '➕ เพิ่มลูกค้า' },
    { href: '/dealers/new', label: '➕ เพิ่มดีลเลอร์' },
    { href: '/prices/new', label: '💰 อัปเดตราคา' },
    { href: '/compare', label: '🏷️ เทียบราคา' },
  ]
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">สวัสดีครับ 👋</h1>
      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat n={customers ?? 0} label="ลูกค้า" />
        <Stat n={dealers ?? 0} label="ดีลเลอร์" />
        <Stat n={items ?? 0} label="สินค้า" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {actions.map(a => (
          <Link key={a.href} href={a.href}
            className="rounded-2xl border p-4 text-center font-medium hover:bg-black/5">{a.label}</Link>
        ))}
      </div>
    </div>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="text-2xl font-bold">{n}</div>
      <div className="text-xs opacity-70">{label}</div>
    </div>
  )
}
