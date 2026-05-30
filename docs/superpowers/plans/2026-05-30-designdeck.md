# DesignDeck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้างเว็บแอป (PWA) ให้สถาปนิก/นักออกแบบภายในจดความชอบลูกค้า + จดและเทียบราคาดีลเลอร์ ใช้ได้มือถือ/คอม และ deploy ขึ้น Vercel ได้

**Architecture:** Next.js (App Router, TypeScript) เป็นทั้ง front + server actions; Supabase เป็น Postgres + Auth + Storage; ป้องกันข้อมูลด้วย RLS (ผู้ใช้คนเดียวเห็นเฉพาะข้อมูลตัวเอง). อ่านข้อมูลผ่าน React Server Components, เขียนผ่าน Server Actions, อัปโหลดรูปจาก client ตรงไป Supabase Storage.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, @supabase/supabase-js, @supabase/ssr, zod, Vitest, next-pwa (manifest + service worker)

**Spec:** `docs/superpowers/specs/2026-05-30-designdeck-design.md`

---

## หลักการตลอดแผน

- **TDD** สำหรับ logic บริสุทธิ์ (เทียบราคา, validation, format): เขียน test ให้ fail ก่อน → เขียนโค้ดให้ผ่าน → commit
- **DRY:** ใช้ component/action ที่แชร์กัน (เช่น `ChipInput`, `ImageUploader`, generic list) แทนการก๊อปซ้ำ
- **YAGNI:** ทำเฉพาะขอบเขต v1 ใน spec
- **Commit บ่อย:** ทุกจบ task ที่ทำงานได้
- **ภาษา:** UI ภาษาไทย, โค้ด/คอมเมนต์อังกฤษได้
- คำสั่งทั้งหมดรันบน Windows (Git Bash, node 24, npm 11) จาก root โปรเจกต์ `D:/nOW`

---

## File Structure (ภาพรวมไฟล์)

```
D:/nOW/                          # repo root = Next.js app
├── src/
│   ├── app/
│   │   ├── layout.tsx           # root layout (html, fonts, providers)
│   │   ├── globals.css          # tailwind + theme
│   │   ├── login/page.tsx       # หน้า login (Google + email)
│   │   ├── auth/callback/route.ts  # OAuth callback
│   │   ├── (app)/               # กลุ่มหลัง auth
│   │   │   ├── layout.tsx       # app shell: nav (bottom mobile / sidebar desktop) + auth guard
│   │   │   ├── page.tsx         # หน้าแรก (quick actions + search)
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx              # รายชื่อ
│   │   │   │   ├── new/page.tsx          # เพิ่ม
│   │   │   │   └── [id]/page.tsx         # รายละเอียด
│   │   │   │   └── [id]/edit/page.tsx    # แก้
│   │   │   ├── dealers/ (page, new, [id], [id]/edit)
│   │   │   ├── compare/
│   │   │   │   ├── page.tsx              # รายการสินค้า
│   │   │   │   └── [itemId]/page.tsx     # ตารางเทียบ + ประวัติ
│   │   │   ├── prices/new/page.tsx       # อัปเดตราคา
│   │   │   └── settings/page.tsx
│   ├── components/
│   │   ├── nav/ (BottomNav.tsx, Sidebar.tsx, AppShell.tsx)
│   │   ├── ui/ (Button.tsx, Input.tsx, Card.tsx, ChipInput.tsx, SearchBar.tsx, EmptyState.tsx)
│   │   ├── ImageUploader.tsx
│   │   ├── CustomerForm.tsx
│   │   ├── DealerForm.tsx
│   │   └── PriceForm.tsx
│   ├── lib/
│   │   ├── supabase/ (client.ts, server.ts, middleware.ts)
│   │   ├── compare.ts           # ★ logic เทียบราคา (pure)
│   │   ├── format.ts            # baht, thai date (pure)
│   │   ├── validation.ts        # zod schemas (pure)
│   │   └── types.ts             # types ข้อมูล
│   ├── actions/ (customers.ts, dealers.ts, items.ts, prices.ts, attachments.ts)
│   └── tests/ (compare.test.ts, format.test.ts, validation.test.ts)
├── supabase/migrations/0001_init.sql
├── public/ (manifest.webmanifest, icons, sw.js)
├── middleware.ts                # session refresh
├── .env.example / .env.local
├── vitest.config.ts
└── README.md
```

---

# PHASE 0 — วางโครงโปรเจกต์ & เครื่องมือทดสอบ

### Task 0.1: Scaffold Next.js ที่ root โปรเจกต์

**Files:** สร้างทั้งโปรเจกต์ Next.js ใน `D:/nOW`

- [ ] **Step 1: หยุด visual-companion server ชั่วคราว แล้วย้ายไฟล์ที่ขวาง**

`create-next-app` ไม่ยอมสร้างถ้ามีโฟลเดอร์แปลกปลอม ย้าย `.superpowers` และ `docs` ออกชั่วคราว:
```bash
cd /d/nOW
mv .superpowers /d/_dd_superpowers_bak 2>/dev/null
mv docs /d/_dd_docs_bak 2>/dev/null
mv .gitignore /d/_dd_gitignore_bak 2>/dev/null
ls -la   # เหลือแค่ .git
```

- [ ] **Step 2: รัน create-next-app ลงในโฟลเดอร์ปัจจุบัน**

```bash
cd /d/nOW
npx --yes create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --disable-git --no-turbopack
```
Expected: สร้าง `src/app`, `package.json`, `next.config.*`, `tailwind` สำเร็จ (ตอบ default ทุกข้อ)

- [ ] **Step 3: คืนไฟล์ที่ย้ายออก + คืน .gitignore ของเรา**

```bash
cd /d/nOW
cp -a /d/_dd_docs_bak/. docs/ 2>/dev/null || mv /d/_dd_docs_bak docs
mv /d/_dd_superpowers_bak .superpowers 2>/dev/null
mv /d/_dd_gitignore_bak .gitignore   # ใช้ .gitignore ของเรา (ทับของ create-next-app)
rm -rf /d/_dd_docs_bak /d/_dd_superpowers_bak 2>/dev/null
```

- [ ] **Step 4: รัน dev server เช็คว่าขึ้น**

```bash
cd /d/nOW && npm run dev
```
Expected: เปิด http://localhost:3000 เห็นหน้า Next.js เริ่มต้น แล้วกด Ctrl+C

- [ ] **Step 5: Commit**

```bash
cd /d/nOW && git add -A && git commit -m "chore: scaffold Next.js app (TS, Tailwind, App Router)"
```

---

### Task 0.2: ติดตั้ง dependencies ที่ต้องใช้

**Files:** `package.json`

- [ ] **Step 1: ติดตั้ง runtime + dev deps**

```bash
cd /d/nOW
npm install @supabase/supabase-js @supabase/ssr zod
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```
Expected: ติดตั้งสำเร็จ ไม่มี error

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json && git commit -m "chore: add supabase, zod, vitest deps"
```

---

### Task 0.3: ตั้งค่า Vitest + test แรก (ยืนยันว่า runner ทำงาน)

**Files:**
- Create: `vitest.config.ts`
- Create: `src/tests/smoke.test.ts`
- Modify: `package.json` (เพิ่ม script `test`)

- [ ] **Step 1: เขียน vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/tests/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
})
```

- [ ] **Step 2: เพิ่ม script ใน package.json**

ใน `"scripts"` เพิ่ม:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: เขียน failing test**

`src/tests/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('test runner works', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 4: รัน test**

```bash
cd /d/nOW && npm test
```
Expected: PASS 1 test

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts src/tests/smoke.test.ts package.json && git commit -m "test: configure vitest"
```

---

### Task 0.4: ธีมพื้นฐาน (ฟอนต์ไทย + สี) & metadata

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: ใส่ฟอนต์ไทย (Noto Sans Thai) + base styles ใน layout.tsx**

แทนที่เนื้อหา `src/app/layout.tsx` ด้วย:
```tsx
import type { Metadata, Viewport } from 'next'
import { Noto_Sans_Thai } from 'next/font/google'
import './globals.css'

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
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={notoThai.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: ใส่ utility สี/พื้นหลังใน globals.css (ต่อท้ายไฟล์)**

```css
:root { --brand: #4f46e5; }
html, body { background: #fafafa; color: #18181b; }
@media (prefers-color-scheme: dark) {
  html, body { background: #0b0b0c; color: #f4f4f5; }
}
/* ปุ่มแตะง่ายบนมือถือ */
button, a, input, select, textarea { font-size: 16px; }
```

- [ ] **Step 3: เช็ค build ไม่พัง**

```bash
cd /d/nOW && npm run build
```
Expected: build สำเร็จ

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: thai font + base theme + app metadata"
```

---

# PHASE 1 — Supabase: schema, client, env, types

### Task 1.1: เขียน SQL migration (ตาราง + index + view + trigger + RLS + storage)

**Files:**
- Create: `supabase/migrations/0001_init.sql`

- [ ] **Step 1: เขียนไฟล์ migration ทั้งหมด**

`supabase/migrations/0001_init.sql`:
```sql
-- ========== EXTENSIONS ==========
create extension if not exists "pgcrypto";

-- ========== updated_at trigger ==========
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ========== customers ==========
create table customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  phone text, line_id text, project_name text, address text, budget text,
  style_tags text[] not null default '{}',
  color_material_tags text[] not null default '{}',
  dislikes text,
  rooms text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_customers_updated before update on customers
  for each row execute function set_updated_at();
create index customers_owner_idx on customers(owner_id);

-- ========== dealers ==========
create table dealers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  rating numeric(2,1),
  categories text[] not null default '{}',
  phone text, line_id text, location_text text, map_url text,
  credit_terms text, shipping_note text, min_order text, hours text, notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_dealers_updated before update on dealers
  for each row execute function set_updated_at();
create index dealers_owner_idx on dealers(owner_id);

-- ========== items ==========
create table items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  unit text not null,
  category text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_items_updated before update on items
  for each row execute function set_updated_at();
create index items_owner_idx on items(owner_id);

-- ========== prices (เก็บประวัติ) ==========
create table prices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  dealer_id uuid not null references dealers(id) on delete cascade,
  price numeric(12,2) not null,
  observed_at date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);
create index prices_lookup_idx on prices(item_id, dealer_id, observed_at desc, created_at desc);
create index prices_owner_idx on prices(owner_id);

-- ========== attachments ==========
create table attachments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('customer','dealer')),
  entity_id uuid not null,
  storage_path text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index attachments_entity_idx on attachments(entity_type, entity_id);

-- ========== view: ราคาล่าสุดต่อ (item, dealer) ==========
create view latest_prices as
select distinct on (item_id, dealer_id)
  id, owner_id, item_id, dealer_id, price, observed_at, created_at
from prices
order by item_id, dealer_id, observed_at desc, created_at desc;

-- ========== RLS ==========
alter table customers enable row level security;
alter table dealers   enable row level security;
alter table items     enable row level security;
alter table prices    enable row level security;
alter table attachments enable row level security;

create policy own_customers on customers for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy own_dealers   on dealers   for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy own_items     on items     for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy own_prices    on prices    for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy own_attachments on attachments for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ========== storage bucket + policies ==========
insert into storage.buckets (id, name, public) values ('attachments','attachments', false)
on conflict (id) do nothing;

-- ผู้ใช้เข้าถึงเฉพาะไฟล์ในโฟลเดอร์ {auth.uid()}/...
create policy "own files read"   on storage.objects for select using (bucket_id='attachments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files insert" on storage.objects for insert with check (bucket_id='attachments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files delete" on storage.objects for delete using (bucket_id='attachments' and (storage.foldername(name))[1] = auth.uid()::text);
```

- [ ] **Step 2: Commit** (ยังไม่ต้องรัน — รันตอน setup Supabase ใน Phase 8/README)

```bash
git add supabase/migrations/0001_init.sql && git commit -m "feat: supabase schema (tables, view, RLS, storage)"
```

---

### Task 1.2: env example + .env.local

**Files:**
- Create: `.env.example`
- Create: `.env.local` (ไม่ commit — อยู่ใน .gitignore)

- [ ] **Step 1: เขียน .env.example**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

- [ ] **Step 2: สร้าง .env.local (ค่าจริงใส่ตอน setup Supabase)**

```bash
cd /d/nOW && cp .env.example .env.local
```

- [ ] **Step 3: Commit (เฉพาะ .example)**

```bash
git add .env.example && git commit -m "chore: add env example"
```

---

### Task 1.3: Supabase client factories (browser + server)

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`

- [ ] **Step 1: browser client**

`src/lib/supabase/client.ts`:
```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

- [ ] **Step 2: server client (อ่าน/เขียน cookie)**

`src/lib/supabase/server.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch { /* called from Server Component — ignore */ }
        },
      },
    },
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase && git commit -m "feat: supabase client factories"
```

---

### Task 1.4: Types ของข้อมูล

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: เขียน types**

`src/lib/types.ts`:
```ts
export type Customer = {
  id: string; owner_id: string; name: string
  phone: string | null; line_id: string | null
  project_name: string | null; address: string | null; budget: string | null
  style_tags: string[]; color_material_tags: string[]
  dislikes: string | null; rooms: string[]; notes: string | null
  created_at: string; updated_at: string
}

export type Dealer = {
  id: string; owner_id: string; name: string; rating: number | null
  categories: string[]; phone: string | null; line_id: string | null
  location_text: string | null; map_url: string | null
  credit_terms: string | null; shipping_note: string | null
  min_order: string | null; hours: string | null; notes: string | null
  created_at: string; updated_at: string
}

export type Item = {
  id: string; owner_id: string; name: string; unit: string
  category: string | null; notes: string | null
  created_at: string; updated_at: string
}

export type Price = {
  id: string; owner_id: string; item_id: string; dealer_id: string
  price: number; observed_at: string; note: string | null; created_at: string
}

export type Attachment = {
  id: string; owner_id: string
  entity_type: 'customer' | 'dealer'; entity_id: string
  storage_path: string; caption: string | null; sort_order: number; created_at: string
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts && git commit -m "feat: data types"
```

---

# PHASE 2 — Logic หลัก (TDD)

### Task 2.1: `compare.ts` — ราคาล่าสุดต่อร้าน + จัดอันดับถูกสุด

**Files:**
- Create: `src/lib/compare.ts`
- Test: `src/tests/compare.test.ts`

- [ ] **Step 1: เขียน failing tests**

`src/tests/compare.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { buildComparison, type PriceInput } from '@/lib/compare'

const p = (dealerId: string, dealerName: string, price: number, observedAt: string): PriceInput =>
  ({ dealerId, dealerName, price, observedAt })

describe('buildComparison', () => {
  it('คืนค่าว่างเมื่อไม่มีราคา', () => {
    const r = buildComparison([])
    expect(r.rows).toEqual([])
    expect(r.cheapestPrice).toBeNull()
    expect(r.maxDiff).toBe(0)
  })

  it('เลือกราคาล่าสุดต่อร้าน (ตามวันที่)', () => {
    const r = buildComparison([
      p('d1', 'ร้าน A', 250, '2026-04-01'),
      p('d1', 'ร้าน A', 228, '2026-05-12'), // ใหม่กว่า → ใช้ตัวนี้
    ])
    expect(r.rows).toHaveLength(1)
    expect(r.rows[0].price).toBe(228)
  })

  it('เรียงถูก→แพง และทำเครื่องหมายถูกสุด', () => {
    const r = buildComparison([
      p('d1', 'ร้าน A', 245, '2026-05-03'),
      p('d2', 'ร้าน B', 228, '2026-05-12'),
      p('d3', 'ร้าน C', 250, '2026-04-28'),
    ])
    expect(r.rows.map(x => x.dealerId)).toEqual(['d2', 'd1', 'd3'])
    expect(r.rows[0].isCheapest).toBe(true)
    expect(r.rows[1].isCheapest).toBe(false)
    expect(r.cheapestPrice).toBe(228)
    expect(r.maxDiff).toBe(22)
  })

  it('ถูกสุดเท่ากันหลายเจ้า ติดธงทุกเจ้า', () => {
    const r = buildComparison([
      p('d1', 'A', 100, '2026-05-01'),
      p('d2', 'B', 100, '2026-05-01'),
      p('d3', 'C', 120, '2026-05-01'),
    ])
    expect(r.rows.filter(x => x.isCheapest)).toHaveLength(2)
  })

  it('วันที่เท่ากัน เลือกตัวที่ใส่ทีหลัง (index มากกว่า)', () => {
    const r = buildComparison([
      p('d1', 'A', 300, '2026-05-01'),
      p('d1', 'A', 280, '2026-05-01'), // index ทีหลัง = ล่าสุด
    ])
    expect(r.rows[0].price).toBe(280)
  })
})
```

- [ ] **Step 2: รัน test ให้เห็น fail**

```bash
cd /d/nOW && npx vitest run src/tests/compare.test.ts
```
Expected: FAIL — "Cannot find module '@/lib/compare'"

- [ ] **Step 3: เขียน implementation**

`src/lib/compare.ts`:
```ts
export type PriceInput = {
  dealerId: string
  dealerName: string
  price: number
  observedAt: string // ISO date 'YYYY-MM-DD'
}

export type ComparisonRow = PriceInput & { isCheapest: boolean }

export type Comparison = {
  rows: ComparisonRow[]
  cheapestPrice: number | null
  maxDiff: number
}

export function buildComparison(prices: PriceInput[]): Comparison {
  // 1) ราคาล่าสุดต่อร้าน: เก็บ index ไว้ทำ tie-break เมื่อ observedAt เท่ากัน
  const latestByDealer = new Map<string, { row: PriceInput; idx: number }>()
  prices.forEach((row, idx) => {
    const cur = latestByDealer.get(row.dealerId)
    if (!cur) { latestByDealer.set(row.dealerId, { row, idx }); return }
    const newer = row.observedAt > cur.row.observedAt
    const sameDateLater = row.observedAt === cur.row.observedAt && idx > cur.idx
    if (newer || sameDateLater) latestByDealer.set(row.dealerId, { row, idx })
  })

  const latest = [...latestByDealer.values()].map(v => v.row)
  if (latest.length === 0) return { rows: [], cheapestPrice: null, maxDiff: 0 }

  // 2) เรียงถูก→แพง
  latest.sort((a, b) => a.price - b.price)
  const cheapestPrice = latest[0].price
  const maxPrice = latest[latest.length - 1].price

  // 3) ติดธงถูกสุด
  const rows: ComparisonRow[] = latest.map(r => ({ ...r, isCheapest: r.price === cheapestPrice }))

  return { rows, cheapestPrice, maxDiff: Math.round((maxPrice - cheapestPrice) * 100) / 100 }
}
```

- [ ] **Step 4: รัน test ให้ผ่าน**

```bash
cd /d/nOW && npx vitest run src/tests/compare.test.ts
```
Expected: PASS ทั้ง 5 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/compare.ts src/tests/compare.test.ts && git commit -m "feat: price comparison logic (TDD)"
```

---

### Task 2.2: `format.ts` — เงินบาท + วันที่ไทย + แนวโน้มราคา

**Files:**
- Create: `src/lib/format.ts`
- Test: `src/tests/format.test.ts`

- [ ] **Step 1: failing tests**

`src/tests/format.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { formatBaht, formatThaiDate, priceTrend } from '@/lib/format'

describe('formatBaht', () => {
  it('ใส่สัญลักษณ์บาทและคอมมา', () => {
    expect(formatBaht(2200)).toBe('฿2,200')
    expect(formatBaht(228.5)).toBe('฿228.50')
  })
})

describe('formatThaiDate', () => {
  it('แปลงเป็นวันที่ไทยแบบสั้น', () => {
    expect(formatThaiDate('2026-05-12')).toBe('12 พ.ค. 2569')
  })
})

describe('priceTrend', () => {
  it('ลดลง/เพิ่มขึ้น/เท่าเดิม', () => {
    expect(priceTrend(228, 250)).toBe('down') // ล่าสุด 228 < ก่อนหน้า 250
    expect(priceTrend(260, 250)).toBe('up')
    expect(priceTrend(250, 250)).toBe('same')
    expect(priceTrend(250, null)).toBe('same')
  })
})
```

- [ ] **Step 2: รัน → FAIL** (`npx vitest run src/tests/format.test.ts`) — module not found

- [ ] **Step 3: implementation**

`src/lib/format.ts`:
```ts
export function formatBaht(n: number): string {
  const hasFraction = Math.round(n * 100) % 100 !== 0
  const body = n.toLocaleString('en-US', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })
  return `฿${body}`
}

export function formatThaiDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`
}

export function priceTrend(latest: number, previous: number | null): 'up' | 'down' | 'same' {
  if (previous === null) return 'same'
  if (latest < previous) return 'down'
  if (latest > previous) return 'up'
  return 'same'
}
```

- [ ] **Step 4: รัน → PASS**
- [ ] **Step 5: Commit**

```bash
git add src/lib/format.ts src/tests/format.test.ts && git commit -m "feat: thai format helpers (TDD)"
```

---

### Task 2.3: `validation.ts` — zod schemas

**Files:**
- Create: `src/lib/validation.ts`
- Test: `src/tests/validation.test.ts`

- [ ] **Step 1: failing tests**

`src/tests/validation.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { customerSchema, dealerSchema, itemSchema, priceSchema } from '@/lib/validation'

describe('customerSchema', () => {
  it('ต้องมีชื่อ', () => {
    expect(customerSchema.safeParse({ name: '' }).success).toBe(false)
    expect(customerSchema.safeParse({ name: 'คุณสมชาย' }).success).toBe(true)
  })
  it('แท็กเป็น array ของ string และ default []', () => {
    const r = customerSchema.parse({ name: 'A' })
    expect(r.style_tags).toEqual([])
  })
})

describe('priceSchema', () => {
  it('price ต้อง > 0', () => {
    expect(priceSchema.safeParse({ item_id: 'i', dealer_id: 'd', price: 0, observed_at: '2026-05-01' }).success).toBe(false)
    expect(priceSchema.safeParse({ item_id: 'i', dealer_id: 'd', price: 10, observed_at: '2026-05-01' }).success).toBe(true)
  })
})

describe('itemSchema', () => {
  it('ต้องมีชื่อและหน่วย', () => {
    expect(itemSchema.safeParse({ name: 'ไม้อัด', unit: '' }).success).toBe(false)
    expect(itemSchema.safeParse({ name: 'ไม้อัด', unit: 'แผ่น' }).success).toBe(true)
  })
})

describe('dealerSchema', () => {
  it('rating อยู่ 0-5 ถ้ามี', () => {
    expect(dealerSchema.safeParse({ name: 'ร้าน', rating: 6 }).success).toBe(false)
    expect(dealerSchema.safeParse({ name: 'ร้าน', rating: 4.5 }).success).toBe(true)
  })
})
```

- [ ] **Step 2: รัน → FAIL**

- [ ] **Step 3: implementation**

`src/lib/validation.ts`:
```ts
import { z } from 'zod'

const tags = z.array(z.string()).default([])

export const customerSchema = z.object({
  name: z.string().min(1, 'กรุณาใส่ชื่อ'),
  phone: z.string().optional().nullable(),
  line_id: z.string().optional().nullable(),
  project_name: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  budget: z.string().optional().nullable(),
  style_tags: tags,
  color_material_tags: tags,
  dislikes: z.string().optional().nullable(),
  rooms: tags,
  notes: z.string().optional().nullable(),
})

export const dealerSchema = z.object({
  name: z.string().min(1, 'กรุณาใส่ชื่อร้าน'),
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
  categories: tags,
  phone: z.string().optional().nullable(),
  line_id: z.string().optional().nullable(),
  location_text: z.string().optional().nullable(),
  map_url: z.string().url('ลิงก์ไม่ถูกต้อง').optional().or(z.literal('')).nullable(),
  credit_terms: z.string().optional().nullable(),
  shipping_note: z.string().optional().nullable(),
  min_order: z.string().optional().nullable(),
  hours: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const itemSchema = z.object({
  name: z.string().min(1, 'กรุณาใส่ชื่อสินค้า'),
  unit: z.string().min(1, 'กรุณาใส่หน่วย'),
  category: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const priceSchema = z.object({
  item_id: z.string().min(1),
  dealer_id: z.string().min(1),
  price: z.coerce.number().positive('ราคาต้องมากกว่า 0'),
  observed_at: z.string().min(1),
  note: z.string().optional().nullable(),
})

export type CustomerInput = z.infer<typeof customerSchema>
export type DealerInput = z.infer<typeof dealerSchema>
export type ItemInput = z.infer<typeof itemSchema>
export type PriceInput = z.infer<typeof priceSchema>
```

- [ ] **Step 4: รัน → PASS**
- [ ] **Step 5: Commit**

```bash
git add src/lib/validation.ts src/tests/validation.test.ts && git commit -m "feat: zod validation schemas (TDD)"
```

---

# PHASE 3 — Authentication

### Task 3.1: Middleware รีเฟรช session

**Files:**
- Create: `src/lib/supabase/middleware.ts`
- Create: `middleware.ts` (root)

- [ ] **Step 1: helper อัปเดต session**

`src/lib/supabase/middleware.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )
  await supabase.auth.getUser()
  return response
}
```

- [ ] **Step 2: middleware ราก**

`middleware.ts`:
```ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|sw.js|.*\\.(?:png|jpg|jpeg|svg)$).*)'],
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/middleware.ts middleware.ts && git commit -m "feat: auth session middleware"
```

---

### Task 3.2: หน้า Login (Google + อีเมล)

**Files:**
- Create: `src/app/login/page.tsx`

- [ ] **Step 1: เขียนหน้า login (client component)**

`src/app/login/page.tsx`:
```tsx
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
```

- [ ] **Step 2: เช็ค build** (`npm run build`) — Expected: build ผ่าน
- [ ] **Step 3: Commit**

```bash
git add src/app/login/page.tsx && git commit -m "feat: login page (google + email)"
```

---

### Task 3.3: Auth callback route

**Files:**
- Create: `src/app/auth/callback/route.ts`

- [ ] **Step 1: เขียน route แลก code เป็น session**

`src/app/auth/callback/route.ts`:
```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }
  return NextResponse.redirect(`${origin}/login`)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/auth/callback/route.ts && git commit -m "feat: oauth callback route"
```

---

### Task 3.4: Auth guard + sign out (ใน (app) layout)

**Files:**
- Create: `src/app/(app)/layout.tsx` (auth guard ส่วนหนึ่ง — จะเติม nav ใน Task 4.1)
- Create: `src/actions/auth.ts`

- [ ] **Step 1: sign out action**

`src/actions/auth.ts`:
```ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

- [ ] **Step 2: (app) layout เด้งไป login ถ้ายังไม่ล็อกอิน** (เวอร์ชันชั่วคราว — เติม nav ทีหลัง)

`src/app/(app)/layout.tsx`:
```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <>{children}</>
}
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/layout.tsx" src/actions/auth.ts && git commit -m "feat: auth guard + sign out"
```

---

# PHASE 4 — App shell, navigation, หน้าแรก, PWA

### Task 4.1: Navigation (bottom mobile / sidebar desktop) ใน (app) layout

**Files:**
- Create: `src/components/nav/AppShell.tsx`
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: AppShell (nav responsive)**

`src/components/nav/AppShell.tsx`:
```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/', label: 'หน้าแรก', icon: '🏠' },
  { href: '/customers', label: 'ลูกค้า', icon: '👤' },
  { href: '/dealers', label: 'ดีลเลอร์', icon: '🏪' },
  { href: '/compare', label: 'เทียบราคา', icon: '🏷️' },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const active = (href: string) => href === '/' ? path === '/' : path.startsWith(href)
  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:w-56 md:flex-col border-r p-4 gap-1">
        <div className="font-bold text-lg px-3 py-2">DesignDeck</div>
        {items.map(it => (
          <Link key={it.href} href={it.href}
            className={`px-3 py-2 rounded-lg ${active(it.href) ? 'bg-indigo-600 text-white' : 'hover:bg-black/5'}`}>
            <span className="mr-2">{it.icon}</span>{it.label}
          </Link>
        ))}
        <Link href="/settings" className="mt-auto px-3 py-2 rounded-lg hover:bg-black/5">⚙️ ตั้งค่า</Link>
      </aside>

      {/* Main */}
      <main className="flex-1 pb-20 md:pb-6 max-w-2xl mx-auto w-full p-4">{children}</main>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t bg-white dark:bg-zinc-900 grid grid-cols-4">
        {items.map(it => (
          <Link key={it.href} href={it.href}
            className={`flex flex-col items-center py-2 text-xs ${active(it.href) ? 'text-indigo-600' : 'opacity-70'}`}>
            <span className="text-lg">{it.icon}</span>{it.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
```

- [ ] **Step 2: ใส่ AppShell ใน (app) layout**

แก้ `src/app/(app)/layout.tsx` ให้ครอบ children ด้วย AppShell:
```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/nav/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <AppShell>{children}</AppShell>
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: responsive app shell navigation"
```

---

### Task 4.2: หน้าแรก (quick actions)

**Files:**
- Create: `src/app/(app)/page.tsx`

- [ ] **Step 1: เขียนหน้าแรก พร้อมปุ่มลัด + นับจำนวน**

`src/app/(app)/page.tsx`:
```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const [{ count: customers }, { count: dealers }, { count: items }] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('dealers').select('*', { count: 'exact', head: true }),
    supabase.from('items').select('*', { count: 'exact', head: true }),
  ])
  const actions = [
    { href: '/customers/new', label: '➕ เพิ่มลูกค้า' },
    { href: '/dealers/new', label: '➕ เพิ่มดีลเลอร์' },
    { href: '/prices/new', label: '💰 อัปเดตราคา' },
    { href: '/compare', label: '🏷️ เทียบราคา' },
  ]
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">สวัสดีครับ 👋</h1>
      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat n={customers ?? 0} label="ลูกค้า" />
        <Stat n={dealers ?? 0} label="ดีลเลอร์" />
        <Stat n={items ?? 0} label="สินค้า" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {actions.map(a => (
          <Link key={a.href} href={a.href}
            className="rounded-2xl border p-4 text-center font-medium hover:bg-black/5">{a.label}</Link>
        ))}
      </div>
    </div>
  )
}
function Stat({ n, label }: { n: number; label: string }) {
  return <div className="rounded-2xl border p-4"><div className="text-2xl font-bold">{n}</div><div className="text-xs opacity-70">{label}</div></div>
}
```

- [ ] **Step 2: Commit** — `git add -A && git commit -m "feat: home page with quick actions"`

---

### Task 4.3: PWA (manifest + service worker + icons)

**Files:**
- Create: `public/manifest.webmanifest`
- Create: `public/sw.js`
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png` (placeholder)
- Create: `src/components/PWARegister.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: manifest**

`public/manifest.webmanifest`:
```json
{
  "name": "DesignDeck",
  "short_name": "DesignDeck",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#fafafa",
  "theme_color": "#4f46e5",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- [ ] **Step 2: service worker แบบ network-first (app shell)**

`public/sw.js`:
```js
const CACHE = 'designdeck-v1'
self.addEventListener('install', (e) => { self.skipWaiting() })
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()) })
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone()
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {})
      return res
    }).catch(() => caches.match(e.request))
  )
})
```

- [ ] **Step 3: สร้างไอคอน placeholder (สี่เหลี่ยมสีแบรนด์)**

```bash
cd /d/nOW && mkdir -p public/icons
# สร้าง PNG 1x1 สีม่วงเป็น placeholder (เปลี่ยนเป็นโลโก้จริงภายหลัง)
node -e "const fs=require('fs');const b=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64');fs.writeFileSync('public/icons/icon-192.png',b);fs.writeFileSync('public/icons/icon-512.png',b)"
```
> หมายเหตุ: แทนที่ด้วยไอคอนจริง (192/512) ภายหลังเพื่อความสวยงาม

- [ ] **Step 4: ลงทะเบียน service worker**

`src/components/PWARegister.tsx`:
```tsx
'use client'
import { useEffect } from 'react'
export function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])
  return null
}
```

แล้วใส่ `<PWARegister />` ใน `src/app/layout.tsx` ภายใน `<body>` (ก่อน `{children}`):
```tsx
import { PWARegister } from '@/components/PWARegister'
// ... ใน body:
// <body className={notoThai.className}><PWARegister />{children}</body>
```

- [ ] **Step 5: เช็ค build + commit**

```bash
npm run build && git add -A && git commit -m "feat: PWA manifest + service worker"
```

---

# PHASE 5 — ฟีเจอร์ลูกค้า (Customers) — entity แม่แบบ

> เฟสนี้สร้าง component ที่ใช้ซ้ำ (`ChipInput`, `ImageUploader`) ด้วย ดีลเลอร์/สินค้าจะนำไปใช้ต่อ

### Task 5.1: ChipInput (input แท็กหลายค่า) — ใช้ซ้ำทุกฟอร์ม

**Files:**
- Create: `src/components/ui/ChipInput.tsx`

- [ ] **Step 1: เขียน ChipInput**

`src/components/ui/ChipInput.tsx`:
```tsx
'use client'
import { useState } from 'react'

export function ChipInput({ name, label, defaultValue = [], placeholder }: {
  name: string; label: string; defaultValue?: string[]; placeholder?: string
}) {
  const [chips, setChips] = useState<string[]>(defaultValue)
  const [text, setText] = useState('')
  const add = () => { const t = text.trim(); if (t && !chips.includes(t)) setChips([...chips, t]); setText('') }
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {chips.map((c, i) => <input key={i} type="hidden" name={name} value={c} />)}
      <div className="flex flex-wrap gap-2 mb-2">
        {chips.map((c, i) => (
          <span key={i} className="inline-flex items-center gap-1 bg-zinc-200 dark:bg-zinc-700 rounded-full px-3 py-1 text-sm">
            {c}<button type="button" onClick={() => setChips(chips.filter((_, j) => j !== i))}>×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="flex-1 rounded-lg border px-3 py-2" value={text} placeholder={placeholder}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
        <button type="button" onClick={add} className="rounded-lg border px-4">เพิ่ม</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit** — `git add -A && git commit -m "feat: ChipInput component"`

---

### Task 5.2: Customer server actions (create/update/delete)

**Files:**
- Create: `src/actions/customers.ts`

- [ ] **Step 1: เขียน actions (parse ด้วย zod แล้วเขียน DB)**

`src/actions/customers.ts`:
```ts
'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { customerSchema } from '@/lib/validation'

function parse(formData: FormData) {
  return customerSchema.parse({
    name: formData.get('name'),
    phone: formData.get('phone') || null,
    line_id: formData.get('line_id') || null,
    project_name: formData.get('project_name') || null,
    address: formData.get('address') || null,
    budget: formData.get('budget') || null,
    dislikes: formData.get('dislikes') || null,
    notes: formData.get('notes') || null,
    style_tags: formData.getAll('style_tags').map(String),
    color_material_tags: formData.getAll('color_material_tags').map(String),
    rooms: formData.getAll('rooms').map(String),
  })
}

export async function createCustomer(formData: FormData) {
  const supabase = await createClient()
  const data = parse(formData)
  const { data: row, error } = await supabase.from('customers').insert(data).select('id').single()
  if (error) throw new Error(error.message)
  revalidatePath('/customers')
  redirect(`/customers/${row.id}`)
}

export async function updateCustomer(id: string, formData: FormData) {
  const supabase = await createClient()
  const data = parse(formData)
  const { error } = await supabase.from('customers').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/customers/${id}`)
  redirect(`/customers/${id}`)
}

export async function deleteCustomer(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/customers')
  redirect('/customers')
}
```

- [ ] **Step 2: Commit** — `git add -A && git commit -m "feat: customer actions"`

---

### Task 5.3: CustomerForm (ใช้ทั้งเพิ่มและแก้)

**Files:**
- Create: `src/components/CustomerForm.tsx`

- [ ] **Step 1: เขียนฟอร์ม**

`src/components/CustomerForm.tsx`:
```tsx
import { ChipInput } from '@/components/ui/ChipInput'
import type { Customer } from '@/lib/types'

export function CustomerForm({ action, defaultValue, submitLabel }: {
  action: (formData: FormData) => void
  defaultValue?: Partial<Customer>
  submitLabel: string
}) {
  const d = defaultValue ?? {}
  const F = ({ name, label, type = 'text', defv }: { name: string; label: string; type?: string; defv?: string | null }) => (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input name={name} type={type} defaultValue={defv ?? ''} className="w-full rounded-lg border px-3 py-2" />
    </div>
  )
  return (
    <form action={action} className="space-y-4">
      <F name="name" label="ชื่อลูกค้า *" defv={d.name} />
      <div className="grid grid-cols-2 gap-3">
        <F name="phone" label="เบอร์โทร" defv={d.phone} />
        <F name="line_id" label="LINE" defv={d.line_id} />
      </div>
      <F name="project_name" label="โปรเจกต์/งาน" defv={d.project_name} />
      <F name="address" label="ที่อยู่หน้างาน" defv={d.address} />
      <F name="budget" label="งบประมาณ" defv={d.budget} />
      <ChipInput name="style_tags" label="สไตล์ที่ชอบ" defaultValue={d.style_tags} placeholder="เช่น Modern" />
      <ChipInput name="color_material_tags" label="โทนสี/วัสดุที่ชอบ" defaultValue={d.color_material_tags} placeholder="เช่น ไม้โอ๊ค" />
      <div>
        <label className="block text-sm font-medium mb-1">สิ่งที่ไม่ชอบ/ห้ามใช้</label>
        <textarea name="dislikes" defaultValue={d.dislikes ?? ''} className="w-full rounded-lg border px-3 py-2" rows={2} />
      </div>
      <ChipInput name="rooms" label="ห้อง/พื้นที่" defaultValue={d.rooms} placeholder="เช่น ห้องนั่งเล่น" />
      <div>
        <label className="block text-sm font-medium mb-1">โน้ต</label>
        <textarea name="notes" defaultValue={d.notes ?? ''} className="w-full rounded-lg border px-3 py-2" rows={3} />
      </div>
      <button className="w-full rounded-xl bg-indigo-600 text-white py-3 font-medium">{submitLabel}</button>
    </form>
  )
}
```

- [ ] **Step 2: Commit** — `git add -A && git commit -m "feat: CustomerForm"`

---

### Task 5.4: หน้าเพิ่ม + แก้ลูกค้า

**Files:**
- Create: `src/app/(app)/customers/new/page.tsx`
- Create: `src/app/(app)/customers/[id]/edit/page.tsx`

- [ ] **Step 1: หน้าเพิ่ม**

`src/app/(app)/customers/new/page.tsx`:
```tsx
import { CustomerForm } from '@/components/CustomerForm'
import { createCustomer } from '@/actions/customers'

export default function NewCustomer() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">เพิ่มลูกค้า</h1>
      <CustomerForm action={createCustomer} submitLabel="บันทึก" />
    </div>
  )
}
```

- [ ] **Step 2: หน้าแก้**

`src/app/(app)/customers/[id]/edit/page.tsx`:
```tsx
import { notFound } from 'next/navigation'
import { CustomerForm } from '@/components/CustomerForm'
import { updateCustomer } from '@/actions/customers'
import { createClient } from '@/lib/supabase/server'

export default async function EditCustomer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('customers').select('*').eq('id', id).single()
  if (!data) notFound()
  const action = updateCustomer.bind(null, id)
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">แก้ไขลูกค้า</h1>
      <CustomerForm action={action} defaultValue={data} submitLabel="บันทึกการแก้ไข" />
    </div>
  )
}
```

- [ ] **Step 3: Commit** — `git add -A && git commit -m "feat: customer new/edit pages"`

---

### Task 5.5: รายชื่อลูกค้า + ค้นหา

**Files:**
- Create: `src/app/(app)/customers/page.tsx`
- Create: `src/components/ui/SearchBar.tsx`
- Create: `src/components/ui/EmptyState.tsx`

- [ ] **Step 1: SearchBar (อัปเดต query param)**

`src/components/ui/SearchBar.tsx`:
```tsx
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
```

- [ ] **Step 2: EmptyState**

`src/components/ui/EmptyState.tsx`:
```tsx
import Link from 'next/link'
export function EmptyState({ text, ctaHref, ctaLabel }: { text: string; ctaHref?: string; ctaLabel?: string }) {
  return (
    <div className="text-center opacity-70 py-12">
      <p>{text}</p>
      {ctaHref && <Link href={ctaHref} className="inline-block mt-3 underline">{ctaLabel}</Link>}
    </div>
  )
}
```

- [ ] **Step 3: หน้ารายชื่อ (ค้นหาด้วย ilike)**

`src/app/(app)/customers/page.tsx`:
```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SearchBar } from '@/components/ui/SearchBar'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const supabase = await createClient()
  let query = supabase.from('customers').select('*').order('updated_at', { ascending: false })
  if (q) query = query.ilike('name', `%${q}%`)
  const { data: customers } = await query

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">ลูกค้า</h1>
        <Link href="/customers/new" className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm">➕ เพิ่ม</Link>
      </div>
      <SearchBar placeholder="ค้นหาชื่อลูกค้า..." />
      {!customers?.length ? (
        <EmptyState text="ยังไม่มีลูกค้า" ctaHref="/customers/new" ctaLabel="เพิ่มลูกค้าคนแรก" />
      ) : (
        <ul className="space-y-2">
          {customers.map(c => (
            <li key={c.id}>
              <Link href={`/customers/${c.id}`} className="block rounded-xl border p-4 hover:bg-black/5">
                <div className="font-medium">{c.name}</div>
                <div className="text-sm opacity-70">{[...(c.style_tags ?? [])].slice(0, 3).join(' · ') || c.project_name || ''}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: customers list + search"`

---

### Task 5.6: ImageUploader + attachments action (mood board)

**Files:**
- Create: `src/actions/attachments.ts`
- Create: `src/components/ImageUploader.tsx`

- [ ] **Step 1: attachments action (สร้าง signed URL ไม่ต้อง — แสดงผ่าน signed url ตอน list)**

`src/actions/attachments.ts`:
```ts
'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function recordAttachment(input: {
  entity_type: 'customer' | 'dealer'; entity_id: string; storage_path: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('attachments').insert(input)
  if (error) throw new Error(error.message)
  revalidatePath(`/${input.entity_type}s/${input.entity_id}`)
}

export async function deleteAttachment(id: string, storage_path: string, entityPath: string) {
  const supabase = await createClient()
  await supabase.storage.from('attachments').remove([storage_path])
  await supabase.from('attachments').delete().eq('id', id)
  revalidatePath(entityPath)
}
```

- [ ] **Step 2: ImageUploader (อัปโหลดจาก client ตรงไป storage แล้วบันทึก path)**

`src/components/ImageUploader.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { recordAttachment } from '@/actions/attachments'
import { useRouter } from 'next/navigation'

export function ImageUploader({ entityType, entityId }: {
  entityType: 'customer' | 'dealer'; entityId: string
}) {
  const supabase = createClient(); const router = useRouter()
  const [busy, setBusy] = useState(false)

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setBusy(false); return }
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${user.id}/${entityType}/${entityId}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('attachments').upload(path, file, { upsert: false })
    if (!error) await recordAttachment({ entity_type: entityType, entity_id: entityId, storage_path: path })
    setBusy(false); router.refresh()
  }

  return (
    <label className="inline-flex items-center justify-center rounded-xl border-2 border-dashed aspect-square cursor-pointer text-2xl opacity-70 hover:opacity-100">
      {busy ? '...' : '＋'}
      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPick} disabled={busy} />
    </label>
  )
}
```

- [ ] **Step 3: Commit** — `git add -A && git commit -m "feat: image uploader + attachments"`

---

### Task 5.7: หน้ารายละเอียดลูกค้า (แสดงทุกฟิลด์ + mood board + ลบ)

**Files:**
- Create: `src/app/(app)/customers/[id]/page.tsx`
- Create: `src/lib/attachments.ts` (helper ดึง signed URLs)

- [ ] **Step 1: helper ดึงรูป + signed url**

`src/lib/attachments.ts`:
```ts
import { createClient } from '@/lib/supabase/server'

export async function getAttachments(entityType: 'customer' | 'dealer', entityId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('attachments').select('*')
    .eq('entity_type', entityType).eq('entity_id', entityId).order('sort_order')
  const rows = data ?? []
  const withUrls = await Promise.all(rows.map(async (a) => {
    const { data: signed } = await supabase.storage.from('attachments').createSignedUrl(a.storage_path, 3600)
    return { ...a, url: signed?.signedUrl ?? '' }
  }))
  return withUrls
}
```

- [ ] **Step 2: หน้ารายละเอียด**

`src/app/(app)/customers/[id]/page.tsx`:
```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAttachments } from '@/lib/attachments'
import { ImageUploader } from '@/components/ImageUploader'
import { deleteCustomer } from '@/actions/customers'

export default async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: c } = await supabase.from('customers').select('*').eq('id', id).single()
  if (!c) notFound()
  const images = await getAttachments('customer', id)
  const Tag = ({ children }: { children: React.ReactNode }) =>
    <span className="bg-zinc-200 dark:bg-zinc-700 rounded-full px-3 py-1 text-sm">{children}</span>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{c.name}</h1>
        <Link href={`/customers/${id}/edit`} className="text-sm underline">แก้ไข</Link>
      </div>
      <div className="text-sm opacity-80 space-y-1">
        {c.phone && <div>📞 {c.phone}</div>}
        {c.line_id && <div>💬 {c.line_id}</div>}
        {c.project_name && <div>🏠 {c.project_name}</div>}
        {c.budget && <div>💰 {c.budget}</div>}
      </div>
      {!!c.style_tags?.length && <Section label="สไตล์ที่ชอบ"><div className="flex flex-wrap gap-2">{c.style_tags.map((t: string) => <Tag key={t}>{t}</Tag>)}</div></Section>}
      {!!c.color_material_tags?.length && <Section label="โทนสี/วัสดุ"><div className="flex flex-wrap gap-2">{c.color_material_tags.map((t: string) => <Tag key={t}>{t}</Tag>)}</div></Section>}
      {c.dislikes && <Section label="สิ่งที่ไม่ชอบ"><p className="text-red-600">{c.dislikes}</p></Section>}
      {!!c.rooms?.length && <Section label="ห้อง/พื้นที่"><div className="flex flex-wrap gap-2">{c.rooms.map((t: string) => <Tag key={t}>{t}</Tag>)}</div></Section>}
      <Section label="Mood board">
        <div className="grid grid-cols-4 gap-2">
          {images.map(img => <img key={img.id} src={img.url} alt="" className="aspect-square object-cover rounded-lg" />)}
          <ImageUploader entityType="customer" entityId={id} />
        </div>
      </Section>
      {c.notes && <Section label="โน้ต"><p className="whitespace-pre-wrap opacity-80">{c.notes}</p></Section>}
      <form action={deleteCustomer.bind(null, id)}>
        <button className="text-sm text-red-600 underline">ลบลูกค้านี้</button>
      </form>
    </div>
  )
}
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-xs uppercase opacity-50 mb-1">{label}</div>{children}</div>
}
```

- [ ] **Step 3: Commit** — `git add -A && git commit -m "feat: customer detail + mood board"`

---

# PHASE 6 — ฟีเจอร์ดีลเลอร์ (Dealers)

> โครงเหมือนลูกค้า ใช้ ChipInput/ImageUploader ซ้ำ + เพิ่มรายการสินค้า/ราคาของร้าน

### Task 6.1: Dealer actions

**Files:**
- Create: `src/actions/dealers.ts`

- [ ] **Step 1: เขียน actions**

`src/actions/dealers.ts`:
```ts
'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { dealerSchema } from '@/lib/validation'

function parse(formData: FormData) {
  return dealerSchema.parse({
    name: formData.get('name'),
    rating: formData.get('rating') || null,
    phone: formData.get('phone') || null,
    line_id: formData.get('line_id') || null,
    location_text: formData.get('location_text') || null,
    map_url: formData.get('map_url') || null,
    credit_terms: formData.get('credit_terms') || null,
    shipping_note: formData.get('shipping_note') || null,
    min_order: formData.get('min_order') || null,
    hours: formData.get('hours') || null,
    notes: formData.get('notes') || null,
    categories: formData.getAll('categories').map(String),
  })
}

export async function createDealer(formData: FormData) {
  const supabase = await createClient()
  const { data: row, error } = await supabase.from('dealers').insert(parse(formData)).select('id').single()
  if (error) throw new Error(error.message)
  revalidatePath('/dealers'); redirect(`/dealers/${row.id}`)
}
export async function updateDealer(id: string, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('dealers').update(parse(formData)).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/dealers/${id}`); redirect(`/dealers/${id}`)
}
export async function deleteDealer(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('dealers').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dealers'); redirect('/dealers')
}
```

- [ ] **Step 2: Commit** — `git add -A && git commit -m "feat: dealer actions"`

---

### Task 6.2: DealerForm

**Files:**
- Create: `src/components/DealerForm.tsx`

- [ ] **Step 1: เขียนฟอร์ม**

`src/components/DealerForm.tsx`:
```tsx
import { ChipInput } from '@/components/ui/ChipInput'
import type { Dealer } from '@/lib/types'

export function DealerForm({ action, defaultValue, submitLabel }: {
  action: (formData: FormData) => void; defaultValue?: Partial<Dealer>; submitLabel: string
}) {
  const d = defaultValue ?? {}
  const F = ({ name, label, defv, type = 'text' }: { name: string; label: string; defv?: string | number | null; type?: string }) => (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input name={name} type={type} defaultValue={defv ?? ''} className="w-full rounded-lg border px-3 py-2" />
    </div>
  )
  return (
    <form action={action} className="space-y-4">
      <F name="name" label="ชื่อร้าน *" defv={d.name} />
      <div className="grid grid-cols-2 gap-3">
        <F name="rating" label="ดาว (0-5)" defv={d.rating} type="number" />
        <F name="phone" label="เบอร์โทร" defv={d.phone} />
      </div>
      <F name="line_id" label="LINE" defv={d.line_id} />
      <ChipInput name="categories" label="ประเภทของที่ขาย" defaultValue={d.categories} placeholder="เช่น ไม้" />
      <F name="location_text" label="ที่ตั้ง/พื้นที่" defv={d.location_text} />
      <F name="map_url" label="ลิงก์แผนที่ (Google Maps)" defv={d.map_url} />
      <div className="grid grid-cols-2 gap-3">
        <F name="credit_terms" label="เครดิต" defv={d.credit_terms} />
        <F name="min_order" label="ขั้นต่ำ" defv={d.min_order} />
      </div>
      <F name="shipping_note" label="การจัดส่ง" defv={d.shipping_note} />
      <F name="hours" label="เวลาทำการ" defv={d.hours} />
      <div>
        <label className="block text-sm font-medium mb-1">โน้ต</label>
        <textarea name="notes" defaultValue={d.notes ?? ''} className="w-full rounded-lg border px-3 py-2" rows={3} />
      </div>
      <button className="w-full rounded-xl bg-indigo-600 text-white py-3 font-medium">{submitLabel}</button>
    </form>
  )
}
```

- [ ] **Step 2: Commit** — `git add -A && git commit -m "feat: DealerForm"`

---

### Task 6.3: หน้าเพิ่ม/แก้/รายชื่อดีลเลอร์

**Files:**
- Create: `src/app/(app)/dealers/new/page.tsx`
- Create: `src/app/(app)/dealers/[id]/edit/page.tsx`
- Create: `src/app/(app)/dealers/page.tsx`

- [ ] **Step 1: หน้าเพิ่ม**

`src/app/(app)/dealers/new/page.tsx`:
```tsx
import { DealerForm } from '@/components/DealerForm'
import { createDealer } from '@/actions/dealers'
export default function NewDealer() {
  return <div className="space-y-4"><h1 className="text-xl font-bold">เพิ่มดีลเลอร์</h1>
    <DealerForm action={createDealer} submitLabel="บันทึก" /></div>
}
```

- [ ] **Step 2: หน้าแก้**

`src/app/(app)/dealers/[id]/edit/page.tsx`:
```tsx
import { notFound } from 'next/navigation'
import { DealerForm } from '@/components/DealerForm'
import { updateDealer } from '@/actions/dealers'
import { createClient } from '@/lib/supabase/server'
export default async function EditDealer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('dealers').select('*').eq('id', id).single()
  if (!data) notFound()
  return <div className="space-y-4"><h1 className="text-xl font-bold">แก้ไขดีลเลอร์</h1>
    <DealerForm action={updateDealer.bind(null, id)} defaultValue={data} submitLabel="บันทึกการแก้ไข" /></div>
}
```

- [ ] **Step 3: หน้ารายชื่อ**

`src/app/(app)/dealers/page.tsx`:
```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SearchBar } from '@/components/ui/SearchBar'
import { EmptyState } from '@/components/ui/EmptyState'
export default async function DealersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const supabase = await createClient()
  let query = supabase.from('dealers').select('*').order('updated_at', { ascending: false })
  if (q) query = query.ilike('name', `%${q}%`)
  const { data: dealers } = await query
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">ดีลเลอร์</h1>
        <Link href="/dealers/new" className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm">➕ เพิ่ม</Link>
      </div>
      <SearchBar placeholder="ค้นหาชื่อร้าน..." />
      {!dealers?.length ? <EmptyState text="ยังไม่มีดีลเลอร์" ctaHref="/dealers/new" ctaLabel="เพิ่มร้านแรก" /> : (
        <ul className="space-y-2">{dealers.map(d => (
          <li key={d.id}><Link href={`/dealers/${d.id}`} className="block rounded-xl border p-4 hover:bg-black/5">
            <div className="font-medium">{d.name} {d.rating ? <span className="text-amber-500 text-sm">★ {d.rating}</span> : null}</div>
            <div className="text-sm opacity-70">{(d.categories ?? []).join(' · ')}</div>
          </Link></li>
        ))}</ul>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: dealer new/edit/list pages"`

---

### Task 6.4: หน้ารายละเอียดดีลเลอร์ (+ รายการสินค้า/ราคาล่าสุด + รูป + ลบ)

**Files:**
- Create: `src/app/(app)/dealers/[id]/page.tsx`

- [ ] **Step 1: เขียนหน้า — ดึงราคาล่าสุดของร้านนี้จาก view latest_prices + join items**

`src/app/(app)/dealers/[id]/page.tsx`:
```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAttachments } from '@/lib/attachments'
import { ImageUploader } from '@/components/ImageUploader'
import { deleteDealer } from '@/actions/dealers'
import { formatBaht, formatThaiDate } from '@/lib/format'

export default async function DealerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: d } = await supabase.from('dealers').select('*').eq('id', id).single()
  if (!d) notFound()
  const { data: prices } = await supabase
    .from('latest_prices').select('price, observed_at, item_id, items(name, unit)')
    .eq('dealer_id', id)
  const images = await getAttachments('dealer', id)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{d.name} {d.rating ? <span className="text-amber-500 text-base">★ {d.rating}</span> : null}</h1>
        <Link href={`/dealers/${id}/edit`} className="text-sm underline">แก้ไข</Link>
      </div>
      <div className="text-sm opacity-80 space-y-1">
        {d.phone && <div>📞 {d.phone}</div>}
        {d.line_id && <div>💬 {d.line_id}</div>}
        {d.location_text && <div>📍 {d.location_text} {d.map_url && <a href={d.map_url} target="_blank" className="text-indigo-600 underline">[แผนที่]</a>}</div>}
        {d.credit_terms && <div>💳 {d.credit_terms}</div>}
        {d.shipping_note && <div>🚚 {d.shipping_note}</div>}
        {d.hours && <div>🕐 {d.hours}</div>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase opacity-50">สินค้าที่ขาย (ราคาล่าสุด)</div>
          <Link href={`/prices/new?dealer=${id}`} className="text-sm text-indigo-600">＋ อัปเดตราคา</Link>
        </div>
        {!prices?.length ? <p className="text-sm opacity-60">ยังไม่มีสินค้า</p> : (
          <ul className="divide-y">
            {prices.map((p: any) => (
              <li key={p.item_id} className="flex justify-between py-2 text-sm">
                <Link href={`/compare/${p.item_id}`} className="underline">{p.items?.name}</Link>
                <span>{formatBaht(p.price)}/{p.items?.unit} <span className="opacity-50">· {formatThaiDate(p.observed_at)}</span></span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="text-xs uppercase opacity-50 mb-1">รูป (นามบัตร/ใบเสร็จ/หน้าร้าน)</div>
        <div className="grid grid-cols-4 gap-2">
          {images.map(img => <img key={img.id} src={img.url} alt="" className="aspect-square object-cover rounded-lg" />)}
          <ImageUploader entityType="dealer" entityId={id} />
        </div>
      </div>

      {d.notes && <div><div className="text-xs uppercase opacity-50 mb-1">โน้ต</div><p className="whitespace-pre-wrap opacity-80">{d.notes}</p></div>}
      <form action={deleteDealer.bind(null, id)}><button className="text-sm text-red-600 underline">ลบดีลเลอร์นี้</button></form>
    </div>
  )
}
```

- [ ] **Step 2: Commit** — `git add -A && git commit -m "feat: dealer detail + product price list"`

---

# PHASE 7 — สินค้า, ราคา, เทียบราคา

### Task 7.1: Item + Price actions

**Files:**
- Create: `src/actions/items.ts`
- Create: `src/actions/prices.ts`

- [ ] **Step 1: item actions (สร้าง/หาไอเท็ม)**

`src/actions/items.ts`:
```ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { itemSchema } from '@/lib/validation'

export async function createItem(input: { name: string; unit: string; category?: string | null }) {
  const supabase = await createClient()
  const data = itemSchema.parse(input)
  const { data: row, error } = await supabase.from('items').insert(data).select('*').single()
  if (error) throw new Error(error.message)
  return row
}
```

- [ ] **Step 2: price action (เพิ่มบันทึกราคาใหม่ = ประวัติ)**

`src/actions/prices.ts`:
```ts
'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { priceSchema } from '@/lib/validation'

export async function addPrice(formData: FormData) {
  const supabase = await createClient()
  const data = priceSchema.parse({
    item_id: formData.get('item_id'),
    dealer_id: formData.get('dealer_id'),
    price: formData.get('price'),
    observed_at: formData.get('observed_at'),
    note: formData.get('note') || null,
  })
  const { error } = await supabase.from('prices').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath(`/compare/${data.item_id}`)
  revalidatePath(`/dealers/${data.dealer_id}`)
  redirect(`/compare/${data.item_id}`)
}
```

- [ ] **Step 3: Commit** — `git add -A && git commit -m "feat: item + price actions"`

---

### Task 7.2: หน้าอัปเดตราคา (เลือกสินค้า/ร้าน + สร้างสินค้าใหม่ได้)

**Files:**
- Create: `src/app/(app)/prices/new/page.tsx`
- Create: `src/components/PriceForm.tsx`

- [ ] **Step 1: PriceForm (client — มีปุ่ม "สินค้าใหม่")**

`src/components/PriceForm.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { addPrice } from '@/actions/prices'
import { createItem } from '@/actions/items'
import type { Item, Dealer } from '@/lib/types'

export function PriceForm({ items, dealers, defaultDealerId }: {
  items: Item[]; dealers: Dealer[]; defaultDealerId?: string
}) {
  const [items2, setItems2] = useState(items)
  const [itemId, setItemId] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState(''); const [newUnit, setNewUnit] = useState('')

  const doCreateItem = async () => {
    if (!newName.trim() || !newUnit.trim()) return
    const row = await createItem({ name: newName.trim(), unit: newUnit.trim() })
    setItems2([row, ...items2]); setItemId(row.id); setCreating(false)
  }

  return (
    <form action={addPrice} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">สินค้า *</label>
        {!creating ? (
          <div className="flex gap-2">
            <select name="item_id" required value={itemId} onChange={e => setItemId(e.target.value)} className="flex-1 rounded-lg border px-3 py-2">
              <option value="">— เลือกสินค้า —</option>
              {items2.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
            </select>
            <button type="button" onClick={() => setCreating(true)} className="rounded-lg border px-3">＋ ใหม่</button>
          </div>
        ) : (
          <div className="space-y-2 border rounded-lg p-3">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="ชื่อสินค้า เช่น ไม้อัด 4มม" className="w-full rounded-lg border px-3 py-2" />
            <input value={newUnit} onChange={e => setNewUnit(e.target.value)} placeholder="หน่วย เช่น แผ่น" className="w-full rounded-lg border px-3 py-2" />
            <div className="flex gap-2">
              <button type="button" onClick={doCreateItem} className="rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm">สร้าง</button>
              <button type="button" onClick={() => setCreating(false)} className="text-sm underline">ยกเลิก</button>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">ดีลเลอร์ *</label>
        <select name="dealer_id" required defaultValue={defaultDealerId ?? ''} className="w-full rounded-lg border px-3 py-2">
          <option value="">— เลือกร้าน —</option>
          {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">ราคา (บาท) *</label>
          <input name="price" type="number" step="0.01" min="0" required className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">วันที่ *</label>
          <input name="observed_at" type="date" required className="w-full rounded-lg border px-3 py-2" />
        </div>
      </div>
      <input name="note" placeholder="โน้ต (ถ้ามี)" className="w-full rounded-lg border px-3 py-2" />
      <button className="w-full rounded-xl bg-indigo-600 text-white py-3 font-medium">บันทึกราคา</button>
    </form>
  )
}
```

- [ ] **Step 2: หน้าอัปเดตราคา (โหลด items/dealers ส่งให้ฟอร์ม)**

`src/app/(app)/prices/new/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { PriceForm } from '@/components/PriceForm'

export default async function NewPrice({ searchParams }: { searchParams: Promise<{ dealer?: string }> }) {
  const { dealer } = await searchParams
  const supabase = await createClient()
  const [{ data: items }, { data: dealers }] = await Promise.all([
    supabase.from('items').select('*').order('name'),
    supabase.from('dealers').select('*').order('name'),
  ])
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">อัปเดตราคา</h1>
      <PriceForm items={items ?? []} dealers={dealers ?? []} defaultDealerId={dealer} />
    </div>
  )
}
```

- [ ] **Step 3: Commit** — `git add -A && git commit -m "feat: update-price page + form"`

---

### Task 7.3: หน้ารายการสินค้า (เข้าเทียบราคา)

**Files:**
- Create: `src/app/(app)/compare/page.tsx`

- [ ] **Step 1: เขียนหน้า**

`src/app/(app)/compare/page.tsx`:
```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SearchBar } from '@/components/ui/SearchBar'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const supabase = await createClient()
  let query = supabase.from('items').select('*').order('name')
  if (q) query = query.ilike('name', `%${q}%`)
  const { data: items } = await query
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">เทียบราคา</h1>
        <Link href="/prices/new" className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm">💰 อัปเดตราคา</Link>
      </div>
      <SearchBar placeholder="ค้นหาสินค้า..." />
      {!items?.length ? <EmptyState text="ยังไม่มีสินค้า" ctaHref="/prices/new" ctaLabel="เพิ่มราคาสินค้าแรก" /> : (
        <ul className="space-y-2">{items.map(i => (
          <li key={i.id}><Link href={`/compare/${i.id}`} className="block rounded-xl border p-4 hover:bg-black/5">
            <span className="font-medium">{i.name}</span> <span className="text-sm opacity-60">/{i.unit}</span>
          </Link></li>
        ))}</ul>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit** — `git add -A && git commit -m "feat: compare item list"`

---

### Task 7.4: หน้าเทียบราคาต่อสินค้า (ใช้ buildComparison) + ประวัติ

**Files:**
- Create: `src/app/(app)/compare/[itemId]/page.tsx`

- [ ] **Step 1: เขียนหน้า — ดึง prices ทั้งหมดของ item + join dealer แล้วส่งเข้า buildComparison**

`src/app/(app)/compare/[itemId]/page.tsx`:
```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buildComparison, type PriceInput } from '@/lib/compare'
import { formatBaht, formatThaiDate } from '@/lib/format'

export default async function CompareDetail({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params
  const supabase = await createClient()
  const { data: item } = await supabase.from('items').select('*').eq('id', itemId).single()
  if (!item) notFound()
  const { data: rows } = await supabase
    .from('prices').select('price, observed_at, dealer_id, dealers(name)')
    .eq('item_id', itemId)
    .order('observed_at', { ascending: true })

  const input: PriceInput[] = (rows ?? []).map((r: any) => ({
    dealerId: r.dealer_id, dealerName: r.dealers?.name ?? '—',
    price: Number(r.price), observedAt: r.observed_at,
  }))
  const cmp = buildComparison(input)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{item.name} <span className="text-sm opacity-60">/{item.unit}</span></h1>
        <Link href={`/prices/new`} className="text-sm text-indigo-600">＋ อัปเดตราคา</Link>
      </div>

      {!cmp.rows.length ? <p className="opacity-60">ยังไม่มีราคา</p> : (
        <>
          <ul className="space-y-2">
            {cmp.rows.map(r => (
              <li key={r.dealerId} className={`rounded-xl border p-3 flex justify-between items-center ${r.isCheapest ? 'border-green-500 bg-green-500/10' : ''}`}>
                <Link href={`/dealers/${r.dealerId}`} className="font-medium underline">
                  {r.dealerName} {r.isCheapest && <span className="text-green-600 text-xs">● ถูกสุด</span>}
                </Link>
                <div className="text-right">
                  <div className={`font-bold ${r.isCheapest ? 'text-green-600' : ''}`}>{formatBaht(r.price)}<span className="text-xs opacity-60">/{item.unit}</span></div>
                  <div className="text-xs opacity-50">{formatThaiDate(r.observedAt)}</div>
                </div>
              </li>
            ))}
          </ul>
          {cmp.maxDiff > 0 && (
            <div className="rounded-xl bg-zinc-100 dark:bg-zinc-800 p-3 text-sm">
              💡 ต่างกันสูงสุด <b>{formatBaht(cmp.maxDiff)}</b>/{item.unit} — เลือกเจ้าถูกสุดช่วยประหยัด
            </div>
          )}
          <PriceHistory rows={input} />
        </>
      )}
    </div>
  )
}

function PriceHistory({ rows }: { rows: PriceInput[] }) {
  const byDealer = new Map<string, PriceInput[]>()
  rows.forEach(r => { const a = byDealer.get(r.dealerName) ?? []; a.push(r); byDealer.set(r.dealerName, a) })
  return (
    <div>
      <div className="text-xs uppercase opacity-50 mb-2">ประวัติราคา</div>
      <div className="space-y-3">
        {[...byDealer.entries()].map(([name, list]) => (
          <div key={name}>
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs opacity-70 flex flex-wrap gap-x-3">
              {list.map((p, i) => <span key={i}>{formatThaiDate(p.observedAt)}: {formatBaht(p.price)}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit** — `git add -A && git commit -m "feat: price comparison detail + history"`

---

# PHASE 8 — Settings, polish, README, deploy

### Task 8.1: หน้า Settings (ออกจากระบบ)

**Files:**
- Create: `src/app/(app)/settings/page.tsx`

- [ ] **Step 1: เขียนหน้า**

`src/app/(app)/settings/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/actions/auth'

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
```

- [ ] **Step 2: Commit** — `git add -A && git commit -m "feat: settings page"`

---

### Task 8.2: ตรวจ build + lint รวม

- [ ] **Step 1: รัน test + build**

```bash
cd /d/nOW && npm test && npm run build
```
Expected: tests ผ่านทั้งหมด + build สำเร็จ (แก้ error ที่เจอจน clean)

- [ ] **Step 2: Commit ถ้ามีแก้** — `git add -A && git commit -m "fix: build/lint cleanups"`

---

### Task 8.3: README + คู่มือ setup Supabase & Vercel

**Files:**
- Create: `README.md`

- [ ] **Step 1: เขียน README พร้อมขั้นตอน setup**

`README.md`:
````markdown
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
````

- [ ] **Step 2: Commit** — `git add README.md && git commit -m "docs: readme + setup guide"`

---

### Task 8.4: Deploy จริง (ผู้ใช้ทำตามคู่มือ / หรือผ่าน Vercel MCP)

- [ ] **Step 1:** ผู้ใช้สมัคร Supabase + รัน SQL + ใส่ env ตาม README แล้วทดสอบ `npm run dev` ว่า login + เพิ่มลูกค้า/ดีลเลอร์/ราคา + เทียบราคา ทำงานครบ (ตรงเกณฑ์ความสำเร็จใน spec)
- [ ] **Step 2:** push GitHub + deploy Vercel (หรือใช้ Vercel MCP `deploy_to_vercel`)
- [ ] **Step 3:** ทดสอบบนมือถือจริง + ติดตั้งเป็นแอป

---

## Self-Review (ผู้เขียนแผนตรวจกับ spec)

**ครอบคลุม spec:**
- §2 ขอบเขต/ผู้ใช้คนเดียว → Auth (P3), RLS (1.1) ✓
- §4 Data model (customers/dealers/items/prices/attachments/view) → 1.1 ✓
- §5 logic เทียบราคา (latest per dealer, ถูกสุด, maxDiff, history) → 2.1 + 7.4 ✓
- §6 หน้าจอทั้ง 12 → P3–P8 ครบ (login, home, customers CRUD, dealers CRUD, compare list/detail, prices/new, settings) ✓
- §7 Auth & RLS + storage policy → 1.1 + P3 ✓
- §9 responsive + PWA + Thai + image compress → 0.4, 4.1, 4.3, ImageUploader (หมายเหตุ: บีบรูปเป็น nice-to-have; ใส่ภายหลังได้ถ้าจำเป็น) ✓ (partial: image compression เลื่อนเป็น polish)
- §10 success criteria → ตรวจใน 8.2/8.4 ✓

**Placeholder scan:** ไอคอน PWA เป็น placeholder (ระบุชัดว่าให้แทนภายหลัง) — ยอมรับได้; ไม่มี TODO อื่นในโค้ด

**Type consistency:** `buildComparison`/`PriceInput`/`ComparisonRow` ใช้ตรงกันใน 2.1 และ 7.4; types ใน 1.4 ใช้ตรงทุกฟอร์ม ✓

**หมายเหตุ/ความเสี่ยงที่ทราบ:**
- `latest_prices` view ใน detail ของ dealer ใช้ join `items(name,unit)` — ต้องมั่นใจว่า Supabase อนุญาต embed ผ่าน FK (มี FK item_id อยู่แล้ว) ✓
- การบีบขนาดรูปก่อนอัปโหลด (browser-image-compression) เป็นงาน polish เฟสหลัง

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-30-designdeck.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — แตก subagent ใหม่ต่อ 1 task, รีวิวระหว่าง task, วนเร็ว

**2. Inline Execution** — ทำในเซสชันนี้ทีละเฟส มี checkpoint ให้รีวิว

**เลือกแบบไหนครับ?**
