'use client'

import Link from 'next/link'
import { ProductModelViewer } from '@/components/ProductModelViewer'
import { ContactSellerButton } from '@/components/ContactSellerButton'
import { ShareLinkButton } from '@/components/ShareLinkButton'
import {
  formatDimensions,
  formatPrice,
  getArUrl,
  getProductUrl,
} from '@/lib/types'
import type { ListingWithSeller } from '@/lib/types'

type Props = {
  listing: ListingWithSeller
  qrDataUrl: string
}

export function ProductDetailView({ listing, qrDataUrl }: Props) {
  const arUrl = getArUrl(listing.id)
  const productUrl = getProductUrl(listing.id)
  const sellerName = listing.seller?.full_name || 'Seller'
  const dims = formatDimensions(
    listing.width_cm,
    listing.depth_cm,
    listing.height_cm
  )

  return (
    <main className="product-page page-shell">
      <nav className="product-page__breadcrumb" aria-label="Breadcrumb">
        <Link href="/catalogue">Collection</Link>
        <span aria-hidden>/</span>
        <span>{listing.category}</span>
      </nav>

      <div className="product-page__grid">
        <div className="product-page__viewer">
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

        <div className="product-page__meta">
          <span className="badge">{listing.category}</span>
          <h1 className="product-page__title">{listing.title}</h1>
          <p className="product-price">{formatPrice(listing.price_cents)}</p>

          <div className="product-page__actions">
            <Link href={`/ar/${listing.id}`} className="btn-accent product-page__cta-main">
              Try in your room
            </Link>
            <ContactSellerButton
              listingId={listing.id}
              email={listing.seller?.email ?? null}
              phone={listing.seller?.phone ?? null}
            />
            <ShareLinkButton url={arUrl} label="Copy AR link" />
          </div>

          <div className="product-page__details">
            <h2>About this piece</h2>
            <p>{listing.description}</p>
          </div>

          <dl className="product-page__specs">
            <div>
              <dt>Dimensions</dt>
              <dd>{dims}</dd>
            </div>
            {listing.location && (
              <div>
                <dt>Location</dt>
                <dd>{listing.location}</dd>
              </div>
            )}
            <div>
              <dt>Seller</dt>
              <dd>{sellerName}</dd>
            </div>
          </dl>

          <div className="qr-panel product-page__qr">
            <div>
              <p className="product-page__qr-title">Scan for AR on another device</p>
              <p className="product-page__qr-url">{arUrl}</p>
            </div>
            <img src={qrDataUrl} alt="QR code for AR preview" width={120} height={120} />
          </div>

          <ShareLinkButton url={productUrl} label="Copy product link" />
        </div>
      </div>
    </main>
  )
}
