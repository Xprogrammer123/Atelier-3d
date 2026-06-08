import { notFound } from 'next/navigation'
import { ArPageClient } from '@/components/ArPageClient'
import { getListingById } from '@/lib/listings'
import { pendoTrackServer } from '@/lib/pendo-server'
import { getServerVisitorId } from '@/lib/pendo-visitor'
import { createClient } from '@/lib/supabase/server'

type Props = { params: Promise<{ id: string }> }

export default async function ArDirectPage({ params }: Props) {
  const { id } = await params
  const listing = await getListingById(id)

  if (!listing || listing.status !== 'live' || !listing.glb_url) {
    notFound()
  }

  const supabase = await createClient()
  await supabase.rpc('increment_listing_ar_sessions', { listing_uuid: id })

  const { data: { user } } = await supabase.auth.getUser()
  const visitorId = await getServerVisitorId(user?.id)

  if (visitorId) {
    pendoTrackServer('ar_session_started', {
      visitorId,
      properties: {
        listing_id: id,
      },
    })
  }

  return <ArPageClient listing={listing} />
}
