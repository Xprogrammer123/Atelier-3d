'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { btnSecondary } from '@/lib/ui'
import { cn } from '@/lib/cn'

type Props = {
  listingId: string
  viewHref: string
  viewLabel: string
}

export function ListingActionRow({ listingId, viewHref, viewLabel }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this listing? This cannot be undone.')) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/listings/${listingId}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        alert(body.error ?? 'Failed to delete listing')
        return
      }
      router.refresh()
    } catch {
      alert('Network error. Try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex gap-2 w-full items-stretch">
      <Link
        href={viewHref}
        className={cn(btnSecondary, 'w-[80%] min-h-11 text-center justify-center shrink-0')}
      >
        {viewLabel}
      </Link>
      <button
        type="button"
        onClick={() => void handleDelete()}
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
