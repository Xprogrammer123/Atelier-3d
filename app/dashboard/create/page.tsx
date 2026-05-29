import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CreateListingForm } from '@/components/listing/CreateListingForm'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'New listing — Atelier',
}

export default async function CreateListingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <main className="create-listing page-shell">
      <header className="create-listing__page-header">
        <div>
          <Link href="/dashboard" className="listing-status__back">
            ← Dashboard
          </Link>
          <p className="catalog-eyebrow">Seller studio</p>
          <h1 className="page-title">Create a listing</h1>
          <p className="page-lede">
            Four photos become a 3D model, AR preview, and shareable QR — all from one upload.
          </p>
        </div>
      </header>
      <CreateListingForm />
    </main>
  )
}
