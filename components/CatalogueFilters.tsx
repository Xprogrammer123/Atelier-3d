'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { pendoTrack } from '@/lib/pendo-client'
import { CATEGORIES } from '@/lib/types'
import { cn } from '@/lib/cn'
import { formInput } from '@/lib/ui'

export function CatalogueFilters() {
  const router = useRouter()
  const params = useSearchParams()

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    const filtersCount = Array.from(next.values()).filter(Boolean).length
    pendoTrack('catalogue_filtered', {
      category: next.get('category') ?? '',
      min_price: next.get('minPrice') ?? '',
      max_price: next.get('maxPrice') ?? '',
      location: next.get('location') ?? '',
      filters_applied_count: filtersCount,
    })
    router.push(`/catalogue?${next.toString()}`)
  }

  return (
    <form
      className="flex flex-wrap gap-3 p-4 bg-surface-paper border border-line rounded-md"
      onSubmit={(e) => e.preventDefault()}
      aria-label="Filter catalogue"
    >
      <select
        name="category"
        defaultValue={params.get('category') ?? ''}
        onChange={(e) => update('category', e.target.value)}
        aria-label="Category"
        className={cn(formInput, 'min-w-32')}
      >
        <option value="">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input
        type="number"
        name="minPrice"
        placeholder="Min price ($)"
        defaultValue={params.get('minPrice') ?? ''}
        onBlur={(e) => update('minPrice', e.target.value)}
        aria-label="Minimum price"
        className={cn(formInput, 'min-w-32')}
      />
      <input
        type="number"
        name="maxPrice"
        placeholder="Max price ($)"
        defaultValue={params.get('maxPrice') ?? ''}
        onBlur={(e) => update('maxPrice', e.target.value)}
        aria-label="Maximum price"
        className={cn(formInput, 'min-w-32')}
      />
      <input
        type="text"
        name="location"
        placeholder="Location"
        defaultValue={params.get('location') ?? ''}
        onBlur={(e) => update('location', e.target.value)}
        aria-label="Seller location"
        className={cn(formInput, 'min-w-32')}
      />
    </form>
  )
}
