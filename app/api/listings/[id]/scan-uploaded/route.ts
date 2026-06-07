import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { queueScanMeshJob } from '@/lib/mesh-processing'
import { downloadListingScanVideo } from '@/lib/scan-storage'
import { ensureScanProcessingJob, isScanJob } from '@/lib/processing-jobs'

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
  const downloaded = await downloadListingScanVideo(service, listingId)

  if (!downloaded) {
    return NextResponse.json(
      { error: 'Scan video not found. Record your scan and try again.' },
      { status: 400 }
    )
  }

  const buf = Buffer.from(await downloaded.blob.arrayBuffer())
  if (buf.length < 1024) {
    return NextResponse.json({ error: 'Scan video is too short or empty' }, { status: 400 })
  }

  const { job, error: jobError } = await ensureScanProcessingJob(service, listingId)
  if (jobError || !job) {
    return NextResponse.json({ error: jobError ?? 'Processing job not found' }, { status: 500 })
  }

  if (!isScanJob(job)) {
    return NextResponse.json({ error: 'This listing is not a scan job' }, { status: 400 })
  }

  if (job.status === 'complete') {
    return NextResponse.json({ ok: true, alreadyComplete: true })
  }

  await service
    .from('processing_jobs')
    .update({ status: 'queued', error_message: null, started_at: null, completed_at: null })
    .eq('listing_id', listingId)

  await service.from('listings').update({ status: 'processing' }).eq('id', listingId)

  queueScanMeshJob(listingId)

  return NextResponse.json({ ok: true })
}
