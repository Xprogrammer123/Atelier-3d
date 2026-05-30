import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CreateListingForm } from '@/components/listing/CreateListingForm'
import { createClient } from '@/lib/supabase/server'
import { catalogEyebrow, pageLede, pageShell, pageTitle } from '@/lib/ui'

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
    <main className={pageShell}>
      <header className="mb-8 pb-6 border-b border-line">
        <div>
          <Link
            href="/dashboard"
            className="inline-block mb-3 text-[0.82rem] font-semibold text-ink-muted hover:text-accent-clay"
          >
            ← Dashboard
          </Link>
          <p className={catalogEyebrow}>Seller studio</p>
          <h1 className={pageTitle}>Create a listing</h1>
          <p className={pageLede}>
            Upload a LiDAR scan or manufacturer GLB for real 3D + AR, or generate from four photos.
          </p>
        </div>
      </header>
      <CreateListingForm />
    </main>
  )
}
