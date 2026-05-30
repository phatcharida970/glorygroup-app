'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const signInGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  const signInEmail = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMsg(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setMsg(error.message); return }
    location.href = '/'
  }

  const signUpEmail = async () => {
    setLoading(true); setMsg(null)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    setMsg(error ? error.message : 'สมัครแล้ว! เช็คอีเมลยืนยัน (ถ้าระบบเปิดไว้) แล้วเข้าสู่ระบบ')
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">DesignDeck</h1>
          <p className="text-sm opacity-70">ผู้ช่วยจดลูกค้า &amp; เทียบราคาดีลเลอร์</p>
        </div>
        <button onClick={signInGoogle}
          className="w-full rounded-xl border py-3 font-medium hover:bg-black/5">
          เข้าสู่ระบบด้วย Google
        </button>
        <div className="text-center text-xs opacity-50">หรือใช้อีเมล</div>
        <form onSubmit={signInEmail} className="space-y-3">
          <input className="w-full rounded-xl border px-4 py-3" type="email" placeholder="อีเมล"
            value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="w-full rounded-xl border px-4 py-3" type="password" placeholder="รหัสผ่าน"
            value={password} onChange={e => setPassword(e.target.value)} required />
          <button disabled={loading} className="w-full rounded-xl bg-indigo-600 text-white py-3 font-medium disabled:opacity-50">
            {loading ? 'กำลังเข้า...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
        <button onClick={signUpEmail} disabled={loading} className="w-full text-sm underline opacity-70">
          ยังไม่มีบัญชี? สมัครด้วยอีเมลนี้
        </button>
        {msg && <p className="text-sm text-center text-red-600">{msg}</p>}
      </div>
    </main>
  )
}
