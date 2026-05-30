'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/', label: 'หน้าแรก', icon: '🏠' },
  { href: '/customers', label: 'ลูกค้า', icon: '👤' },
  { href: '/dealers', label: 'ดีลเลอร์', icon: '🏪' },
  { href: '/compare', label: 'เทียบราคา', icon: '🏷️' },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const active = (href: string) => href === '/' ? path === '/' : path.startsWith(href)
  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:w-56 md:flex-col border-r p-4 gap-1">
        <div className="font-bold text-lg px-3 py-2">DesignDeck</div>
        {items.map(it => (
          <Link key={it.href} href={it.href}
            className={`px-3 py-2 rounded-lg ${active(it.href) ? 'bg-indigo-600 text-white' : 'hover:bg-black/5'}`}>
            <span className="mr-2">{it.icon}</span>{it.label}
          </Link>
        ))}
        <Link href="/settings" className="mt-auto px-3 py-2 rounded-lg hover:bg-black/5">⚙️ ตั้งค่า</Link>
      </aside>

      {/* Main */}
      <main className="flex-1 pb-20 md:pb-6 max-w-2xl mx-auto w-full p-4">{children}</main>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t bg-white dark:bg-zinc-900 grid grid-cols-4">
        {items.map(it => (
          <Link key={it.href} href={it.href}
            className={`flex flex-col items-center py-2 text-xs ${active(it.href) ? 'text-indigo-600' : 'opacity-70'}`}>
            <span className="text-lg">{it.icon}</span>{it.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
