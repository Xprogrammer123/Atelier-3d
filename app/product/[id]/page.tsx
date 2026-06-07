import { notFound } from 'next/navigation'
import { ProductDetailView } from '@/components/listing/ProductDetailView'
import { getListingById } from '@/lib/listings'
import { createClient } from '@/lib/supabase/server'
import { getSiteOrigin } from '@/lib/app-url-server'
import { generateQrDataUrl } from '@/lib/qr'

type Props = { params: Promise<{ id: string }> }

export const metadata = {
  title: 'Product — Atelier',
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const listing = await getListingById(id)

  if (!listing || listing.status !== 'live') {
    notFound()
  }

  const supabase = await createClient()
  await supabase.rpc('increment_listing_views', { listing_uuid: id })

  const siteOrigin = await getSiteOrigin()
  const qrDataUrl = await generateQrDataUrl(`${siteOrigin}/ar/${id}`)

  return <ProductDetailView listing={listing} qrDataUrl={qrDataUrl} />
}
