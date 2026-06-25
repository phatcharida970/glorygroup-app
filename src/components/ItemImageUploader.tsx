'use client'
import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'

interface ImgItem { id: string; url: string; storagePath?: string }

export function ItemImageUploader({ itemId, images }: { itemId: string; images: ImgItem[] }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [localImgs, setLocalImgs] = useState<ImgItem[]>(images)
  const [errMsg, setErrMsg] = useState('')
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

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
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${user.id}/project_item/${itemId}/${crypto.randomUUID()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('attachments').upload(path, file, { upsert: false })
      if (uploadErr) throw new Error('อัปโหลดไม่สำเร็จ: ' + uploadErr.message)
      const { error: dbErr } = await supabase.from('attachments').insert({
        entity_type: 'project_item', entity_id: itemId, storage_path: path,
      })
      if (dbErr) throw new Error('บันทึก DB ไม่สำเร็จ: ' + dbErr.message)
      const { data: signed } = await supabase.storage
        .from('attachments').createSignedUrl(path, 3600)
      if (signed?.signedUrl) {
        setLocalImgs(p => [...p, { id: path, url: signed.signedUrl, storagePath: path }])
      }
    } catch (err: unknown) {
      setErrMsg(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setBusy(false)
    }
  }

  const deleteImg = async (img: ImgItem) => {
    const sp = img.storagePath ?? img.id
    setDeletingId(img.id)
    try {
      const supabase = createClient()
      await supabase.storage.from('attachments').remove([sp])
      await supabase.from('attachments').delete().eq('storage_path', sp)
      setLocalImgs(p => p.filter(i => i.id !== img.id))
    } catch {
      setErrMsg('ลบรูปไม่สำเร็จ')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="pl-7 space-y-1 mt-1">
        <div className="text-xs opacity-50">📎 บิล/ใบเสร็จ</div>
        <div className="flex flex-wrap gap-2 items-center">
          {localImgs.map(img => (
            <div key={img.id} className="relative group h-16 w-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url} alt=""
                onClick={() => setLightbox(img.url)}
                className="h-16 w-16 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
              />
              <button
                type="button"
                onClick={() => deleteImg(img)}
                disabled={deletingId === img.id}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-50"
              >
                {deletingId === img.id ? '…' : '×'}
              </button>
            </div>
          ))}
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="h-16 w-16 flex items-center justify-center rounded-lg border-2 border-dashed text-xl opacity-60 hover:opacity-100 active:opacity-80 disabled:opacity-30 cursor-pointer"
          >
            {busy ? <span className="text-xs animate-pulse">...</span> : '＋'}
          </button>
          <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={onPick} disabled={busy} />
        </div>
        {errMsg && <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{errMsg}</p>}
      </div>

      {mounted && lightbox && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white text-3xl leading-none cursor-pointer hover:opacity-70"
          >×</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox} alt=""
            onClick={e => e.stopPropagation()}
            className="max-w-full max-h-[90vh] rounded-xl object-contain"
          />
        </div>,
        document.body
      )}
    </>
  )
}
