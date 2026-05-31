import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { queueListingJob } from '@/lib/processing'
import { queueScanMeshJob } from '@/lib/mesh-processing'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { listingId } = (await request.json()) as { listingId?: string }
  if (!listingId) {
    return NextResponse.json({ error: 'listingId required' }, { status: 400 })
  }

  const { data: listing } = await supabase
    .from('listings')
    .select('seller_id')
    .eq('id', listingId)
    .single()

  if (!listing || listing.seller_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createServiceClient()

  const { data: job } = await service
    .from('processing_jobs')
    .select('job_type')
    .eq('listing_id', listingId)
    .single()

  await service
    .from('processing_jobs')
    .update({ status: 'queued', error_message: null, started_at: null, completed_at: null })
    .eq('listing_id', listingId)
  await service.from('listings').update({ status: 'processing' }).eq('id', listingId)

  if (job?.job_type === 'scan') {
    queueScanMeshJob(listingId)
  } else {
    queueListingJob(listingId)
  }

  return NextResponse.json({ ok: true })
}
