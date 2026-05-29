export const CATEGORIES = [
  'Seating',
  'Surfaces',
  'Storage',
  'Lighting',
  'Bedroom',
  'Dining',
  'Office',
  'Outdoor',
] as const

export type Category = (typeof CATEGORIES)[number]

export type PhotoLabel = 'front' | 'back' | 'left' | 'right'

export const PHOTO_LABELS: PhotoLabel[] = ['front', 'back', 'left', 'right']

export type ListingStatus = 'processing' | 'live' | 'sold' | 'failed' | 'draft'
export type JobStatus = 'queued' | 'generating' | 'complete' | 'failed'

export type Profile = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  location: string | null
}

export type Listing = {
  id: string
  seller_id: string
  title: string
  description: string
  price_cents: number
  category: string
  width_cm: number | null
  depth_cm: number | null
  height_cm: number | null
  location: string | null
  status: ListingStatus
  glb_url: string | null
  poster_url: string | null
  qr_path: string | null
  views_count: number
  ar_sessions_count: number
  enquiries_count: number
  created_at: string
  updated_at: string
}

export type ListingPhoto = {
  id: string
  listing_id: string
  label: PhotoLabel
  storage_path: string
  public_url: string
}

export type ProcessingJob = {
  id: string
  listing_id: string
  status: JobStatus
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type ListingWithSeller = Listing & {
  seller: Pick<Profile, 'id' | 'full_name' | 'email' | 'phone' | 'location'> | null
  photos?: ListingPhoto[]
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function formatDimensions(
  w: number | null,
  d: number | null,
  h: number | null
): string {
  if (!w && !d && !h) return 'Dimensions not specified'
  const parts = []
  if (w) parts.push(`${w}cm W`)
  if (d) parts.push(`${d}cm D`)
  if (h) parts.push(`${h}cm H`)
  return parts.join(' × ')
}

export function getArUrl(listingId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${base.replace(/\/$/, '')}/ar/${listingId}`
}

export function getProductUrl(listingId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${base.replace(/\/$/, '')}/product/${listingId}`
}
