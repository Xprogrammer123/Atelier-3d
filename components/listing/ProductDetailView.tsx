'use client'

import Link from 'next/link'
import { ProductModelViewer } from '@/components/ProductModelViewer'
import { ContactSellerButton } from '@/components/ContactSellerButton'
import { ShareLinkButton } from '@/components/ShareLinkButton'
import { getClientSiteOrigin } from '@/lib/app-url'
import {
  formatDimensions,
  formatPrice,
  getArUrl,
  getProductUrl,
} from '@/lib/types'
import type { ListingWithSeller } from '@/lib/types'
import { btnAccent, emptyState, pageShell } from '@/lib/ui'
import { cn } from '@/lib/cn'

type Props = {
  listing: ListingWithSeller
  qrDataUrl: string
}

export function ProductDetailView({ listing, qrDataUrl }: Props) {
  const siteOrigin = getClientSiteOrigin()
  const arUrl = getArUrl(listing.id, siteOrigin)
  const productUrl = getProductUrl(listing.id, siteOrigin)
  const sellerName = listing.seller?.full_name || 'Seller'
  const dims = formatDimensions(listing.width_cm, listing.depth_cm, listing.height_cm)

  return (
    <main className={pageShell}>
      <nav
        className="flex items-center gap-2 mb-6 text-[0.82rem] text-ink-muted"
        aria-label="Breadcrumb"
      >
        <Link href="/catalogue" className="hover:text-accent-clay">
          Collection
        </Link>
        <span aria-hidden>/</span>
        <span>{listing.category}</span>
      </nav>

      <div className="grid gap-8 min-[960px]:grid-cols-[1.15fr_0.85fr] min-[960px]:items-start">
        <div className="grid gap-4">
          <div className="aspect-[4/3] rounded-lg border border-line overflow-hidden bg-surface-paper shadow-soft">
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
              <div className={emptyState}>3D model not available</div>
            )}
          </div>

          <div className="hidden min-[960px]:grid gap-4">
            <div className="p-5 border border-line rounded-md bg-surface-paper grid gap-4 justify-items-center text-center">
              <div className="max-w-full">
                <p className="m-0 mb-[0.35rem] font-semibold text-ink-strong">Scan for AR on another device</p>
                <p className="m-0 text-xs text-ink-muted break-all">{arUrl}</p>
              </div>
              <img src={qrDataUrl} alt="QR code for AR preview" width={120} height={120} className="rounded-sm" />
            </div>

          
          </div>
        </div>

        <div className="min-[960px]:sticky min-[960px]:top-6 grid gap-4">
          <span className="inline-block px-[0.6rem] py-1 rounded-xs text-[0.65rem] font-semibold tracking-[0.15em] uppercase bg-[color-mix(in_oklab,var(--color-accent-sage)_25%,white)] text-ink-strong">
            {listing.category}
          </span>
          <h1 className="mt-2 mb-1 font-display text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-tight text-ink-strong">
            {listing.title}
          </h1>
          <p className="m-0 text-2xl font-bold text-accent-clay">{formatPrice(listing.price_cents)}</p>

          <div className="flex flex-col gap-2 my-5 grid grid-cols-2">
            <Link id="link-try-in-room" href={`/ar/${listing.id}`} className={cn(btnAccent, 'w-full text-center justify-center')}>
              Try in your room
            </Link>

            <ShareLinkButton url={arUrl} label="Copy AR link" />
            <ContactSellerButton
              listingId={listing.id}
              email={listing.seller?.email ?? null}
              phone={listing.seller?.phone ?? null}
            />
          </div>

          <div className="py-5 border-y border-line">
            <h2 className="m-0 mb-2 text-[0.72rem] font-semibold tracking-[0.15em] uppercase text-ink-muted">
              About this piece
            </h2>
            <p className="m-0 leading-relaxed text-ink-soft">{listing.description}</p>
          </div>

          <dl className="mt-5 m-0 grid gap-3">
            <div className="grid grid-cols-[6rem_1fr] gap-2">
              <dt className="text-[0.72rem] font-semibold tracking-widest uppercase text-ink-muted">
                Dimensions
              </dt>
              <dd className="m-0 text-ink-strong">{dims}</dd>
            </div>
            {listing.location && (
              <div className="grid grid-cols-[6rem_1fr] gap-2">
                <dt className="text-[0.72rem] font-semibold tracking-widest uppercase text-ink-muted">
                  Location
                </dt>
                <dd className="m-0 text-ink-strong">{listing.location}</dd>
              </div>
            )}
            <div className="grid grid-cols-[6rem_1fr] gap-2">
              <dt className="text-[0.72rem] font-semibold tracking-widest uppercase text-ink-muted">Seller</dt>
              <dd className="m-0 text-ink-strong mb-7">{sellerName}</dd>
            </div>
            <ShareLinkButton url={productUrl} label="Copy product link" />
          </dl>

          <div className="mt-5 p-5 border border-line rounded-md bg-surface-paper grid gap-4 justify-items-center text-center min-[960px]:hidden">
            <div className="max-w-full">
              <p className="m-0 mb-[0.35rem] font-semibold text-ink-strong">Scan for AR on another device</p>
              <p className="m-0 text-xs text-ink-muted break-all">{arUrl}</p>
            </div>
            <img src={qrDataUrl} alt="QR code for AR preview" width={120} height={120} className="rounded-sm" />
          </div>

          <div className="min-[960px]:hidden">
            <ShareLinkButton url={productUrl} label="Copy product link" />
          </div>
        </div>
      </div>
    </main>
  )
}
