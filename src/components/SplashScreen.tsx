'use client'
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'

// สร้างดาวแบบ deterministic เพื่อหลีกเลี่ยง hydration mismatch
function generateStars(count: number) {
  const stars = []
  let seed = 42
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff
    return Math.abs(seed) / 0xffffffff
  }
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rand() * 100,
      y: rand() * 100,
      size: rand() * 2.5 + 0.5,
      opacity: rand() * 0.7 + 0.3,
      delay: rand() * 3,
    })
  }
  return stars
}

const STARS = generateStars(120)

export function SplashScreen() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    const shown = sessionStorage.getItem('splash_shown')
    if (!shown) {
      setVisible(true)
      sessionStorage.setItem('splash_shown', '1')
      // เริ่ม zoom หลัง mount
      setTimeout(() => setZoomed(true), 100)
      // fade out
      const t1 = setTimeout(() => setFading(true), 2500)
      const t2 = setTimeout(() => setVisible(false), 3100)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-500 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ background: 'radial-gradient(ellipse at center, #0a0a2e 0%, #000005 100%)' }}
    >
      {/* ดาว */}
      {STARS.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
            animationDelay: `${s.delay}s`,
            animationDuration: `${2 + s.delay}s`,
          }}
        />
      ))}

      {/* ไอคอน zoom เข้า */}
      <div
        className="relative rounded-3xl overflow-hidden shadow-2xl mb-8"
        style={{
          width: 140,
          height: 140,
          transform: zoomed ? 'scale(1)' : 'scale(0.3)',
          opacity: zoomed ? 1 : 0,
          transition: 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.8s ease',
        }}
      >
        <Image src="/icons/icon-512.png" alt="DesignDeck" fill className="object-cover" />
      </div>

      {/* ข้อความ */}
      <div
        style={{
          opacity: zoomed ? 1 : 0,
          transform: zoomed ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 1s ease 0.6s, transform 1s ease 0.6s',
        }}
        className="text-center"
      >
        <h1 className="text-white text-2xl font-bold mb-1">สวัสดีจ้าคนรวย</h1>
        <p className="text-indigo-300 text-sm opacity-80">DesignDeck</p>
      </div>
    </div>
  )
}
