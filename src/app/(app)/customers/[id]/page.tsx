export const dynamic = 'force-dynamic'

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
          {images.map(img => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={img.id} src={img.url} alt="" className="aspect-square object-cover rounded-lg" />
          ))}
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
