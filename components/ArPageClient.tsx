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
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#0d0b09] to-[#18130f] text-white grid grid-rows-[auto_1fr_auto]">
      <header className="flex items-center justify-between gap-4 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <Link
          href={`/product/${listing.id}`}
          className="text-white px-3 py-2 border border-white/20 rounded-sm"
        >
          ← Back
        </Link>
        <div className="text-right">
          <p className="m-0 text-[0.65rem] tracking-[0.2em] opacity-60">PREVIEWING</p>
          <p className="m-0 font-display text-[1.1rem]">{listing.title}</p>
        </div>
      </header>

      <div className="min-h-0 px-4 [&_model-viewer]:w-full [&_model-viewer]:h-full [&_model-viewer]:min-h-[50vh]">
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

      <footer className="px-5 py-4 pb-[max(1.2rem,env(safe-area-inset-bottom))] border-t border-white/8 bg-[rgba(12,10,8,0.9)] grid gap-3">
        <ArCoreBanner />
        <p className="m-0 text-xl font-bold">{formatPrice(listing.price_cents)}</p>
        <ContactSellerButton
          listingId={listing.id}
          email={listing.seller?.email ?? null}
          phone={listing.seller?.phone ?? null}
        />
      </footer>
    </div>
  )
}
