# DesignDeck — Design Spec

> เอกสารออกแบบ (Spec) สำหรับโปรแกรมผู้ช่วยสถาปนิก/นักออกแบบภายใน
> วันที่: 2026-05-30 · สถานะ: อนุมัติแล้ว (รอ implement)

---

## 1. ภาพรวม (Overview)

**DesignDeck** คือเว็บแอปส่วนตัวสำหรับสถาปนิก/นักออกแบบภายใน ช่วย "กันลืม" 2 เรื่องหลัก:

1. **ความชอบด้านดีไซน์ของลูกค้าแต่ละคน** — สไตล์ สี วัสดุ สิ่งที่ไม่ชอบ งบ ห้อง พร้อมรูป mood board
2. **ราคาของจากดีลเลอร์หลายเจ้า** — จดราคา เปรียบเทียบหาเจ้าที่ถูกสุด และเก็บประวัติราคา

ใช้ได้ทั้งมือถือและเดสก์ท็อปผ่านเว็บเดียว ติดตั้งเป็นแอปบนมือถือได้ (PWA) และ deploy ขึ้น Vercel ได้

**Working name:** DesignDeck (เปลี่ยนได้ภายหลัง)

---

## 2. ผู้ใช้และขอบเขต (Users & Scope)

- **ผู้ใช้:** คนเดียว (เจ้าของ) — ล็อกอินบัญชีเดียว ใช้ได้ทุกอุปกรณ์ ข้อมูลซิงค์กันผ่านคลาวด์
- **ภาษา:** ไทย (สกุลเงินบาท)
- **อุปกรณ์:** มือถือ (เน้น) + เดสก์ท็อป — responsive, mobile-first
- **การเชื่อมต่อ:** ใช้ตอนออนไลน์ (เน็ตมือถือปกติพอ); ออฟไลน์เต็มรูปแบบเป็น v2

### อยู่ในขอบเขต v1
- จัดการลูกค้า (เพิ่ม/แก้/ลบ/ค้นหา) พร้อมฟิลด์ความชอบครบและ mood board หลายรูป
- จัดการดีลเลอร์ (เพิ่ม/แก้/ลบ/ค้นหา) พร้อมรายการสินค้า+ราคา และรูป
- ระบบสินค้า (items) + ราคา (prices) แบบเก็บประวัติ
- หน้าเทียบราคาต่อสินค้า: ราคาล่าสุดของแต่ละดีลเลอร์ เรียงถูก→แพง ไฮไลต์ถูกสุด + ดูประวัติราคา
- อัปโหลด/ถ่ายรูปแนบจากมือถือ
- ล็อกอิน (Google + อีเมล)
- ติดตั้งเป็นแอป (PWA)
- Deploy ขึ้น Vercel

### นอกขอบเขต v1 (ไว้ทีหลัง — YAGNI)
- ใช้งานออฟไลน์เต็มรูปแบบ + ซิงค์ย้อนหลัง (v2)
- ระบบทีม/หลายผู้ใช้ (v2)
- ออกใบเสนอราคา / ใบสั่งซื้อ / ใบเสร็จ
- แปลงหน่วยอัตโนมัติข้ามขนาดแพ็ก (เช่น 1L vs 5L)
- รายงาน/แดชบอร์ดสถิติขั้นสูง

---

## 3. สถาปัตยกรรม (Architecture)

```
┌─────────────────────────────────────────────┐
│  Browser (มือถือ/เดสก์ท็อป) — PWA installable │
│  Next.js (App Router) + React + Tailwind CSS  │
└───────────────┬─────────────────────────────┘
                │ @supabase/ssr (cookie auth)
                ▼
┌─────────────────────────────────────────────┐
│                  Supabase                     │
│  • Postgres (ข้อมูลทั้งหมด + RLS)             │
│  • Auth (Google OAuth + Email)                │
│  • Storage (รูป mood board / รูปร้าน)         │
└─────────────────────────────────────────────┘

Deploy: Vercel (Next.js) + Supabase (managed)
```

### Tech stack
- **Framework:** Next.js (App Router) + TypeScript
- **UI:** Tailwind CSS, mobile-first, ปุ่มขนาดใหญ่เหมาะกับการแตะ
- **Backend/Data:** Supabase — Postgres + Auth + Storage
- **Client libs:** `@supabase/supabase-js`, `@supabase/ssr`
- **Validation:** `zod`
- **Testing:** Vitest (unit tests สำหรับ logic หลัก เช่น การคำนวณเทียบราคา)
- **PWA:** manifest + service worker (app-shell caching)
- **Deploy:** Vercel

### รูปแบบการเข้าถึงข้อมูล
- **อ่าน (reads):** React Server Components เรียก Supabase ฝั่ง server
- **เขียน (mutations):** Server Actions (เพิ่ม/แก้/ลบ) + revalidate
- **อัปโหลดรูป:** ฝั่ง client เรียก Supabase Storage ด้วย session ของผู้ใช้ แล้วบันทึก path ลงตาราง `attachments`

---

## 4. โครงสร้างข้อมูล (Data Model)

ทุกตารางมี `owner_id uuid` (= `auth.uid()`) และเปิด **RLS**: เจ้าของเห็น/แก้เฉพาะแถวของตัวเอง
ทุกตารางมี `created_at timestamptz default now()`; ตารางที่แก้ได้มี `updated_at` (อัปเดตด้วย trigger)

### 4.1 `customers`
| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| id | uuid PK | `gen_random_uuid()` |
| owner_id | uuid | FK → auth.users, default `auth.uid()` |
| name | text NOT NULL | ชื่อลูกค้า |
| phone | text | เบอร์โทร |
| line_id | text | LINE |
| project_name | text | ชื่อโปรเจกต์/งาน |
| address | text | ที่อยู่หน้างาน |
| budget | text | งบ (free text เช่น "~1.2 ลบ.") |
| style_tags | text[] | สไตล์ที่ชอบ |
| color_material_tags | text[] | โทนสี/วัสดุที่ชอบ |
| dislikes | text | สิ่งที่ไม่ชอบ/ห้ามใช้ |
| rooms | text[] | ห้อง/พื้นที่ในงาน |
| notes | text | โน้ตอิสระ |

### 4.2 `dealers`
| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| owner_id | uuid | |
| name | text NOT NULL | ชื่อร้าน |
| rating | numeric(2,1) | 0–5 (ดาว) |
| categories | text[] | ประเภทของที่ขาย |
| phone | text | |
| line_id | text | |
| location_text | text | พื้นที่/ที่ตั้ง |
| map_url | text | ลิงก์ Google Maps |
| credit_terms | text | เครดิตกี่วัน |
| shipping_note | text | เงื่อนไขส่ง (เช่น ส่งฟรี >5,000฿) |
| min_order | text | ขั้นต่ำ |
| hours | text | เวลาทำการ |
| notes | text | โน้ต |

### 4.3 `items` (สินค้า/วัสดุที่จะเทียบราคา)
| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| owner_id | uuid | |
| name | text NOT NULL | ชื่อสินค้า เช่น "ไม้อัดยาง 4มม 1.2×2.4" |
| unit | text NOT NULL | หน่วย เช่น แผ่น/ลิตร/แกลลอน/กล่อง/เมตร/ตร.ม. |
| category | text | หมวด (เช่น ไม้, สี) |
| notes | text | |

> เทียบราคาได้เฉพาะ "สินค้าเดียวกัน (item เดียวกัน)" ซึ่งมีหน่วยเดียว ทำให้ราคาเทียบกันได้ตรงๆ

### 4.4 `prices` (บันทึกราคา — เก็บประวัติ)
| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| owner_id | uuid | |
| item_id | uuid | FK → items, ON DELETE CASCADE |
| dealer_id | uuid | FK → dealers, ON DELETE CASCADE |
| price | numeric(12,2) NOT NULL | ราคาต่อ 1 หน่วยของ item |
| observed_at | date NOT NULL | วันที่เห็นราคานี้ default `current_date` |
| note | text | เช่น "ราคาโปร" |

- Index: `(item_id, dealer_id, observed_at DESC, created_at DESC)` — เพื่อหาราคาล่าสุดเร็ว
- การจดราคาใหม่ = insert แถวใหม่เสมอ (ไม่ทับของเก่า) → ได้ประวัติ

### 4.5 `attachments` (รูปภาพ)
| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| id | uuid PK | |
| owner_id | uuid | |
| entity_type | text | CHECK IN ('customer','dealer') |
| entity_id | uuid NOT NULL | id ของลูกค้า/ดีลเลอร์ |
| storage_path | text NOT NULL | path ใน Supabase Storage |
| caption | text | คำบรรยาย |
| sort_order | int DEFAULT 0 | ลำดับการแสดง |

- **Storage bucket:** `attachments` (private) — RLS ให้เจ้าของอ่าน/เขียนไฟล์ตัวเอง
- **Path convention:** `{owner_id}/{entity_type}/{entity_id}/{uuid}.{ext}`
- แสดงรูปด้วย signed URL

### 4.6 View: `latest_prices` (ช่วยเทียบราคา + รายการสินค้าของร้าน)
```sql
-- ราคาล่าสุดต่อ (item, dealer)
SELECT DISTINCT ON (item_id, dealer_id)
  item_id, dealer_id, price, observed_at, id
FROM prices
ORDER BY item_id, dealer_id, observed_at DESC, created_at DESC;
```
(RLS ของ `prices` มีผลกับ view โดยปริยาย)

---

## 5. Logic หลัก: การเทียบราคา (Price Comparison)

ฟังก์ชันบริสุทธิ์ (pure function) ที่ทดสอบได้ — input คือรายการราคาของ item หนึ่ง, output คือรายการเทียบ:

**Input:** `PriceRow[]` = `{ dealerId, dealerName, price, observedAt }[]` (ทุกแถวของ item นี้)

**ขั้นตอน:**
1. จัดกลุ่มตาม `dealerId` แล้วเลือกเฉพาะแถวที่ `observedAt` ใหม่สุด (tie-break ด้วย created order) → "ราคาล่าสุดต่อร้าน"
2. เรียงจากราคาน้อย→มาก
3. ทำเครื่องหมายแถวที่ราคาต่ำสุด = `isCheapest = true` (ถ้าเท่ากันหลายเจ้า ให้ถูกสุดทุกเจ้า)
4. คำนวณ `maxDiff = maxPrice − minPrice` (ส่วนต่างสูงสุด)

**Output:** `{ rows: ComparisonRow[], cheapestPrice, maxDiff }`
โดย `ComparisonRow = { dealerId, dealerName, price, observedAt, isCheapest }`

**ประวัติราคา (history):** สำหรับ (item, dealer) หนึ่งคู่ = ราคาทุกแถวเรียงตามวันที่ → แสดงเป็นรายการ + ตัวบ่งชี้แนวโน้ม (ขึ้น/ลง) เทียบ 2 ค่าล่าสุด

> ฟังก์ชันนี้แยกจาก DB ชัดเจน → เป็นเป้าหมายหลักของ **unit test (TDD)**

---

## 6. หน้าจอและการนำทาง (Screens & Navigation)

### การนำทาง
- **มือถือ:** แถบล่าง (bottom tab) 4 เมนู — หน้าแรก · ลูกค้า · ดีลเลอร์ · เทียบราคา + ปุ่มลอย (FAB) เพิ่มข้อมูลเร็ว
- **เดสก์ท็อป:** แถบข้าง (sidebar) เมนูเดียวกัน

### รายการหน้าจอ
1. **ล็อกอิน** — ปุ่ม "เข้าด้วย Google" + ทางเลือกอีเมล
2. **หน้าแรก (Home)** — ช่องค้นหารวม + ปุ่มลัด (เพิ่มลูกค้า/เพิ่มดีลเลอร์/อัปเดตราคา/เทียบราคา) + รายการที่เพิ่งดู
3. **ลูกค้า — รายชื่อ** — ค้นหา + การ์ดรายชื่อ (ชื่อ, สไตล์, รูป)
4. **ลูกค้า — รายละเอียด** — ฟิลด์ความชอบครบ + mood board (ดู/เพิ่ม/ลบรูป) + ปุ่มแก้ไข
5. **ลูกค้า — ฟอร์มเพิ่ม/แก้** — ฟิลด์ทั้งหมด (แท็กแบบ chip input)
6. **ดีลเลอร์ — รายชื่อ** — ค้นหา + การ์ด (ชื่อ, ดาว, ประเภท)
7. **ดีลเลอร์ — รายละเอียด** — ข้อมูลร้าน + รายการสินค้า/ราคาล่าสุด + ปุ่ม "อัปเดตราคา" + รูป
8. **ดีลเลอร์ — ฟอร์มเพิ่ม/แก้**
9. **เทียบราคา — รายการสินค้า** — ค้นหาสินค้า → เลือก
10. **เทียบราคา — รายละเอียดสินค้า** — ตารางเทียบ (เรียงถูก→แพง, ไฮไลต์ถูกสุด, ส่วนต่าง) + ประวัติราคาต่อร้าน
11. **อัปเดตราคา** — เลือกสินค้า (หรือสร้างใหม่) + เลือกดีลเลอร์ (หรือสร้างใหม่) + ราคา + วันที่ → บันทึก
12. **ตั้งค่า** — โปรไฟล์ + ออกจากระบบ

---

## 7. Auth & Security

- **Supabase Auth:** เปิด Google provider + Email/Password
- ทุก request ฝั่ง server ใช้ `@supabase/ssr` อ่าน session จาก cookie
- หน้าแอปทั้งหมดอยู่หลัง auth guard (ยังไม่ล็อกอิน → เด้งไปหน้า login)
- **RLS** ทุกตาราง: `owner_id = auth.uid()` สำหรับ select/insert/update/delete
- Storage bucket แบบ private + policy ตาม `owner_id` (โฟลเดอร์แรกของ path = owner_id)

---

## 8. ข้อกำหนดที่ผู้ใช้ต้องตั้งค่า (Setup Requirements)

ตอน implement/deploy ผู้ใช้ต้องทำ (จะมีคู่มือทีละขั้น):
1. สมัคร Supabase (ฟรี) + สร้างโปรเจกต์
2. รัน SQL schema (มีให้ใน repo: `supabase/migrations/`)
3. เปิด Google OAuth provider ใน Supabase (+ ตั้งค่า redirect URL)
4. สร้าง Storage bucket `attachments`
5. ใส่ env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. สมัคร Vercel + เชื่อม repo + ใส่ env vars + deploy

---

## 9. Non-functional Requirements

- **Responsive:** ใช้ดีตั้งแต่จอ ~360px (มือถือ) ถึงเดสก์ท็อป
- **PWA:** ติดตั้งได้, มี manifest + icons, cache app shell
- **Performance:** หน้าโหลดเร็ว ใช้ RSC ลด JS ฝั่ง client
- **ความปลอดภัย:** ข้อมูลทั้งหมดป้องกันด้วย RLS; ไม่มีข้อมูลรั่วข้ามผู้ใช้
- **ภาษา/รูปแบบ:** ไทย, วันที่แบบไทย, เงินบาท (`฿`)
- **รูปภาพ:** อัปโหลดจากกล้อง/แกลเลอรีบนมือถือได้; บีบขนาดก่อนอัปโหลดเพื่อประหยัด

---

## 10. เกณฑ์ความสำเร็จ (Success Criteria)

ถือว่า v1 สำเร็จเมื่อ:
1. ล็อกอิน/ออกจากระบบได้ และเห็นเฉพาะข้อมูลตัวเอง
2. เพิ่ม/แก้/ลบ/ค้นหา **ลูกค้า** ได้ครบทุกฟิลด์ + แนบ/ลบรูป mood board ได้
3. เพิ่ม/แก้/ลบ/ค้นหา **ดีลเลอร์** ได้ + แนบรูปได้
4. เพิ่ม **สินค้า + ราคา** ได้ และจดราคาซ้ำเพื่อสร้างประวัติได้
5. หน้า **เทียบราคา** แสดงราคาล่าสุดของแต่ละร้าน เรียงถูก→แพง ไฮไลต์ถูกสุด และดูประวัติได้
6. ใช้งานได้ลื่นทั้งมือถือและเดสก์ท็อป + ติดตั้งเป็นแอปได้
7. Deploy ขึ้น Vercel แล้วใช้งานจริงได้
8. unit test ของ logic เทียบราคา ผ่านครบ

---

## 11. โครงสร้างโปรเจกต์ (เบื้องต้น)

```
designdeck/
├── src/
│   ├── app/                  # Next.js App Router (หน้าจอ)
│   │   ├── (auth)/login/
│   │   ├── (app)/            # หลัง auth: home, customers, dealers, compare, prices, settings
│   │   └── layout.tsx
│   ├── components/           # UI ที่ใช้ซ้ำ (การ์ด, ฟอร์ม, chip input, nav, image uploader)
│   ├── lib/
│   │   ├── supabase/         # client/server factories (@supabase/ssr)
│   │   ├── compare.ts        # ★ logic เทียบราคา (pure, มี test)
│   │   ├── validation.ts     # zod schemas
│   │   └── types.ts          # types ของข้อมูล
│   ├── actions/              # Server Actions (CRUD)
│   └── tests/                # Vitest
├── supabase/migrations/      # SQL schema + RLS + view + triggers
├── public/                   # manifest, icons, service worker
├── .env.example
└── package.json
```

---

## 12. ความเสี่ยง/ข้อควรระวัง

- **การตั้งค่า Supabase/OAuth** เป็นขั้นที่ผู้ใช้ต้องทำเอง → ต้องมีคู่มือชัดเจน และแอปต้องขึ้น error ที่อ่านเข้าใจได้เมื่อ env ยังไม่ครบ
- **ความสม่ำเสมอของชื่อ item** — ถ้าผู้ใช้พิมพ์ชื่อสินค้าต่างกันเล็กน้อยจะเทียบกันไม่ติด → ฟอร์มอัปเดตราคาควรให้ "เลือกจากที่มีอยู่ก่อน" และมี autocomplete
- **ขนาดรูป** — ต้องบีบก่อนอัปโหลดเพื่อไม่ให้เปลือง storage/แบนด์วิดท์
