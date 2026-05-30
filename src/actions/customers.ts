'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { customerSchema } from '@/lib/validation'

function parse(formData: FormData) {
  return customerSchema.parse({
    name: formData.get('name'),
    phone: formData.get('phone') || null,
    line_id: formData.get('line_id') || null,
    project_name: formData.get('project_name') || null,
    address: formData.get('address') || null,
    budget: formData.get('budget') || null,
    dislikes: formData.get('dislikes') || null,
    notes: formData.get('notes') || null,
    style_tags: formData.getAll('style_tags').map(String),
    color_material_tags: formData.getAll('color_material_tags').map(String),
    rooms: formData.getAll('rooms').map(String),
  })
}

export async function createCustomer(formData: FormData) {
  const supabase = await createClient()
  const data = parse(formData)
  const { data: row, error } = await supabase.from('customers').insert(data).select('id').single()
  if (error) throw new Error(error.message)
  revalidatePath('/customers')
  redirect(`/customers/${row.id}`)
}

export async function updateCustomer(id: string, formData: FormData) {
  const supabase = await createClient()
  const data = parse(formData)
  const { error } = await supabase.from('customers').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/customers/${id}`)
  redirect(`/customers/${id}`)
}

export async function deleteCustomer(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/customers')
  redirect('/customers')
}
