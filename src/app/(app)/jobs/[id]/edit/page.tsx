import { redirect } from 'next/navigation'

// รวมหน้าแก้ไขเข้ากับหน้าหลักแล้ว
export default async function EditJobRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/jobs/${id}`)
}
