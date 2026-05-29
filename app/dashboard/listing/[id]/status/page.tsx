import { redirect, notFound } from 'next/navigation'
import { ProcessingStatusView } from '@/components/listing/ProcessingStatusView'
import { getListingById, getProcessingJob } from '@/lib/listings'
import { createClient } from '@/lib/supabase/server'

type Props = { params: Promise<{ id: string }> }

export const metadata = {
  title: 'Listing status — Atelier',
}

export default async function ProcessingStatusPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const listing = await getListingById(id)
  if (!listing || listing.seller_id !== user.id) notFound()

  const job = await getProcessingJob(id)

  return (
    <main className="page-shell">
      <ProcessingStatusView
        listingId={id}
        initialStatus={job?.status ?? 'queued'}
        glbUrl={listing.glb_url}
        posterUrl={listing.poster_url}
        title={listing.title}
        errorMessage={job?.error_message ?? null}
      />
    </main>
  )
}
