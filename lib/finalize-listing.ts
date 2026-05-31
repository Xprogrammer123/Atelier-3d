import fs from 'fs/promises'
import { createNodeSupabaseClient } from '@/lib/supabase/node-client'
import { generateQrBuffer } from '@/lib/qr'
import { pendoTrackServer } from '@/lib/pendo-server'
import { getArUrl } from '@/lib/types'
import { LISTINGS_BUCKET, listingGlbPath, listingQrPath } from '@/lib/storage-paths'

type SupabaseAdmin = ReturnType<typeof createNodeSupabaseClient>

export async function finalizeListingFromGlb(
  supabase: SupabaseAdmin,
  listingId: string,
  options?: { processingStartedAt?: string | null }
): Promise<string> {
  const glbPath = listingGlbPath(listingId)

  const { data: existingGlb, error: downloadError } = await supabase.storage
    .from(LISTINGS_BUCKET)
    .download(glbPath)

  if (downloadError || !existingGlb) {
    throw new Error('3D model not found in storage')
  }

  const buf = Buffer.from(await existingGlb.arrayBuffer())
  if (buf.length < 12 || buf.toString('ascii', 0, 4) !== 'glTF') {
    throw new Error('Invalid GLB file in storage')
  }

  const { data: glbPublic } = supabase.storage.from(LISTINGS_BUCKET).getPublicUrl(glbPath)
  const glbUrl = `${glbPublic.publicUrl}?v=${Date.now()}`

  const { data: photos } = await supabase
    .from('listing_photos')
    .select('label, public_url')
    .eq('listing_id', listingId)

  const front = photos?.find((p) => p.label === 'front')
  const posterUrl = front?.public_url ?? null

  const arUrl = getArUrl(listingId)
  const qrBuffer = await generateQrBuffer(arUrl)
  const qrPath = listingQrPath(listingId)

  await supabase.storage.from(LISTINGS_BUCKET).upload(qrPath, qrBuffer, {
    contentType: 'image/png',
    upsert: true,
  })

  await supabase
    .from('listings')
    .update({
      status: 'live',
      glb_url: glbUrl,
      poster_url: posterUrl,
      qr_path: qrPath,
    })
    .eq('id', listingId)

  await supabase
    .from('processing_jobs')
    .update({
      status: 'complete',
      completed_at: new Date().toISOString(),
      error_message: null,
    })
    .eq('listing_id', listingId)

  const durationMs = options?.processingStartedAt
    ? Date.now() - new Date(options.processingStartedAt).getTime()
    : undefined

  await pendoTrackServer('model_generation_completed', {
    properties: {
      listing_id: listingId,
      processing_duration_ms: durationMs,
      glb_url: glbUrl,
    },
  })

  return glbUrl
}

export async function failListingJob(
  supabase: SupabaseAdmin,
  listingId: string,
  message: string
): Promise<void> {
  await supabase
    .from('processing_jobs')
    .update({ status: 'failed', error_message: message })
    .eq('listing_id', listingId)

  await supabase.from('listings').update({ status: 'failed' }).eq('id', listingId)

  await pendoTrackServer('model_generation_failed', {
    properties: {
      listing_id: listingId,
      error_message: message.substring(0, 200),
    },
  })
}

export async function glbExistsInStorage(
  supabase: SupabaseAdmin,
  listingId: string
): Promise<boolean> {
  const { data, error } = await supabase.storage
    .from(LISTINGS_BUCKET)
    .download(listingGlbPath(listingId))

  return !error && !!data
}

export async function cleanupWorkDir(listingId: string): Promise<void> {
  await fs.rm(`/tmp/atelier/${listingId}`, { recursive: true, force: true }).catch(() => {})
}
