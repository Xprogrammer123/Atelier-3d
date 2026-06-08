'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { btnAccent, btnSecondary } from '@/lib/ui'
import { cn } from '@/lib/cn'

type Props = {
  listingId: string
  listingTitle?: string
  viewHref: string
  viewLabel: string
}

export function ListingActionRow({ listingId, listingTitle, viewHref, viewLabel }: Props) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!showConfirm) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !deleting) setShowConfirm(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showConfirm, deleting])

  function openConfirm() {
    setError(null)
    setShowConfirm(true)
  }

  function closeConfirm() {
    if (deleting) return
    setShowConfirm(false)
    setError(null)
  }

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/listings/${listingId}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        setError(body.error ?? 'Failed to delete listing')
        return
      }
      setShowConfirm(false)
      router.refresh()
    } catch {
      setError('Network error. Try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="flex gap-2 w-full items-stretch">
        <Link
          href={viewHref}
          className={cn(btnSecondary, 'w-[80%] min-h-11 text-center justify-center shrink-0')}
        >
          {viewLabel}
        </Link>
        <button
          type="button"
          onClick={openConfirm}
          disabled={deleting}
          aria-label="Delete listing"
          title="Delete listing"
          className={cn(
            btnSecondary,
            'w-[20%] min-h-11 shrink-0 grid place-items-center px-0',
            'text-[#8b2e1f] border-[#e8b4a8] hover:bg-[#fde8e4] hover:border-[#e8b4a8]',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <TrashIcon />
        </button>
      </div>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 grid place-items-center p-6 bg-[color-mix(in_oklab,var(--color-ink-strong)_35%,transparent)] backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-listing-title"
          onClick={closeConfirm}
        >
          <div
            className="w-full max-w-md p-6 sm:p-7 bg-surface-paper border border-line rounded-lg shadow-lift grid gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid gap-2">
              <h2 id="delete-listing-title" className="m-0 font-display text-xl font-semibold text-ink-strong">
                Delete listing?
              </h2>
              <p className="m-0 text-[0.92rem] leading-relaxed text-ink-soft">
                {listingTitle ? (
                  <>
                    <strong className="font-semibold text-ink-strong">{listingTitle}</strong> will be permanently
                    removed. This cannot be undone.
                  </>
                ) : (
                  'This listing will be permanently removed. This cannot be undone.'
                )}
              </p>
            </div>

            {error && (
              <p className="m-0 p-3 rounded-sm bg-[#fde8e4] border border-[#e8b4a8] text-[#8b2e1f] text-[0.88rem]" role="alert">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-3 justify-end">
              <button type="button" className={btnSecondary} onClick={closeConfirm} disabled={deleting}>
                Cancel
              </button>
              <button
                type="button"
                className={cn(btnAccent, 'bg-[#8b2e1f] hover:bg-[#7a2819]')}
                onClick={() => void handleDelete()}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete listing'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}
