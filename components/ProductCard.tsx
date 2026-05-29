'use client'

import Link from 'next/link'
import { ProductModelViewer } from '@/components/ProductModelViewer'
import { formatPrice } from '@/lib/types'
import type { ListingWithSeller } from '@/lib/types'

type Props = {
  listing: ListingWithSeller
}

export function ProductCard({ listing }: Props) {
  const sellerName = listing.seller?.full_name || 'Seller'
  const glb = listing.glb_url

  return (
    <article className="product-card">
      <div className="product-card__media">
        {glb ? (
          <ProductModelViewer
            src={glb}
            alt={listing.title}
            poster={listing.poster_url ?? undefined}
            loading="lazy"
            autoRotate
            className=""
          />
        ) : (
          <div
            style={{
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--ink-muted)',
              fontSize: '0.85rem',
            }}
          >
            3D preview loading…
          </div>
        )}
      </div>
      <div className="product-card__body">
        <p className="product-card__category">{listing.category}</p>
        <h2 className="product-card__name">
          <Link href={`/product/${listing.id}`}>{listing.title}</Link>
        </h2>
        <p className="product-card__price">{formatPrice(listing.price_cents)}</p>
        <p className="product-card__seller">{sellerName}</p>
        <div className="product-card__actions">
          <Link href={`/product/${listing.id}`} className="btn-secondary">
            View details
          </Link>
          <Link href={`/ar/${listing.id}`} className="btn-accent">
            Try in AR
          </Link>
        </div>
      </div>
    </article>
  )
}
