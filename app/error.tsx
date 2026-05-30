'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { btnPrimary, btnSecondary, emptyState, pageShell, pageTitle } from '@/lib/ui'

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
    <main className={pageShell}>
      <div className={emptyState}>
        <h1 className={pageTitle}>Something went wrong</h1>
        {isDb ? (
          <p>
            The database may not be set up yet. Run{' '}
            <code className="text-[0.85em] px-[0.4em] py-[0.15em] rounded-xs bg-surface-strong border border-line">
              supabase/migrations/001_initial.sql
            </code>{' '}
            in your Supabase SQL Editor, then refresh.
          </p>
        ) : (
          <p>{error.message || 'An unexpected error occurred.'}</p>
        )}
        <div className="flex gap-2 justify-center mt-4">
          <button type="button" className={btnSecondary} onClick={() => reset()}>
            Try again
          </button>
          <Link href="/" className={btnPrimary}>
            Home
          </Link>
        </div>
      </div>
    </main>
  )
}
