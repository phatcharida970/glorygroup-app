# DesignDeck

ผู้ช่วยจดลูกค้า & เทียบราคาดีลเลอร์ สำหรับนักออกแบบภายใน (Next.js + Supabase, PWA)

## ตั้งค่า Supabase (ทำครั้งเดียว)
1. สมัคร https://supabase.com → New project (เลือก region Singapore)
2. ไปที่ **SQL Editor** → วางเนื้อหาไฟล์ `supabase/migrations/0001_init.sql` → Run
3. ไปที่ **Authentication → Providers** → เปิด **Google** (ใส่ Client ID/Secret จาก Google Cloud Console; Authorized redirect: `https://<project>.supabase.co/auth/v1/callback`) — หรือใช้ Email/Password เฉยๆ ก็ได้
4. **Authentication → URL Configuration** → ใส่ Site URL = โดเมน Vercel ของคุณ (และ http://localhost:3000 ตอน dev)
5. คัดลอก **Project URL** และ **anon key** (Settings → API)

## รันบนเครื่อง
```bash
cp .env.example .env.local   # ใส่ค่า URL + anon key
npm install
npm run dev                  # http://localhost:3000
```

## Deploy ขึ้น Vercel
1. push repo ขึ้น GitHub
2. https://vercel.com → New Project → import repo
3. ใส่ Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy → เปิดโดเมนที่ได้ → ติดตั้งเป็นแอป (Add to Home Screen)
