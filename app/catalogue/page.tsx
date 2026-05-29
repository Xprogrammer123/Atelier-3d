import { Suspense } from 'react'
import { CatalogueFilters } from '@/components/CatalogueFilters'
import { DbSetupBanner } from '@/components/DbSetupBanner'
import { ProductCard } from '@/components/ProductCard'
import { getLiveListings } from '@/lib/listings'

type SearchParams = Promise<{
  category?: string
  minPrice?: string
  maxPrice?: string
  location?: string
}>

export const metadata = {
  title: 'Shop — FurnishAR',
  description: 'Browse furniture with 3D previews and AR placement.',
}

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const { listings, dbSetupRequired } = await getLiveListings({
    category: params.category,
    minPrice: params.minPrice ? Number(params.minPrice) * 100 : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) * 100 : undefined,
    location: params.location,
  })

  return (
    <main className="catalog-screen page-shell">
      <section className="catalog-hero">
        <p className="catalog-eyebrow">Collection</p>
        <h1 className="catalog-title">
          Curated pieces, <em>placed in your room.</em>
        </h1>
        <p className="catalog-lede">
          Filter by category, price, and location. Every listing includes a 3D preview and
          one-tap AR on mobile.
        </p>
      </section>

      {dbSetupRequired && <DbSetupBanner />}

      <Suspense fallback={<div className="filter-bar">Loading filters…</div>}>
        <CatalogueFilters />
      </Suspense>

      {!dbSetupRequired && listings.length === 0 ? (
        <div className="empty-state">
          <p>No live listings yet.</p>
          <p>
            <a href="/auth/register">Register as a seller</a> to list your first piece.
          </p>
        </div>
      ) : !dbSetupRequired ? (
        <section className="catalog-grid" aria-label="Furniture catalogue">
          {listings.map((listing) => (
            <ProductCard key={listing.id} listing={listing} />
          ))}
        </section>
      ) : null}
    </main>
  )
}
