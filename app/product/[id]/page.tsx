import Link from 'next/link'
import { notFound } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { ContactSellerButton } from '@/components/ContactSellerButton'
import { ShareLinkButton } from '@/components/ShareLinkButton'
import { getListingById } from '@/lib/listings'
import { createClient } from '@/lib/supabase/server'
import {
  formatDimensions,
  formatPrice,
  getArUrl,
} from '@/lib/types'
import { generateQrDataUrl } from '@/lib/qr'

const ProductModelViewer = dynamic(
  () => import('@/components/ProductModelViewer').then((m) => m.ProductModelViewer),
  { ssr: false }
)

type Props = { params: Promise<{ id: string }> }

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const listing = await getListingById(id)

  if (!listing || listing.status !== 'live') {
    notFound()
  }

  const supabase = await createClient()
  await supabase.rpc('increment_listing_views', { listing_uuid: id })

  const arUrl = getArUrl(id)
  const qrDataUrl = await generateQrDataUrl(arUrl)
  const sellerName = listing.seller?.full_name || 'Seller'
  const dims = formatDimensions(
    listing.width_cm,
    listing.depth_cm,
    listing.height_cm
  )

  return (
    <main className="page-shell product-detail">
      <div className="product-viewer-wrap">
        {listing.glb_url ? (
          <ProductModelViewer
            src={listing.glb_url}
            alt={listing.title}
            poster={listing.poster_url ?? undefined}
            loading="eager"
            autoRotate
            ar
            showArButton
            cameraOrbit="30deg 75deg auto"
          />
        ) : (
          <div className="empty-state">3D model not available</div>
        )}
      </div>

      <div className="product-meta">
        <span className="badge">{listing.category}</span>
        <h1>{listing.title}</h1>
        <p className="product-price">{formatPrice(listing.price_cents)}</p>
        <p>{listing.description}</p>
        <p>
          <strong>Dimensions:</strong> {dims}
        </p>
        {listing.location && (
          <p>
            <strong>Location:</strong> {listing.location}
          </p>
        )}
        <p>
          <strong>Seller:</strong> {sellerName}
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link href={`/ar/${id}`} className="btn-accent">
            Try in Your Room
          </Link>
          <ContactSellerButton
            listingId={id}
            email={listing.seller?.email ?? null}
            phone={listing.seller?.phone ?? null}
          />
          <ShareLinkButton url={arUrl} />
        </div>

        <div className="qr-panel">
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--ink-strong)' }}>
            Scan to open AR on another device
          </p>
          <Image src={qrDataUrl} alt="QR code for AR preview" width={140} height={140} unoptimized />
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
            {arUrl}
          </p>
        </div>
      </div>
    </main>
  )
}
