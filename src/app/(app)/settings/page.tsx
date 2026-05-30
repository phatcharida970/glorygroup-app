import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/actions/auth'

export const dynamic = 'force-dynamic'

export default async function Settings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">ตั้งค่า</h1>
      <p className="text-sm opacity-70">เข้าสู่ระบบด้วย: {user?.email}</p>
      <form action={signOut}><button className="rounded-xl border px-4 py-2">ออกจากระบบ</button></form>
    </div>
  )
}
