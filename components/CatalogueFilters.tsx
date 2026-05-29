'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { CATEGORIES } from '@/lib/types'

export function CatalogueFilters() {
  const router = useRouter()
  const params = useSearchParams()

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.push(`/?${next.toString()}`)
  }

  return (
    <form
      className="filter-bar"
      onSubmit={(e) => e.preventDefault()}
      aria-label="Filter catalogue"
    >
      <select
        name="category"
        defaultValue={params.get('category') ?? ''}
        onChange={(e) => update('category', e.target.value)}
        aria-label="Category"
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
      />
      <input
        type="number"
        name="maxPrice"
        placeholder="Max price ($)"
        defaultValue={params.get('maxPrice') ?? ''}
        onBlur={(e) => update('maxPrice', e.target.value)}
        aria-label="Maximum price"
      />
      <input
        type="text"
        name="location"
        placeholder="Location"
        defaultValue={params.get('location') ?? ''}
        onBlur={(e) => update('location', e.target.value)}
        aria-label="Seller location"
      />
    </form>
  )
}
