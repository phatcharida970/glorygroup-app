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
