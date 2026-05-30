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
