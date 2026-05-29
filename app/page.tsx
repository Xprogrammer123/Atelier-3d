import { Suspense } from 'react'
import { CatalogueFilters } from '@/components/CatalogueFilters'
import { ProductCard } from '@/components/ProductCard'
import { getLiveListings } from '@/lib/listings'

type SearchParams = Promise<{
  category?: string
  minPrice?: string
  maxPrice?: string
  location?: string
}>

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const listings = await getLiveListings({
    category: params.category,
    minPrice: params.minPrice ? Number(params.minPrice) * 100 : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) * 100 : undefined,
    location: params.location,
  })

  return (
    <main className="catalog-screen page-shell">
      <section className="catalog-hero">
        <h1 className="catalog-title">
          Furnish your space <em>before you buy.</em>
        </h1>
        <p className="page-lede">
          Browse curated furniture with auto-rotating 3D previews. Tap Try in AR to place any
          piece in your real room — no app download.
        </p>
      </section>

      <Suspense fallback={<div className="filter-bar">Loading filters…</div>}>
        <CatalogueFilters />
      </Suspense>

      {listings.length === 0 ? (
        <div className="empty-state">
          <p>No live listings yet.</p>
          <p>
            <a href="/auth/register">Register as a seller</a> to list your first piece.
          </p>
        </div>
      ) : (
        <section className="catalog-grid" aria-label="Furniture catalogue">
          {listings.map((listing) => (
            <ProductCard key={listing.id} listing={listing} />
          ))}
        </section>
      )}
    </main>
  )
}
