'use client'
import { useRouter } from 'next/navigation'

export function BackButton({ href }: { href: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(href)}
      className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 mb-2"
    >
      ← กลับ
    </button>
  )
}
