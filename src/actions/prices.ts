'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { priceSchema } from '@/lib/validation'

export async function addPrice(formData: FormData) {
  const supabase = await createClient()
  const data = priceSchema.parse({
    item_id: formData.get('item_id'),
    dealer_id: formData.get('dealer_id'),
    price: formData.get('price'),
    observed_at: formData.get('observed_at'),
    note: formData.get('note') || null,
  })
  const { error } = await supabase.from('prices').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath(`/compare/${data.item_id}`)
  revalidatePath(`/dealers/${data.dealer_id}`)
  redirect(`/compare/${data.item_id}`)
}
