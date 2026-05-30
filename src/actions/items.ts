'use server'
import { createClient } from '@/lib/supabase/server'
import { itemSchema } from '@/lib/validation'

export async function createItem(input: { name: string; unit: string; category?: string | null }) {
  const supabase = await createClient()
  const data = itemSchema.parse(input)
  const { data: row, error } = await supabase.from('items').insert(data).select('*').single()
  if (error) throw new Error(error.message)
  return row
}
