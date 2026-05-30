import { NextResponse } from 'next/server'
import { ensureProfile } from '@/lib/ensure-profile'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { pendoTrackServer } from '@/lib/pendo-server'
import { queueListingJob } from '@/lib/processing'
import { PHOTO_LABELS, type PhotoLabel } from '@/lib/types'

const BUCKET = 'listings'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await request.formData()
  const title = String(form.get('title') ?? '').trim()
  const description = String(form.get('description') ?? '').trim()
  const price = Number(form.get('price'))
  const category = String(form.get('category') ?? '').trim()
  const location = String(form.get('location') ?? '').trim() || null
  const width_cm = form.get('width_cm') ? Number(form.get('width_cm')) : null
  const depth_cm = form.get('depth_cm') ? Number(form.get('depth_cm')) : null
  const height_cm = form.get('height_cm') ? Number(form.get('height_cm')) : null

  if (!title || !description || !category || Number.isNaN(price)) {
    return NextResponse.json({ error: 'Invalid listing fields' }, { status: 400 })
  }

  const photoFiles: Partial<Record<PhotoLabel, File>> = {}
  for (const label of PHOTO_LABELS) {
    const file = form.get(`photo_${label}`)
    if (file instanceof File && file.size > 0) {
      photoFiles[label] = file
    }
  }

  const missing = PHOTO_LABELS.filter((l) => !photoFiles[l])
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Exactly 4 photos required. Missing: ${missing.join(', ')}` },
      { status: 400 }
    )
  }

  try {
    await ensureProfile(user)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Profile setup failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const service = createServiceClient()

  const { data: listing, error: listingError } = await service
    .from('listings')
    .insert({
      seller_id: user.id,
      title,
      description,
      price_cents: Math.round(price * 100),
      category,
      location,
      width_cm,
      depth_cm,
      height_cm,
      status: 'processing',
    })
    .select('id')
    .single()

  if (listingError || !listing) {
    return NextResponse.json({ error: listingError?.message ?? 'Failed to create listing' }, { status: 500 })
  }

  const listingId = listing.id

  for (const label of PHOTO_LABELS) {
    const file = photoFiles[label]!
    const storagePath = `${listingId}/photos/${label}.jpg`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await service.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: file.type || 'image/jpeg', upsert: true })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: publicUrl } = service.storage.from(BUCKET).getPublicUrl(storagePath)

    await service.from('listing_photos').insert({
      listing_id: listingId,
      label,
      storage_path: storagePath,
      public_url: publicUrl.publicUrl,
    })
  }

  await service.from('processing_jobs').insert({
    listing_id: listingId,
    status: 'queued',
  })

  const totalFileSize = await PHOTO_LABELS.reduce(async (accP, label) => {
    const acc = await accP
    return acc + (photoFiles[label]?.size ?? 0)
  }, Promise.resolve(0))

  await pendoTrackServer('listing_photo_uploaded', {
    visitorId: user.id,
    properties: {
      listing_id: listingId,
      photo_labels: PHOTO_LABELS.join(','),
      total_file_size_bytes: totalFileSize,
    },
  })

  queueListingJob(listingId)

  return NextResponse.json({ listingId })
}
