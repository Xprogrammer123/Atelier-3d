import Link from 'next/link'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { DbSetupBanner } from '@/components/DbSetupBanner'
import { getSiteOrigin } from '@/lib/app-url-server'
import { getSellerListings } from '@/lib/listings'
import { createClient } from '@/lib/supabase/server'
import { formatPrice, getArUrl } from '@/lib/types'
import { generateQrDataUrl } from '@/lib/qr'
import { btnAccent, btnPrimary, btnSecondary, emptyState, pageLede, pageShell, pageTitle } from '@/lib/ui'
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
        <div className="grid gap-4">
          {await Promise.all(
            listings.map(async (listing) => {
              const arUrl = getArUrl(listing.id, siteOrigin)
              const qr = listing.status === 'live' ? await generateQrDataUrl(arUrl) : null
              const jobStatus = listing.processing_jobs?.[0]?.status

              return (
                <article
                  key={listing.id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 p-5 border border-line rounded-md bg-surface-paper items-center"
                >
                  <div>
                    <h2 className="m-0 mb-[0.35rem] font-display text-xl">{listing.title}</h2>
                    <p className="m-0">{formatPrice(listing.price_cents)}</p>
                    <span
                      className={cn(
                        'inline-block mt-2 text-[0.7rem] font-semibold tracking-widest uppercase px-[0.6rem] py-[0.3rem] rounded-xs',
                        statusPillStyles[listing.status] ?? 'bg-line'
                      )}
                    >
                      {listing.status}
                      {jobStatus && listing.status === 'processing' ? ` · ${jobStatus}` : ''}
                    </span>
                    <div className="flex gap-6 mt-2 text-[0.8rem] text-ink-muted">
                      <span>{listing.views_count} views</span>
                      <span>{listing.ar_sessions_count} AR sessions</span>
                      <span>{listing.enquiries_count} enquiries</span>
                    </div>
                  </div>
                  <div className="grid gap-2 justify-items-end">
                    {listing.status === 'processing' && (
                      <Link href={`/dashboard/listing/${listing.id}/status`} className={btnSecondary}>
                        View status
                      </Link>
                    )}
                    {listing.status === 'live' && (
                      <>
                        {qr && (
                          <a href={qr} download={`atelier-${listing.id}.png`}>
                            <Image src={qr} alt="QR" width={80} height={80} unoptimized />
                          </a>
                        )}
                        <Link href={`/product/${listing.id}`} className={btnSecondary}>
                          View listing
                        </Link>
                      </>
                    )}
                    {listing.status === 'failed' && (
                      <Link href={`/dashboard/listing/${listing.id}/status`} className={btnSecondary}>
                        Retry
                      </Link>
                    )}
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
