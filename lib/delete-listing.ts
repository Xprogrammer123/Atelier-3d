import { createServiceClient } from '@/lib/supabase/admin'
import {
  LISTINGS_BUCKET,
  listingGlbPath,
  listingQrPath,
  listingScanVideoPaths,
} from '@/lib/storage-paths'

type SupabaseService = ReturnType<typeof createServiceClient>

/** Collect every storage object path under a listing folder. */
async function collectListingStoragePaths(
  service: SupabaseService,
  listingId: string,
  photoPaths: string[]
): Promise<string[]> {
  const paths = new Set<string>([
    listingGlbPath(listingId),
    listingQrPath(listingId),
    ...listingScanVideoPaths(listingId),
    ...photoPaths,
  ])

  const { data: root } = await service.storage.from(LISTINGS_BUCKET).list(listingId, { limit: 100 })
  for (const entry of root ?? []) {
    if (entry.id) {
      paths.add(`${listingId}/${entry.name}`)
      continue
    }

    const { data: nested } = await service.storage.from(LISTINGS_BUCKET).list(`${listingId}/${entry.name}`, {
      limit: 100,
    })
    for (const file of nested ?? []) {
      if (file.id) {
        paths.add(`${listingId}/${entry.name}/${file.name}`)
      }
    }
  }

  return [...paths]
}

export async function deleteListingForSeller(
  listingId: string,
  sellerId: string
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const service = createServiceClient()

  const { data: listing, error: fetchError } = await service
    .from('listings')
    .select('id, seller_id')
    .eq('id', listingId)
    .single()

  if (fetchError || !listing) {
    return { ok: false, status: 404, error: 'Listing not found' }
  }

  if (listing.seller_id !== sellerId) {
    return { ok: false, status: 403, error: 'Forbidden' }
  }

  const { data: photos } = await service
    .from('listing_photos')
    .select('storage_path')
    .eq('listing_id', listingId)

  const photoPaths = (photos ?? []).map((p) => p.storage_path)
  const storagePaths = await collectListingStoragePaths(service, listingId, photoPaths)

  if (storagePaths.length > 0) {
    await service.storage.from(LISTINGS_BUCKET).remove(storagePaths)
  }

  const { data: deleted, error: deleteError } = await service
    .from('listings')
    .delete()
    .eq('id', listingId)
    .eq('seller_id', sellerId)
    .select('id')

  if (deleteError) {
    return { ok: false, status: 500, error: deleteError.message }
  }

  if (!deleted?.length) {
    return { ok: false, status: 404, error: 'Listing not found' }
  }

  return { ok: true }
}
