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
