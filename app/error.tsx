'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const isDb =
    error.message?.includes('PGRST205') ||
    error.message?.includes('schema cache') ||
    error.message?.includes('listings')

  return (
    <main className="page-shell empty-state">
      <h1 className="page-title">Something went wrong</h1>
      {isDb ? (
        <p>
          The database may not be set up yet. Run{' '}
          <code>supabase/migrations/001_initial.sql</code> in your Supabase SQL Editor, then
          refresh.
        </p>
      ) : (
        <p>{error.message || 'An unexpected error occurred.'}</p>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
        <button type="button" className="btn-secondary" onClick={() => reset()}>
          Try again
        </button>
        <Link href="/" className="btn-primary">
          Home
        </Link>
      </div>
    </main>
  )
}
