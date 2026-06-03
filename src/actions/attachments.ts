'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function recordAttachment(input: {
  entity_type: 'customer' | 'dealer' | 'project_item'; entity_id: string; storage_path: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('attachments').insert(input)
  if (error) throw new Error(error.message)
  if (input.entity_type === 'project_item') {
    revalidatePath('/jobs')
  } else {
    revalidatePath(`/${input.entity_type}s/${input.entity_id}`)
  }
}

export async function deleteAttachment(id: string, storage_path: string, entityPath: string) {
  const supabase = await createClient()
  await supabase.storage.from('attachments').remove([storage_path])
  await supabase.from('attachments').delete().eq('id', id)
  revalidatePath(entityPath)
}
