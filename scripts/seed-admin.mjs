// Seed an admin user into Supabase using the service_role key.
// Usage: node scripts/seed-admin.mjs
// Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local (or env).
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnv() {
  const env = { ...process.env }
  try {
    const text = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {}
  return env
}

const env = loadEnv()
const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || url.includes('YOUR-PROJECT') || !serviceKey || serviceKey.includes('YOUR-')) {
  console.error('\n❌ ยังไม่ได้ใส่คีย์จริงใน .env.local')
  console.error('   ต้องมี: NEXT_PUBLIC_SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY\n')
  process.exit(1)
}

const EMAIL = 'admin@admin.com'
const PASSWORD = 'admin'

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data, error } = await admin.auth.admin.createUser({
  email: EMAIL,
  password: PASSWORD,
  email_confirm: true, // ยืนยันอีเมลให้เลย ไม่ต้องกดลิงก์
})

if (error) {
  if (/already.*registered|already exists/i.test(error.message)) {
    console.log(`✓ มี user ${EMAIL} อยู่แล้ว — ข้ามการสร้าง`)
    process.exit(0)
  }
  console.error('❌ สร้าง user ไม่สำเร็จ:', error.message)
  process.exit(1)
}

console.log(`\n✅ สร้าง admin สำเร็จ!`)
console.log(`   อีเมล: ${EMAIL}`)
console.log(`   รหัส : ${PASSWORD}`)
console.log(`   id   : ${data.user?.id}\n`)
