import { notFound } from 'next/navigation'
import { ProductDetailClient } from '@/components/ProductDetailClient'
import { getListingById } from '@/lib/listings'
import { createClient } from '@/lib/supabase/server'
import { generateQrDataUrl } from '@/lib/qr'

type Props = { params: Promise<{ id: string }> }

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const listing = await getListingById(id)

  if (!listing || listing.status !== 'live') {
    notFound()
  }

  const supabase = await createClient()
  await supabase.rpc('increment_listing_views', { listing_uuid: id })

  const qrDataUrl = await generateQrDataUrl(
    `${(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')}/ar/${id}`
  )

  return <ProductDetailClient listing={listing} qrDataUrl={qrDataUrl} />
}
