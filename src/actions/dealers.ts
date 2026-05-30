'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { dealerSchema } from '@/lib/validation'

function parse(formData: FormData) {
  return dealerSchema.parse({
    name: formData.get('name'),
    rating: formData.get('rating') || null,
    phone: formData.get('phone') || null,
    line_id: formData.get('line_id') || null,
    location_text: formData.get('location_text') || null,
    map_url: formData.get('map_url') || null,
    credit_terms: formData.get('credit_terms') || null,
    shipping_note: formData.get('shipping_note') || null,
    min_order: formData.get('min_order') || null,
    hours: formData.get('hours') || null,
    notes: formData.get('notes') || null,
    categories: formData.getAll('categories').map(String),
  })
}

export async function createDealer(formData: FormData) {
  const supabase = await createClient()
  const { data: row, error } = await supabase.from('dealers').insert(parse(formData)).select('id').single()
  if (error) throw new Error(error.message)
  revalidatePath('/dealers'); redirect(`/dealers/${row.id}`)
}
export async function updateDealer(id: string, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('dealers').update(parse(formData)).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/dealers/${id}`); redirect(`/dealers/${id}`)
}
export async function deleteDealer(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('dealers').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dealers'); redirect('/dealers')
}
