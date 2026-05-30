import type { Metadata, Viewport } from 'next'
import { Noto_Sans_Thai } from 'next/font/google'
import './globals.css'
import { PWARegister } from '@/components/PWARegister'

const notoThai = Noto_Sans_Thai({ subsets: ['thai', 'latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'DesignDeck',
  description: 'ผู้ช่วยจดลูกค้า & เทียบราคาดีลเลอร์ สำหรับนักออกแบบภายใน',
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={notoThai.className}><PWARegister />{children}</body>
    </html>
  )
}
