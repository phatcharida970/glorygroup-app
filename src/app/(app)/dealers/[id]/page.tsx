export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAttachments } from '@/lib/attachments'
import { ImageUploader } from '@/components/ImageUploader'
import { deleteDealer } from '@/actions/dealers'
import { formatBaht, formatThaiDate } from '@/lib/format'
import { BackButton } from '@/components/ui/BackButton'

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
      <BackButton href="/dealers" />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">
          {d.name} {d.rating ? <span className="text-amber-500 text-base">★ {d.rating}</span> : null}
        </h1>
        <Link href={`/dealers/${id}/edit`} className="text-sm underline">แก้ไข</Link>
      </div>
      <div className="text-sm opacity-80 space-y-1">
        {d.phone && <div>📞 {d.phone}</div>}
        {d.line_id && <div>💬 {d.line_id}</div>}
        {d.location_text && (
          <div>
            📍 {d.location_text}{' '}
            {d.map_url && <a href={d.map_url} target="_blank" className="text-indigo-600 underline">[แผนที่]</a>}
          </div>
        )}
        {d.credit_terms && <div>💳 {d.credit_terms}</div>}
        {d.shipping_note && <div>🚚 {d.shipping_note}</div>}
        {d.hours && <div>🕐 {d.hours}</div>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase opacity-50">สินค้าที่ขาย (ราคาล่าสุด)</div>
          <Link href={`/prices/new?dealer=${id}`} className="text-sm text-indigo-600">＋ อัปเดตราคา</Link>
        </div>
        {!prices?.length ? (
          <p className="text-sm opacity-60">ยังไม่มีสินค้า</p>
        ) : (
          <ul className="divide-y">
            {prices.map((p: any) => (
              <li key={p.item_id} className="flex justify-between py-2 text-sm">
                <Link href={`/compare/${p.item_id}`} className="underline">{p.items?.name}</Link>
                <span>
                  {formatBaht(p.price)}/{p.items?.unit}{' '}
                  <span className="opacity-50">· {formatThaiDate(p.observed_at)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="text-xs uppercase opacity-50 mb-1">รูป (นามบัตร/ใบเสร็จ/หน้าร้าน)</div>
        <div className="grid grid-cols-4 gap-2">
          {images.map(img => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={img.id} src={img.url} alt="" className="aspect-square object-cover rounded-lg" />
          ))}
          <ImageUploader entityType="dealer" entityId={id} />
        </div>
      </div>

      {d.notes && (
        <div>
          <div className="text-xs uppercase opacity-50 mb-1">โน้ต</div>
          <p className="whitespace-pre-wrap opacity-80">{d.notes}</p>
        </div>
      )}
      <form action={deleteDealer.bind(null, id)}>
        <button className="text-sm text-red-600 underline">ลบดีลเลอร์นี้</button>
      </form>
    </div>
  )
}
