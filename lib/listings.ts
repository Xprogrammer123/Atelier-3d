import type { Listing, ListingPhoto, ListingWithSeller } from '@/lib/types'
import { createClient } from '@/lib/supabase/server'

export async function getLiveListings(filters?: {
  category?: string
  minPrice?: number
  maxPrice?: number
  location?: string
}): Promise<ListingWithSeller[]> {
  const supabase = await createClient()

  let query = supabase
    .from('listings')
    .select(
      `
      *,
      seller:profiles!listings_seller_id_fkey(id, full_name, email, phone, location)
    `
    )
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
  if (error) throw error
  return (data ?? []) as ListingWithSeller[]
}

export async function getListingById(id: string): Promise<ListingWithSeller | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listings')
    .select(
      `
      *,
      seller:profiles!listings_seller_id_fkey(id, full_name, email, phone, location),
      photos:listing_photos(*)
    `
    )
    .eq('id', id)
    .single()

  if (error) return null
  return data as ListingWithSeller
}

export async function getSellerListings(sellerId: string): Promise<
  (Listing & { job?: { status: string } | null })[]
> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listings')
    .select('*, processing_jobs(status)')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as (Listing & {
    processing_jobs?: { status: string }[] | null
  })[]
}

export async function getProcessingJob(listingId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('processing_jobs')
    .select('*')
    .eq('listing_id', listingId)
    .single()
  return data
}

export async function getListingPhotos(listingId: string): Promise<ListingPhoto[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('listing_photos')
    .select('*')
    .eq('listing_id', listingId)
    .order('label')
  return (data ?? []) as ListingPhoto[]
}
