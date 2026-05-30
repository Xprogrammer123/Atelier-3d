import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { queueListingJob } from '@/lib/processing'

const BUCKET = 'listings'

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await context.params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
  const glbPath = `${listingId}/model.glb`

  const { data: file, error: downloadError } = await service.storage.from(BUCKET).download(glbPath)

  if (downloadError || !file) {
    return NextResponse.json(
      { error: '3D model not found. Upload a GLB file and try again.' },
      { status: 400 }
    )
  }

  const buf = Buffer.from(await file.arrayBuffer())
  if (buf.length < 12 || buf.toString('ascii', 0, 4) !== 'glTF') {
    return NextResponse.json({ error: 'Invalid GLB file' }, { status: 400 })
  }

  const { data: job } = await service
    .from('processing_jobs')
    .select('status')
    .eq('listing_id', listingId)
    .single()

  if (!job) {
    return NextResponse.json({ error: 'Processing job not found' }, { status: 404 })
  }

  if (job.status === 'complete') {
    return NextResponse.json({ ok: true, alreadyComplete: true })
  }

  await service
    .from('processing_jobs')
    .update({ status: 'queued', error_message: null, started_at: null, completed_at: null })
    .eq('listing_id', listingId)

  await service.from('listings').update({ status: 'processing' }).eq('id', listingId)

  queueListingJob(listingId)

  return NextResponse.json({ ok: true })
}
