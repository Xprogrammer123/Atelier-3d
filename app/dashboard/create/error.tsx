'use client'

import Link from 'next/link'
import { btnPrimary, btnSecondary, emptyState, pageShell, pageTitle } from '@/lib/ui'

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
    <main className={pageShell}>
      <div className={emptyState}>
        <h1 className={pageTitle}>Page failed to load</h1>
        {isCache ? (
          <p>
            The dev build cache is out of date. Stop the server, run{' '}
            <code className="text-[0.85em] px-[0.4em] py-[0.15em] rounded-xs bg-surface-strong border border-line">
              npm run dev:fresh
            </code>
            , then reload.
          </p>
        ) : (
          <p>{error.message || 'Something went wrong.'}</p>
        )}
        <div className="flex gap-2 justify-center mt-4">
          <button type="button" className={btnSecondary} onClick={() => reset()}>
            Try again
          </button>
          <Link href="/dashboard" className={btnPrimary}>
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
