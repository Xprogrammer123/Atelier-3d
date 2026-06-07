import fs from 'fs/promises'
import { NextResponse } from 'next/server'
import { ensureProfile } from '@/lib/ensure-profile'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { getDemoModel } from '@/lib/demo-models'
import { readDemoModelGlb } from '@/lib/demo-models-server'
import { finalizeListingFromGlb } from '@/lib/finalize-listing'
import { pendoTrackServer } from '@/lib/pendo-server'
import { insertScanProcessingJob } from '@/lib/processing-jobs'
import { LISTINGS_BUCKET, listingGlbPath, listingPhotoPath } from '@/lib/storage-paths'

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
  const demoModelId = String(form.get('demo_model') ?? '').trim()

  const frontPhoto = form.get('photo_front')
  if (!(frontPhoto instanceof File) || frontPhoto.size === 0) {
    return NextResponse.json({ error: 'Add a front photo for your catalogue listing.' }, { status: 400 })
  }

  const demoModel = getDemoModel(demoModelId)
  if (!demoModel) {
    return NextResponse.json({ error: 'Choose a 3D model for your listing.' }, { status: 400 })
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

  try {
    await readDemoModelGlb(demoModel.file)
  } catch {
    return NextResponse.json({ error: `Demo model file missing: ${demoModel.file}` }, { status: 500 })
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
  const photoPath = listingPhotoPath(listingId, 'front')
  const photoBuffer = Buffer.from(await frontPhoto.arrayBuffer())

  const { error: photoUploadError } = await service.storage
    .from(LISTINGS_BUCKET)
    .upload(photoPath, photoBuffer, { contentType: frontPhoto.type || 'image/jpeg', upsert: true })

  if (photoUploadError) {
    return NextResponse.json({ error: photoUploadError.message }, { status: 500 })
  }

  const { data: photoPublic } = service.storage.from(LISTINGS_BUCKET).getPublicUrl(photoPath)

  await service.from('listing_photos').insert({
    listing_id: listingId,
    label: 'front',
    storage_path: photoPath,
    public_url: photoPublic.publicUrl,
  })

  const { error: jobError } = await insertScanProcessingJob(service, listingId)
  if (jobError) {
    return NextResponse.json({ error: jobError }, { status: 500 })
  }

  const glbBuffer = await readDemoModelGlb(demoModel.file)
  const glbPath = listingGlbPath(listingId)

  const { error: glbUploadError } = await service.storage.from(LISTINGS_BUCKET).upload(glbPath, glbBuffer, {
    contentType: 'model/gltf-binary',
    upsert: true,
  })

  if (glbUploadError) {
    return NextResponse.json({ error: glbUploadError.message }, { status: 500 })
  }

  await finalizeListingFromGlb(service, listingId)

  pendoTrackServer('listing_photo_uploaded', {
    visitorId: user.id,
    properties: {
      listing_id: listingId,
      photo_labels: 'front',
      model_source: 'demo',
      demo_model: demoModel.id,
      total_file_size_bytes: frontPhoto.size,
    },
  })

  return NextResponse.json({ listingId, live: true, demoModel: demoModel.id })
}

/* Scan + mesh pipeline (disabled for hackathon demo — re-enable when DG-Mesh is wired)
 *
 * return NextResponse.json({ listingId, pendingScanUpload: true })
 *
 * Client then: uploadScanVideo → POST /api/listings/[id]/scan-uploaded → npm run worker
 */
