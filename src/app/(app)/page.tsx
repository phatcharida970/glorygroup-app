export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'

// ดาวแบบ deterministic
function makeStars(n: number) {
  let s = 7
  const r = () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff }
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: r() * 100,
    y: r() * 100,
    size: r() * 2 + 0.5,
    dur: 2 + r() * 4,
    delay: r() * 4,
    drift: (r() - 0.5) * 30,
  }))
}
const STARS = makeStars(150)

const topics = [
  { href: '/customers', icon: '👤' },
  { href: '/jobs',      icon: '📋' },
  { href: '/dealers',   icon: '🏪' },
  { href: '/summary',   icon: '📊' },
  { href: '/compare',   icon: '🏷️' },
  { href: '/settings',  icon: '⚙️' },
]

export default function HomePage() {
  return (
    <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden rounded-2xl"
      style={{ background: 'radial-gradient(ellipse at center, #0d0d2b 0%, #000008 100%)' }}>

      {/* ดาวหมุน */}
      <style>{`
        @keyframes twinkle {
          0%,100% { opacity: 0.2; transform: scale(1) translate(0,0); }
          50% { opacity: 1; transform: scale(1.4) translate(var(--dx), var(--dy)); }
        }
      `}</style>

      {STARS.map(s => (
        <span key={s.id} className="absolute rounded-full bg-white pointer-events-none"
          style={{
            left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size,
            '--dx': `${s.drift * 0.3}px`,
            '--dy': `${s.drift * 0.2}px`,
            animation: `twinkle ${s.dur}s ${s.delay}s infinite ease-in-out`,
          } as React.CSSProperties}
        />
      ))}

      {/* grid 3x3 — กลาง = รูป */}
      <div className="relative z-10 grid grid-cols-3 gap-5 items-center justify-items-center p-4">

        {/* row 1 */}
        <IconBtn {...topics[0]} delay={0} />
        <IconBtn {...topics[1]} delay={0.3} />
        <IconBtn {...topics[2]} delay={0.6} />

        {/* row 2 — รูปตรงกลาง */}
        <IconBtn {...topics[3]} delay={0.9} />

        <div className="flex flex-col items-center gap-2">
          <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-indigo-400 shadow-[0_0_24px_4px_rgba(99,102,241,0.5)]">
            <Image src="/2.jpg" alt="me" fill className="object-cover object-top" />
          </div>
          <p className="text-white/70 text-[10px] text-center leading-tight px-1">
            อยากจิ้มที่ผมหรือที่ไอคอน<br/>ก็แล้วแต่เลยคั้บ
          </p>
        </div>

        <IconBtn {...topics[4]} delay={1.2} />

        {/* row 3 */}
        <div />
        <IconBtn {...topics[5]} delay={1.5} />
        <div />

        {/* ข้อความล่างสุด */}
        <div className="col-span-3 text-center pt-2">
          <style>{`
            @keyframes wave {
              0%,100% { transform: translateY(0px); }
              50% { transform: translateY(-8px); }
            }
            @keyframes colorShift {
              0% { color: #f472b6; }
              25% { color: #facc15; }
              50% { color: #34d399; }
              75% { color: #60a5fa; }
              100% { color: #f472b6; }
            }
          `}</style>
          <div className="flex justify-center gap-0.5">
            {'MANOWJHAAA'.split('').map((ch, i) => (
              <span key={i} className="text-2xl font-black"
                style={{
                  animation: `wave 1s ${i * 0.1}s infinite ease-in-out, colorShift 3s ${i * 0.2}s infinite linear`,
                  display: 'inline-block',
                  textShadow: '0 0 10px currentColor',
                }}>
                {ch}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function IconBtn({ href, icon, delay = 0 }: { href: string; icon: string; delay?: number }) {
  return (
    <Link href={href} className="relative flex items-center justify-center active:scale-90 transition-all duration-150">
      <style>{`
        @keyframes glowPulse {
          0%,100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.5); opacity: 0.9; }
        }
      `}</style>
      {/* แสง glow ด้านหลัง */}
      <span className="absolute inset-0 rounded-2xl"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.8) 0%, rgba(59,130,246,0.4) 60%, transparent 100%)',
          animation: `glowPulse 1.8s ${delay}s infinite ease-in-out`,
          filter: 'blur(6px)',
        }}
      />
      {/* ตัวไอคอน */}
      <span className="relative z-10 flex items-center justify-center w-14 h-14 rounded-2xl text-2xl
        bg-white/10 backdrop-blur border border-white/20 shadow-lg">
        {icon}
      </span>
    </Link>
  )
}
