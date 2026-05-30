import { Suspense } from 'react'
import { CatalogueFilters } from '@/components/CatalogueFilters'
import { DbSetupBanner } from '@/components/DbSetupBanner'
import { ProductCard } from '@/components/ProductCard'
import { getLiveListings } from '@/lib/listings'
import { catalogEyebrow, emptyState, pageLede, pageShell } from '@/lib/ui'
import { cn } from '@/lib/cn'

type SearchParams = Promise<{
  category?: string
  minPrice?: string
  maxPrice?: string
  location?: string
}>

export const metadata = {
  title: 'Collection — Atelier',
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
    <main className={cn(pageShell, 'relative min-h-svh flex flex-col gap-[clamp(1.2rem,3vw,2rem)] max-sm:px-4')}>
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden
        style={{
          background:
            'radial-gradient(60rem 30rem at 85% -10%, color-mix(in oklab, var(--color-accent-peach) 35%, transparent), transparent 60%), radial-gradient(50rem 28rem at -10% 110%, color-mix(in oklab, var(--color-accent-sage) 22%, transparent), transparent 60%)',
        }}
      />

      <section className="max-w-[52rem]">
        <p className={catalogEyebrow}>Collection</p>
        <h1 className="m-0 font-display font-semibold text-[clamp(2.2rem,6vw,4.5rem)] leading-[0.98] text-ink-strong max-sm:text-[clamp(2rem,9vw,2.8rem)]">
          Curated pieces, <em className="italic text-accent-clay">placed in your room.</em>
        </h1>
        <p className={pageLede}>
          Filter by category, price, and location. Every listing includes a 3D preview and
          one-tap AR on mobile.
        </p>
      </section>

      {dbSetupRequired && <DbSetupBanner />}

      <Suspense
        fallback={
          <div className="flex flex-wrap gap-3 p-4 bg-surface-paper border border-line rounded-md">
            Loading filters…
          </div>
        }
      >
        <CatalogueFilters />
      </Suspense>

      {!dbSetupRequired && listings.length === 0 ? (
        <div className={emptyState}>
          <p>No live listings yet.</p>
          <p>
            <a href="/auth/register" className="underline hover:text-accent-clay">
              Register as a seller
            </a>{' '}
            to list your first piece.
          </p>
        </div>
      ) : !dbSetupRequired ? (
        <section
          className="grid gap-[1.2rem] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          aria-label="Furniture catalogue"
        >
          {listings.map((listing) => (
            <ProductCard key={listing.id} listing={listing} />
          ))}
        </section>
      ) : null}
    </main>
  )
}
