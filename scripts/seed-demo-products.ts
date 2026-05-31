/**
 * Seed the three showcase GLBs as live catalogue listings.
 *
 * Usage:
 *   npm run seed:products
 *   npm run seed:products -- <seller-user-uuid>
 *
 * Requires .env.local with Supabase service role + NEXT_PUBLIC_APP_URL.
 */
import fs from 'fs/promises'
import path from 'path'
import { loadEnv, requireEnv } from '../lib/load-env'
import { createNodeSupabaseClient } from '../lib/supabase/node-client'
import { generateQrBuffer } from '../lib/qr'
import { getArUrl, getProductUrl } from '../lib/types'

loadEnv()

const BUCKET = 'listings'

const PRODUCTS = [
  {
    slug: 'sheen-chair',
    title: 'Sheen Accent Chair',
    description:
      'Sculptural accent chair with a soft sheen finish. Solid wood frame, upholstered seat. Light wear consistent with showroom display.',
    category: 'Seating',
    price_cents: 89000,
    width_cm: 68,
    depth_cm: 72,
    height_cm: 82,
    location: 'Brooklyn, NY',
    modelFile: 'chair.glb',
  },
  {
    slug: 'iridescence-lamp',
    title: 'Iridescence Floor Lamp',
    description:
      'Tall floor lamp with an iridescent shade and brushed metal stem. Warm ambient light — ideal beside a reading chair or sofa.',
    category: 'Lighting',
    price_cents: 42000,
    width_cm: 45,
    depth_cm: 45,
    height_cm: 165,
    location: 'Brooklyn, NY',
    modelFile: 'floor-lamp.glb',
  },
  {
    slug: 'side-table',
    title: 'Walnut Side Table',
    description:
      'Compact side table in warm walnut. Single shelf, clean lines. Pairs well with lounge seating or as a bedside surface.',
    category: 'Surfaces',
    price_cents: 35000,
    width_cm: 50,
    depth_cm: 45,
    height_cm: 55,
    location: 'Brooklyn, NY',
    modelFile: 'side-table.glb',
  },
] as const

async function resolveSellerId(supabase: ReturnType<typeof createNodeSupabaseClient>): Promise<string> {
  const arg = process.argv[2]?.trim()
  if (arg) return arg

  const { data: profiles, error } = await supabase.from('profiles').select('id, email').limit(5)
  if (error) throw error

  if (!profiles?.length) {
    throw new Error(
      'No seller profile found. Register/login once in the app, then run:\n  npm run seed:products -- <your-user-uuid>'
    )
  }

  if (profiles.length === 1) {
    console.log(`Using seller ${profiles[0].email ?? profiles[0].id}`)
    return profiles[0].id
  }

  console.log('Multiple profiles — pass seller UUID explicitly:')
  for (const p of profiles) {
    console.log(`  ${p.id}  ${p.email ?? '(no email)'}`)
  }
  throw new Error('Pass seller UUID: npm run seed:products -- <uuid>')
}

async function seedProduct(
  supabase: ReturnType<typeof createNodeSupabaseClient>,
  sellerId: string,
  product: (typeof PRODUCTS)[number]
) {
  const { data: existing } = await supabase
    .from('listings')
    .select('id, title')
    .eq('seller_id', sellerId)
    .eq('title', product.title)
    .maybeSingle()

  if (existing) {
    console.log(`Skip (exists): ${product.title} → /product/${existing.id}`)
    return existing.id
  }

  const modelPath = path.join(process.cwd(), 'public', 'models', product.modelFile)
  const glbBody = await fs.readFile(modelPath)

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .insert({
      seller_id: sellerId,
      title: product.title,
      description: product.description,
      price_cents: product.price_cents,
      category: product.category,
      width_cm: product.width_cm,
      depth_cm: product.depth_cm,
      height_cm: product.height_cm,
      location: product.location,
      status: 'processing',
    })
    .select('id')
    .single()

  if (listingError || !listing) {
    throw new Error(`Failed to create "${product.title}": ${listingError?.message ?? 'unknown'}`)
  }

  const listingId = listing.id
  const glbStoragePath = `${listingId}/model.glb`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(glbStoragePath, glbBody, { contentType: 'model/gltf-binary', upsert: true })

  if (uploadError) throw uploadError

  const { data: glbPublic } = supabase.storage.from(BUCKET).getPublicUrl(glbStoragePath)
  const glbUrl = `${glbPublic.publicUrl}?v=${Date.now()}`

  const arUrl = getArUrl(listingId)
  const qrBuffer = await generateQrBuffer(arUrl)
  const qrPath = `${listingId}/qr.png`

  await supabase.storage.from(BUCKET).upload(qrPath, qrBuffer, {
    contentType: 'image/png',
    upsert: true,
  })

  await supabase
    .from('listings')
    .update({
      status: 'live',
      glb_url: glbUrl,
      poster_url: null,
      qr_path: qrPath,
    })
    .eq('id', listingId)

  await supabase.from('processing_jobs').insert({
    listing_id: listingId,
    status: 'complete',
    job_type: 'scan',
    completed_at: new Date().toISOString(),
  })

  console.log(`Created: ${product.title}`)
  console.log(`  Product  ${getProductUrl(listingId)}`)
  console.log(`  AR       ${arUrl}`)
  console.log(`  GLB      ${glbUrl}`)

  return listingId
}

async function main() {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  requireEnv('NEXT_PUBLIC_APP_URL')

  const supabase = createNodeSupabaseClient(supabaseUrl, serviceRoleKey)
  const sellerId = await resolveSellerId(supabase)

  console.log('\nSeeding demo products from public/models/ …\n')

  for (const product of PRODUCTS) {
    await seedProduct(supabase, sellerId, product)
  }

  console.log('\nDone. Open /catalogue to see live listings.\n')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
