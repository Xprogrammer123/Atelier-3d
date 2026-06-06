import { NextResponse } from 'next/server'
import { ensureProfile } from '@/lib/ensure-profile'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { pendoTrackServer } from '@/lib/pendo-server'
import { listingPhotoPath } from '@/lib/storage-paths'
import { insertScanProcessingJob } from '@/lib/processing-jobs'

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

  const frontPhoto = form.get('photo_front')
  if (!(frontPhoto instanceof File) || frontPhoto.size === 0) {
    return NextResponse.json({ error: 'Add a front photo for your catalogue listing.' }, { status: 400 })
  }

  if (!title || !description || !category || Number.isNaN(price)) {
    return NextResponse.json({ error: 'Invalid listing fields' }, { status: 400 })
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
  const storagePath = listingPhotoPath(listingId, 'front')
  const buffer = Buffer.from(await frontPhoto.arrayBuffer())

  const { error: uploadError } = await service.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: frontPhoto.type || 'image/jpeg', upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: publicUrl } = service.storage.from(BUCKET).getPublicUrl(storagePath)

  await service.from('listing_photos').insert({
    listing_id: listingId,
    label: 'front',
    storage_path: storagePath,
    public_url: publicUrl.publicUrl,
  })

  const { error: jobError } = await insertScanProcessingJob(service, listingId)
  if (jobError) {
    return NextResponse.json({ error: jobError }, { status: 500 })
  }

  await pendoTrackServer('listing_photo_uploaded', {
    visitorId: user.id,
    properties: {
      listing_id: listingId,
      photo_labels: 'front',
      model_source: 'scan',
      total_file_size_bytes: frontPhoto.size,
    },
  })

  return NextResponse.json({ listingId, pendingScanUpload: true })
}
