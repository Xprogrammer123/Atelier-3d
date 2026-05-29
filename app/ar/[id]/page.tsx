import Link from 'next/link'
import { notFound } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ArCoreBanner } from '@/components/ArCoreBanner'
import { ContactSellerButton } from '@/components/ContactSellerButton'
import { getListingById } from '@/lib/listings'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/types'

const ProductModelViewer = dynamic(
  () => import('@/components/ProductModelViewer').then((m) => m.ProductModelViewer),
  { ssr: false }
)

type Props = { params: Promise<{ id: string }> }

export default async function ArDirectPage({ params }: Props) {
  const { id } = await params
  const listing = await getListingById(id)

  if (!listing || listing.status !== 'live' || !listing.glb_url) {
    notFound()
  }

  const supabase = await createClient()
  await supabase.rpc('increment_listing_ar_sessions', { listing_uuid: id })

  return (
    <div className="ar-page">
      <header className="ar-page__header">
        <Link
          href={`/product/${id}`}
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
          src={listing.glb_url}
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
          listingId={id}
          email={listing.seller?.email ?? null}
          phone={listing.seller?.phone ?? null}
        />
      </footer>
    </div>
  )
}
