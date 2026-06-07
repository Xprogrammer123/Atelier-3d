import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: listing } = await supabase
    .from('listings')
    .select('seller_id, glb_url, poster_url, status')
    .eq('id', id)
    .single()

  if (!listing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!user || listing.seller_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: job } = await supabase
    .from('processing_jobs')
    .select('status, error_message, job_type')
    .eq('listing_id', id)
    .single()

  return NextResponse.json({
    status: job?.status ?? 'queued',
    job_type: job?.job_type ?? 'scan',
    glb_url: listing.glb_url,
    poster_url: listing.poster_url,
    listing_status: listing.status,
    error_message: job?.error_message ?? null,
  })
}
