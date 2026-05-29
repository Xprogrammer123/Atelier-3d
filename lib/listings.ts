import type { Listing, ListingPhoto, ListingWithSeller } from '@/lib/types'
import { isDbSetupError } from '@/lib/db-error'
import { createClient } from '@/lib/supabase/server'

const LISTING_SELECT = `
  *,
  seller:profiles(id, full_name, email, phone, location)
`

export type ListingsResult = {
  listings: ListingWithSeller[]
  dbSetupRequired: boolean
}

export async function getLiveListings(filters?: {
  category?: string
  minPrice?: number
  maxPrice?: number
  location?: string
}): Promise<ListingsResult> {
  const supabase = await createClient()

  let query = supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('status', 'live')
    .order('created_at', { ascending: false })

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }
  if (filters?.minPrice != null) {
    query = query.gte('price_cents', filters.minPrice)
  }
  if (filters?.maxPrice != null) {
    query = query.lte('price_cents', filters.maxPrice)
  }
  if (filters?.location) {
    query = query.ilike('location', `%${filters.location}%`)
  }

  const { data, error } = await query

  if (error) {
    if (isDbSetupError(error)) {
      return { listings: [], dbSetupRequired: true }
    }
    throw error
  }

  return { listings: (data ?? []) as ListingWithSeller[], dbSetupRequired: false }
}

export async function getListingById(id: string): Promise<ListingWithSeller | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listings')
    .select(
      `
      *,
      seller:profiles(id, full_name, email, phone, location),
      photos:listing_photos(*)
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    if (isDbSetupError(error)) return null
    return null
  }
  return data as ListingWithSeller
}

export type SellerListing = Listing & {
  processing_jobs?: { status: string }[] | null
}

export async function getSellerListings(sellerId: string): Promise<{
  listings: SellerListing[]
  dbSetupRequired: boolean
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listings')
    .select('*, processing_jobs(status)')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })

  if (error) {
    if (isDbSetupError(error)) {
      return { listings: [], dbSetupRequired: true }
    }
    throw error
  }

  return { listings: (data ?? []) as SellerListing[], dbSetupRequired: false }
}

export async function getProcessingJob(listingId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('processing_jobs')
    .select('*')
    .eq('listing_id', listingId)
    .single()

  if (error && !isDbSetupError(error)) return null
  return data
}

export async function getListingPhotos(listingId: string): Promise<ListingPhoto[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('listing_photos')
    .select('*')
    .eq('listing_id', listingId)
    .order('label')

  if (error) return []
  return (data ?? []) as ListingPhoto[]
}
