# DesignDeck — Handoff (ส่งต่อให้ Claude แชตใหม่)

> อัปเดตล่าสุด: 2026-05-30 · อ่านไฟล์นี้ก่อนเริ่มทำงานต่อ

## TL;DR
DesignDeck = เว็บแอป (PWA) ช่วยสถาปนิก/นักออกแบบภายใน **จดลูกค้า + ความชอบดีไซน์** และ **จด/เทียบราคาดีลเลอร์ (มีประวัติราคา)**. v1 เสร็จและ **LIVE บน production แล้ว**. ผู้ใช้พูดไทย ไม่ใช่ dev — ตอบไทย, ทำ end-to-end ให้มากที่สุด, คืนเฉพาะ manual step ที่จำเป็น (เช่น สมัครบริการ/ก๊อปคีย์). ผู้ใช้ทำงานเร็ว ไม่ชอบรอ.

## 🌐 Production (ใช้งานได้จริงตอนนี้)
- URL: **https://designdeck-three.vercel.app**
- Admin login: **admin@admin.com / admin**
- Vercel project: `yok-s-projects/designdeck` (region pinned = `sin1` สิงคโปร์ ผ่าน `vercel.json`)

## Stack
Next.js 16.2.6 (App Router) + React 19 + Tailwind 4 + TypeScript · Supabase (Postgres+Auth+Storage, RLS owner-only) · deploy Vercel · PWA. Solo-user, online-first. **Offline เต็มรูปแบบ + ทีม/หลายผู้ใช้ = v2 (ยังไม่ทำ ตั้งใจเลื่อน)**.

## โครงสร้างสำคัญ
- Spec: `docs/superpowers/specs/2026-05-30-designdeck-design.md`
- Plan: `docs/superpowers/plans/2026-05-30-designdeck.md` (8 เฟส, ทำครบแล้ว)
- SQL schema: `supabase/migrations/0001_init.sql` (รันบน cloud แล้ว)
- Admin seed: `scripts/seed-admin.mjs` (ใช้ service_role จาก .env.local)
- Logic หลัก (มี unit test): `src/lib/compare.ts`, `format.ts`, `validation.ts`
- หน้าจอ: `src/app/(app)/` (customers, dealers, compare, prices/new, settings) + `login`
- nav: `src/components/nav/AppShell.tsx`

## Supabase (cloud)
- project ref: `ceuujgbwsvlsxyovftpb` · region: `ap-southeast-1` (สิงคโปร์)
- Auth: Site URL + redirect allow-list ตั้งเป็น production URL + localhost แล้ว
- admin user id: `8bae07a4-cf47-4faa-8457-51408c1e595c`
- bucket `attachments` (private) สร้างแล้ว

## คีย์ / ความลับ (สำคัญ)
- `.env.local` (gitignored, ไม่หลุด git) มี: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, **SUPABASE_SERVICE_ROLE_KEY** (ใช้ seed admin เท่านั้น — ห้ามขึ้น Vercel)
- บน Vercel ใส่แค่ 2 ตัว NEXT_PUBLIC_* (production+preview+development) แล้ว
- Vercel CLI: ใช้ตัว global `vercel@50.x` ที่ user login ไว้ (`/c/Users/ASUS/AppData/Roaming/npm/vercel`) — **อย่าไปไล่อ่านไฟล์ token เอง** (โดน policy block). deploy ด้วย `vercel --prod --yes`
- Supabase Management API token (`sbp_...`) ที่ user เคยให้ = ใช้ครั้งเดียวรัน schema/auth config; ถ้าต้องใช้อีกให้ขอใหม่จาก user

## สถานะ git
- branch `main`, tree clean. แอปทั้งหมด merge เข้า main แล้ว
- build เขียว, **14 vitest tests ผ่าน** (`npm test`), `npm run build` ผ่าน
- ยังไม่ได้ push ขึ้น GitHub (ไม่มี remote) — push เมื่อไรก็ได้ถ้า user ต้องการ

## งานที่ทำล่าสุด
แก้ "มือถือหน่วง": root cause = Vercel อยู่ iad1 (US) แต่ DB อยู่ Singapore → ทุก navigation วิ่งอ้อมโลก. แก้โดย pin `sin1` ใน vercel.json + เพิ่ม loading.tsx skeleton + useLinkStatus + touch-action. deploy แล้ว. **รอ user ยืนยันว่าลื่นขึ้นบนมือถือจริง** (ผมวัด TTFB จากเครื่อง dev ไม่เห็นต่างชัดเพราะไม่ได้อยู่ไทย).

## งานค้าง / น่าทำต่อ (ถ้า user ขอ)
1. **รอ feedback มือถือ** ว่าลื่นขึ้นไหม (ถ้ายังหน่วง เจาะต่อเป็นแท็บๆ)
2. **เปลี่ยนรหัส admin** ให้ปลอดภัยขึ้น (`admin` สั้นไป — user เคยสนใจ)
3. ตั้งโดเมนสวย / push GitHub / final code review (ข้ามไปตอนแรกตามคำขอ user)
4. polish: PWA icons ยัง placeholder, image-compress-before-upload ยังไม่ทำ
5. มีลูกค้าทดสอบ 1 ราย ("หยก ครกใหญ่") ใน DB — ลบได้จากหน้าลูกค้าถ้า user ต้องการ

## วิธีรัน local
```
cd D:\nOW
npm install
npm run dev        # http://localhost:3000  (อ่าน .env.local อัตโนมัติ)
npm test           # 14 tests
node scripts/seed-admin.mjs   # สร้าง admin (ถ้ายังไม่มี)
```
หมายเหตุ Windows/Git Bash: ผลลัพธ์คำสั่งบางทีบัฟเฟอร์ช้า — ถ้า bash ไม่คืน output ลองใช้ PowerShell tool แทน. core.autocrlf=false ตั้งไว้แล้ว.
