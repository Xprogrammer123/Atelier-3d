import Link from 'next/link'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { getSellerListings } from '@/lib/listings'
import { createClient } from '@/lib/supabase/server'
import { formatPrice, getArUrl } from '@/lib/types'
import { generateQrDataUrl } from '@/lib/qr'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const listings = await getSellerListings(user.id)

  return (
    <main className="page-shell">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Seller dashboard</h1>
          <p className="page-lede" style={{ margin: 0 }}>
            Manage listings, download QR codes, and track engagement.
          </p>
        </div>
        <Link href="/dashboard/create" className="btn-accent">
          + Create listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="empty-state">
          <p>No listings yet.</p>
          <Link href="/dashboard/create" className="btn-primary">
            Create your first listing
          </Link>
        </div>
      ) : (
        <div className="dashboard-grid">
          {await Promise.all(
            listings.map(async (listing) => {
              const arUrl = getArUrl(listing.id)
              const qr =
                listing.status === 'live'
                  ? await generateQrDataUrl(arUrl)
                  : null
              const jobStatus =
                Array.isArray(listing.job) && listing.job[0]
                  ? (listing.job[0] as { status: string }).status
                  : (listing.job as { status: string } | null)?.status

              return (
                <article key={listing.id} className="listing-row">
                  <div>
                    <h2 style={{ margin: '0 0 0.35rem', fontFamily: 'var(--font-display)' }}>
                      {listing.title}
                    </h2>
                    <p style={{ margin: 0 }}>{formatPrice(listing.price_cents)}</p>
                    <span className={`status-pill status-pill--${listing.status}`}>
                      {listing.status}
                      {jobStatus && listing.status === 'processing' ? ` · ${jobStatus}` : ''}
                    </span>
                    <div className="analytics-row" style={{ marginTop: '0.5rem' }}>
                      <span>{listing.views_count} views</span>
                      <span>{listing.ar_sessions_count} AR sessions</span>
                      <span>{listing.enquiries_count} enquiries</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: '0.5rem', justifyItems: 'end' }}>
                    {listing.status === 'processing' && (
                      <Link href={`/dashboard/listing/${listing.id}/status`} className="btn-secondary">
                        View status
                      </Link>
                    )}
                    {listing.status === 'live' && (
                      <>
                        {qr && (
                          <a href={qr} download={`furnishar-${listing.id}.png`}>
                            <Image src={qr} alt="QR" width={80} height={80} unoptimized />
                          </a>
                        )}
                        <Link href={`/product/${listing.id}`} className="btn-secondary">
                          View listing
                        </Link>
                      </>
                    )}
                    {listing.status === 'failed' && (
                      <Link href={`/dashboard/listing/${listing.id}/status`} className="btn-secondary">
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
