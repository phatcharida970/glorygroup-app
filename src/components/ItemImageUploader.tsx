'use client'
import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ImgItem { id: string; url: string }

export function ItemImageUploader({ itemId, images }: { itemId: string; images: ImgItem[] }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [localImgs, setLocalImgs] = useState<ImgItem[]>(images)
  const [errMsg, setErrMsg] = useState('')

  if (!itemId) {
    return <div className="pl-7 text-xs text-amber-600 mt-1">⏳ กดบันทึกก่อนอัปรูป</div>
  }

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setErrMsg('')
    setBusy(true)

    try {
      const supabase = createClient()

      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) throw new Error('ยังไม่ได้ login')

      // อัปโหลดไฟล์ขึ้น Storage
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${user.id}/project_item/${itemId}/${crypto.randomUUID()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('attachments')
        .upload(path, file, { upsert: false })
      if (uploadErr) throw new Error('อัปโหลดไม่สำเร็จ: ' + uploadErr.message)

      // บันทึก metadata ลง DB โดยตรง (ไม่ผ่าน server action)
      const { error: dbErr } = await supabase.from('attachments').insert({
        entity_type: 'project_item',
        entity_id: itemId,
        storage_path: path,
      })
      if (dbErr) throw new Error('บันทึก DB ไม่สำเร็จ: ' + dbErr.message)

      // สร้าง signed URL แสดงรูปทันที
      const { data: signed } = await supabase.storage
        .from('attachments')
        .createSignedUrl(path, 3600)
      if (signed?.signedUrl) {
        setLocalImgs(p => [...p, { id: path, url: signed.signedUrl }])
      }
    } catch (err: unknown) {
      setErrMsg(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pl-7 space-y-1 mt-1">
      <div className="text-xs opacity-50">📎 บิล/ใบเสร็จ</div>
      <div className="flex flex-wrap gap-2 items-center">
        {localImgs.map(img => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={img.id} src={img.url} alt="" className="h-16 w-16 object-cover rounded-lg border" />
        ))}
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="h-16 w-16 flex items-center justify-center rounded-lg border-2 border-dashed text-xl opacity-60 hover:opacity-100 active:opacity-80 disabled:opacity-30"
        >
          {busy ? <span className="text-xs animate-pulse">...</span> : '＋'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onPick}
          disabled={busy}
        />
      </div>
      {errMsg && (
        <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{errMsg}</p>
      )}
    </div>
  )
}
