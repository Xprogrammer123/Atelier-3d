'use client'

import Link from 'next/link'

export default function CreateListingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const isCache =
    error.message?.includes('ENOENT') ||
    error.message?.includes('build-manifest')

  return (
    <main className="page-shell empty-state">
      <h1 className="page-title">Page failed to load</h1>
      {isCache ? (
        <p>
          The dev build cache is out of date. Stop the server, run{' '}
          <code>npm run dev:fresh</code>, then reload.
        </p>
      ) : (
        <p>{error.message || 'Something went wrong.'}</p>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
        <button type="button" className="btn-secondary" onClick={() => reset()}>
          Try again
        </button>
        <Link href="/dashboard" className="btn-primary">
          Dashboard
        </Link>
      </div>
    </main>
  )
}
