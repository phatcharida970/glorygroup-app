'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
export function SearchBar({ placeholder }: { placeholder: string }) {
  const router = useRouter(); const sp = useSearchParams(); const path = usePathname()
  return (
    <input defaultValue={sp.get('q') ?? ''} placeholder={placeholder}
      className="w-full rounded-xl border px-4 py-3 mb-4"
      onChange={(e) => {
        const v = e.target.value
        const params = new URLSearchParams(sp); v ? params.set('q', v) : params.delete('q')
        router.replace(`${path}?${params.toString()}`)
      }} />
  )
}
