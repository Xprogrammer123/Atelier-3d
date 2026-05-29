'use client'

import Link from 'next/link'
import { ArCoreBanner } from '@/components/ArCoreBanner'
import { ContactSellerButton } from '@/components/ContactSellerButton'
import { ProductModelViewer } from '@/components/ProductModelViewer'
import { formatPrice } from '@/lib/types'
import type { ListingWithSeller } from '@/lib/types'

type Props = {
  listing: ListingWithSeller
}

export function ArPageClient({ listing }: Props) {
  return (
    <div className="ar-page">
      <header className="ar-page__header">
        <Link
          href={`/product/${listing.id}`}
          style={{
            color: 'white',
            padding: '0.5rem 0.75rem',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          ← Back
        </Link>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '0.65rem', letterSpacing: '0.2em', opacity: 0.6 }}>
            PREVIEWING
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: '1.1rem',
            }}
          >
            {listing.title}
          </p>
        </div>
      </header>

      <div className="ar-page__viewer">
        <ProductModelViewer
          src={listing.glb_url!}
          alt={listing.title}
          poster={listing.poster_url ?? undefined}
          loading="eager"
          autoRotate={false}
          ar
          eagerAr
        />
      </div>

      <footer className="ar-page__footer">
        <ArCoreBanner />
        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
          {formatPrice(listing.price_cents)}
        </p>
        <ContactSellerButton
          listingId={listing.id}
          email={listing.seller?.email ?? null}
          phone={listing.seller?.phone ?? null}
        />
      </footer>
    </div>
  )
}
