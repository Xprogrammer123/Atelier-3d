import { redirect } from 'next/navigation'
import { CreateListingForm } from '@/components/CreateListingForm'
import { createClient } from '@/lib/supabase/server'

export default async function CreateListingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <main className="page-shell">
      <h1 className="page-title">Create listing</h1>
      <p className="page-lede">
        Upload exactly four photos — front, back, left, and right. We&apos;ll generate a 3D model
        and publish your listing when ready.
      </p>
      <CreateListingForm />
    </main>
  )
}
