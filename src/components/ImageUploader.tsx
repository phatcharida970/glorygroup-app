'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { recordAttachment } from '@/actions/attachments'
import { useRouter } from 'next/navigation'

export function ImageUploader({ entityType, entityId }: {
  entityType: 'customer' | 'dealer' | 'project_item'; entityId: string
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
