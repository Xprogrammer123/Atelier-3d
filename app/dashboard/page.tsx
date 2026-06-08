import Link from 'next/link'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { DbSetupBanner } from '@/components/DbSetupBanner'
import { ListingActionRow } from '@/components/dashboard/ListingActionRow'
import { ProductModelViewer } from '@/components/ProductModelViewer'
import { getSiteOrigin } from '@/lib/app-url-server'
import { getSellerListings } from '@/lib/listings'
import { createClient } from '@/lib/supabase/server'
import { formatPrice, getArUrl } from '@/lib/types'
import { generateQrDataUrl } from '@/lib/qr'
import { btnAccent, btnPrimary, emptyState, pageLede, pageShell, pageTitle } from '@/lib/ui'
import { cn } from '@/lib/cn'

const statusPillStyles: Record<string, string> = {
  live: 'bg-[color-mix(in_oklab,var(--color-accent-sage)_30%,white)]',
  processing: 'bg-[color-mix(in_oklab,var(--color-accent-peach)_50%,white)]',
  failed: 'bg-[#fde8e4] text-[#8b2e1f]',
  sold: 'bg-line',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { listings, dbSetupRequired } = await getSellerListings(user.id)
  const siteOrigin = await getSiteOrigin()

  return (
    <main className={pageShell}>
      {dbSetupRequired && <DbSetupBanner />}
      <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
        <div>
          <h1 className={pageTitle}>Seller dashboard</h1>
          <p className={cn(pageLede, 'mb-0')}>
            Manage listings, download QR codes, and track engagement.
          </p>
        </div>
        <Link id="link-create-listing" href="/dashboard/create" className={cn(btnAccent, 'pendo-create-listing')}>
          + Create listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className={emptyState}>
          <p>No listings yet.</p>
          <Link href="/dashboard/create" className={cn(btnPrimary, 'pendo-create-listing', 'inline-flex mt-4')}>
            Create your first listing
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {await Promise.all(
            listings.map(async (listing) => {
              const arUrl = getArUrl(listing.id, siteOrigin)
              const qr = listing.status === 'live' ? await generateQrDataUrl(arUrl) : null
              const jobStatus = listing.processing_jobs?.[0]?.status

              return (
                <article
                  key={listing.id}
                  className="flex flex-col h-full overflow-hidden border border-line rounded-md bg-surface-paper"
                >
                  <div className="aspect-[4/3] border-b border-line bg-[color-mix(in_oklab,var(--color-surface-paper)_92%,var(--color-accent-peach))]">
                    {listing.glb_url ? (
                      <ProductModelViewer
                        src={listing.glb_url}
                        alt={listing.title}
                        poster={listing.poster_url ?? undefined}
                        loading="lazy"
                        autoRotate
                      />
                    ) : (
                      <div className="h-full grid place-items-center px-4 text-center text-[0.85rem] text-ink-muted">
                        {listing.status === 'processing' ? '3D model processing…' : 'No 3D preview yet'}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col flex-1 p-5">
                    <div className="flex gap-4 items-start justify-between">
                      <div className="flex-1 min-w-0 grid gap-2">
                        <h2 className="m-0 font-display text-xl leading-snug text-ink-strong">{listing.title}</h2>
                        <p className="m-0 font-semibold text-accent-clay">{formatPrice(listing.price_cents)}</p>
                        <span
                          className={cn(
                            'inline-block w-fit text-[0.7rem] font-semibold tracking-widest uppercase px-[0.6rem] py-[0.3rem] rounded-xs',
                            statusPillStyles[listing.status] ?? 'bg-line'
                          )}
                        >
                          {listing.status}
                          {jobStatus && listing.status === 'processing' ? ` · ${jobStatus}` : ''}
                        </span>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[0.8rem] text-ink-muted">
                          <span>{listing.views_count} views</span>
                          <span>{listing.ar_sessions_count} AR</span>
                          <span>{listing.enquiries_count} enquiries</span>
                        </div>
                      </div>

                      {listing.status === 'live' && qr && (
                        <a
                          href={qr}
                          download={`atelier-${listing.id}.png`}
                          className="shrink-0 rounded-sm border border-line p-1.5 bg-white hover:border-accent-clay-soft transition-colors"
                          title="Download QR code"
                        >
                          <Image src={qr} alt="QR code for AR" width={72} height={72} unoptimized />
                        </a>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-line">
                      {listing.status === 'processing' && (
                        <ListingActionRow
                          listingId={listing.id}
                          listingTitle={listing.title}
                          viewHref={`/dashboard/listing/${listing.id}/status`}
                          viewLabel="View status"
                        />
                      )}
                      {listing.status === 'live' && (
                        <ListingActionRow
                          listingId={listing.id}
                          listingTitle={listing.title}
                          viewHref={`/product/${listing.id}`}
                          viewLabel="View listing"
                        />
                      )}
                      {listing.status === 'failed' && (
                        <ListingActionRow
                          listingId={listing.id}
                          listingTitle={listing.title}
                          viewHref={`/dashboard/listing/${listing.id}/status`}
                          viewLabel="Retry"
                        />
                      )}
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </div>
      )}
    </main>
  )
}
