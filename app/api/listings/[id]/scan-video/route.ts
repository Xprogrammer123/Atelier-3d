import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { scanVideoFileExtension } from '@/lib/scan-recording'
import { LISTINGS_BUCKET, listingScanVideoPath } from '@/lib/storage-paths'
import { MAX_SCAN_VIDEO_BYTES } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(
  request: Request,
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

  const formData = await request.formData()
  const video = formData.get('video')

  if (!(video instanceof File) || video.size === 0) {
    return NextResponse.json({ error: 'Scan video missing or empty' }, { status: 400 })
  }

  if (video.size > MAX_SCAN_VIDEO_BYTES) {
    return NextResponse.json(
      {
        error: `Scan video is too large (${Math.round(video.size / (1024 * 1024))} MB). Re-record a shorter scan.`,
      },
      { status: 400 }
    )
  }

  const ext = scanVideoFileExtension(video.type || 'video/webm')
  const storagePath = listingScanVideoPath(listingId, ext)
  const contentType = video.type || (ext === 'mp4' ? 'video/mp4' : 'video/webm')
  const buffer = Buffer.from(await video.arrayBuffer())

  const service = createServiceClient()
  const { error: uploadError } = await service.storage.from(LISTINGS_BUCKET).upload(storagePath, buffer, {
    contentType,
    upsert: true,
  })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    path: storagePath,
    size: video.size,
  })
}
