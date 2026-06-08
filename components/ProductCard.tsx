'use client'

import Link from 'next/link'
import { ProductModelViewer } from '@/components/ProductModelViewer'
import { formatPrice } from '@/lib/types'
import type { ListingWithSeller } from '@/lib/types'
import { btnAccent, btnSecondary } from '@/lib/ui'
import { cn } from '@/lib/cn'

type Props = {
  listing: ListingWithSeller
}

export function ProductCard({ listing }: Props) {
  const sellerName = listing.seller?.full_name || 'Seller'
  const glb = listing.glb_url

  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-line bg-surface-paper shadow-soft',
        'transition-[transform,box-shadow] duration-200 ease-out',
        'hover:-translate-y-[3px] hover:shadow-lift',
        '[@media(hover:none)]:hover:translate-y-0 [@media(hover:none)]:hover:shadow-soft'
      )}
    >
      <div className="aspect-[4/3] border-b border-line bg-[color-mix(in_oklab,var(--color-surface-paper)_92%,var(--color-accent-peach))]">
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
          <div className="h-full grid place-items-center text-ink-muted text-[0.85rem]">
            3D preview loading…
          </div>
        )}
      </div>
      <div className="p-[1.1rem] px-5 grid gap-[0.35rem]">
        <p className="m-0 text-[0.66rem] font-semibold tracking-[0.2em] uppercase text-ink-muted">
          {listing.category}
        </p>
        <h2 className="m-0 font-display text-2xl font-semibold text-ink-strong">
          <Link href={`/product/${listing.id}`} className="hover:text-accent-clay transition-colors">
            {listing.title}
          </Link>
        </h2>
        <p className="m-0 font-semibold text-accent-clay">{formatPrice(listing.price_cents)}</p>
        <p className="m-0 text-[0.8rem] text-ink-muted">{sellerName}</p>
        <div className="flex flex-wrap gap-2 mt-[0.85rem] max-sm:flex-col">
          <Link
            id={`link-view-details-${listing.id}`}
            href={`/product/${listing.id}`}
            className={cn(btnSecondary, 'pendo-view-details', 'flex-1 min-h-11 text-center max-sm:w-full')}
          >
            View details
          </Link>
          <Link
            id={`link-try-ar-${listing.id}`}
            href={`/ar/${listing.id}`}
            className={cn(btnAccent, 'pendo-try-ar', 'flex-1 min-h-11 text-center shadow-[0_8px_20px_rgba(44,33,22,0.12)] max-sm:w-full')}
          >
            Try in AR
          </Link>
        </div>
      </div>
    </article>
  )
}
