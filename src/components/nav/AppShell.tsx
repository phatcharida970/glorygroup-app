'use client'
import Link, { useLinkStatus } from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/', label: 'หน้าแรก', icon: '🏠' },
  { href: '/customers', label: 'ลูกค้า', icon: '👤' },
  { href: '/jobs', label: 'งาน', icon: '📋' },
  { href: '/summary', label: 'บัญชี', icon: '📊' },
  { href: '/dealers', label: 'ดีลเลอร์', icon: '🏪' },
  { href: '/compare', label: 'เทียบราคา', icon: '🏷️' },
]

// แสดงสัญลักษณ์ "กำลังไป" ทันทีที่แตะ (ก่อนหน้าใหม่จะโหลดเสร็จ)
function PendingDot() {
  const { pending } = useLinkStatus()
  if (!pending) return null
  return (
    <span className="absolute right-1 top-1 h-2 w-2 animate-ping rounded-full bg-indigo-500" />
  )
}

function NavIcon({ icon }: { icon: string }) {
  const { pending } = useLinkStatus()
  return (
    <span className={`text-lg leading-none ${pending ? 'animate-pulse' : ''}`}>{icon}</span>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const active = (href: string) => (href === '/' ? path === '/' : path.startsWith(href))
  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:w-56 md:flex-col border-r p-4 gap-1">
        <div className="font-bold text-lg px-3 py-2">DesignDeck</div>
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            prefetch
            className={`relative px-3 py-2 rounded-lg transition-colors active:scale-[0.98] ${
              active(it.href) ? 'bg-indigo-600 text-white' : 'hover:bg-black/5'
            }`}
          >
            <span className="mr-2">{it.icon}</span>
            {it.label}
            <PendingDot />
          </Link>
        ))}
        <Link
          href="/settings"
          prefetch
          className={`relative mt-auto px-3 py-2 rounded-lg transition-colors active:scale-[0.98] ${
            active('/settings') ? 'bg-indigo-600 text-white' : 'hover:bg-black/5'
          }`}
        >
          <span className="mr-2">⚙️</span>ตั้งค่า
          <PendingDot />
        </Link>
      </aside>

      {/* Main */}
      <main className="flex-1 pb-20 md:pb-6 max-w-2xl mx-auto w-full p-4">{children}</main>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t bg-white dark:bg-zinc-900 grid grid-cols-6 [padding-bottom:env(safe-area-inset-bottom)]">
        {items.map((it) => {
          const isActive = active(it.href)
          return (
            <Link
              key={it.href}
              href={it.href}
              prefetch
              className={`relative flex flex-col items-center gap-0.5 py-2 text-xs transition-colors touch-manipulation active:bg-black/5 dark:active:bg-white/10 ${
                isActive ? 'text-indigo-600 font-medium' : 'opacity-70'
              }`}
            >
              <NavIcon icon={it.icon} />
              {it.label}
              <PendingDot />
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
