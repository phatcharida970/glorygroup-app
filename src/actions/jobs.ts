'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

const isUUID = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

export interface JobLineItem {
  existingId: string | null
  tempId: string
  name: string
  amount: number
  dealer_id: string | null
  notes: string | null
  payment_type: 'cash' | 'transfer' | null
  bank_info: string | null
  payment_status: 'paid' | 'deposit' | 'pending' | null
  deposit_amount: number | null
  expense_type: 'material' | 'labor' | null
  sort_order: number
}

async function resolveCustomer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  customer_id: string,
  customer_name: string,
): Promise<string | null> {
  // ถ้ามี id อยู่แล้ว ใช้เลย
  if (customer_id) return customer_id
  // ถ้าพิมพ์ชื่อใหม่ → สร้างลูกค้าใหม่อัตโนมัติ
  if (customer_name.trim()) {
    const { data, error } = await supabase
      .from('customers')
      .insert({ name: customer_name.trim() })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    revalidatePath('/customers')
    return data.id
  }
  return null
}

function parseForm(formData: FormData) {
  const name = (formData.get('name') as string).trim()
  if (!name) throw new Error('กรุณาระบุชื่องาน')

  const customer_id   = (formData.get('customer_id') as string) || ''
  const customer_name = (formData.get('customer_name') as string) || ''
  const sale_price    = parseFloat(formData.get('sale_price') as string) || 0
  const status        = (formData.get('status') as string) || 'active'
  const notes         = (formData.get('notes') as string) || null

  const itemsRaw = formData.get('items') as string
  const items: JobLineItem[] = itemsRaw ? JSON.parse(itemsRaw) : []

  return { name, customer_id, customer_name, sale_price, status, notes, items }
}

export async function createJob(formData: FormData): Promise<{ error: string } | void> {
  let projectId: string | null = null
  try {
    const supabase = await createClient()
    const { items, customer_id, customer_name, ...rest } = parseForm(formData)

    const resolvedCustomerId = await resolveCustomer(supabase, customer_id, customer_name)

    const { data: row, error } = await supabase
      .from('projects')
      .insert({ ...rest, customer_id: resolvedCustomerId })
      .select('id')
      .single()
    if (error) return { error: 'สร้างงานไม่ได้: ' + error.message }

    projectId = row.id

    if (items.length) {
      const insertData = items.map(({ existingId: _x, tempId, payment_status, deposit_amount, expense_type, ...it }, i) => {
        const base: Record<string, unknown> = {
          id: isUUID(tempId) ? tempId : randomUUID(),
          ...it,
          project_id: row.id,
          sort_order: i,
        }
        if (payment_status) base.payment_status = payment_status
        if (deposit_amount != null) base.deposit_amount = deposit_amount
        if (expense_type) base.expense_type = expense_type
        return base
      })
      const { error: err2 } = await supabase.from('project_items').insert(insertData)
      if (err2) return { error: 'บันทึกรายการไม่ได้: ' + err2.message }
    }
  } catch (err: unknown) {
    return { error: 'เกิดข้อผิดพลาด: ' + String(err) }
  }

  revalidatePath('/jobs')
  redirect(`/jobs/${projectId!}`)
}

export async function updateJob(id: string, formData: FormData): Promise<{ error: string } | void> {
  try {
    const supabase = await createClient()
    const { items, customer_id, customer_name, ...rest } = parseForm(formData)

    const resolvedCustomerId = await resolveCustomer(supabase, customer_id, customer_name)

    const { error } = await supabase
      .from('projects')
      .update({ ...rest, customer_id: resolvedCustomerId })
      .eq('id', id)
    if (error) return { error: 'อัปเดตงานไม่ได้: ' + error.message }

    // ลบเฉพาะ item ที่ถูกเอาออก
    const keptIds = items.filter(it => it.existingId).map(it => it.existingId!)
    if (keptIds.length > 0) {
      await supabase.from('project_items').delete()
        .eq('project_id', id)
        .not('id', 'in', `(${keptIds.join(',')})`)
    } else {
      await supabase.from('project_items').delete().eq('project_id', id)
    }

    // update item เก่า
    for (const it of items.filter(it => it.existingId)) {
      const { existingId, tempId: _t, payment_status, deposit_amount, expense_type, ...fields } = it
      const updateData: Record<string, unknown> = { ...fields }
      if (payment_status) updateData.payment_status = payment_status
      if (deposit_amount != null) updateData.deposit_amount = deposit_amount
      if (expense_type) updateData.expense_type = expense_type
      const { error: ue } = await supabase.from('project_items').update(updateData).eq('id', existingId!)
      if (ue) return { error: 'อัปเดตรายการไม่ได้: ' + ue.message }
    }

    // insert item ใหม่
    const newItems = items.filter(it => !it.existingId)
    if (newItems.length) {
      const { error: err2 } = await supabase.from('project_items').insert(
        newItems.map(({ existingId: _x, tempId, payment_status, deposit_amount, expense_type, ...it }) => {
          const base: Record<string, unknown> = {
            id: isUUID(tempId) ? tempId : randomUUID(),
            ...it,
            project_id: id,
          }
          if (payment_status) base.payment_status = payment_status
          if (deposit_amount != null) base.deposit_amount = deposit_amount
          if (expense_type) base.expense_type = expense_type
          return base
        })
      )
      if (err2) return { error: 'บันทึกรายการใหม่ไม่ได้: ' + err2.message }
    }
  } catch (err: unknown) {
    return { error: 'เกิดข้อผิดพลาด: ' + String(err) }
  }

  revalidatePath(`/jobs/${id}`)
  redirect(`/jobs/${id}`)
}

export async function deleteJob(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/jobs')
  redirect('/jobs')
}
