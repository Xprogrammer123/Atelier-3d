'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import type { JobStatus } from '@/lib/types'
import { pendoTrack } from '@/lib/pendo-client'
import { btnAccent, btnSecondary, catalogEyebrow, pageTitle } from '@/lib/ui'
import { cn } from '@/lib/cn'

const ProductModelViewer = dynamic(
  () => import('@/components/ProductModelViewer').then((m) => m.ProductModelViewer),
  { ssr: false }
)

type Props = {
  listingId: string
  initialStatus: JobStatus
  glbUrl: string | null
  posterUrl: string | null
  title: string
  errorMessage: string | null
}

const STEPS = [
  { key: 'queued', label: 'Queued' },
  { key: 'generating', label: 'Generating' },
  { key: 'complete', label: 'Live' },
] as const

export function ProcessingStatusView({
  listingId,
  initialStatus,
  glbUrl,
  posterUrl,
  title,
  errorMessage,
}: Props) {
  const [status, setStatus] = useState<JobStatus>(initialStatus)
  const [glb, setGlb] = useState(glbUrl)
  const [error, setError] = useState(errorMessage)
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`job-${listingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'processing_jobs',
          filter: `listing_id=eq.${listingId}`,
        },
        (payload) => {
          const row = payload.new as { status: JobStatus; error_message: string | null }
          setStatus(row.status)
          if (row.error_message) setError(row.error_message)
        }
      )
      .subscribe()

    const poll = setInterval(async () => {
      const res = await fetch(`/api/listings/${listingId}/status`)
      if (!res.ok) return
      const data = (await res.json()) as {
        status: JobStatus
        glb_url: string | null
        poster_url: string | null
        error_message: string | null
      }
      setStatus(data.status)
      if (data.glb_url) setGlb(data.glb_url)
      if (data.error_message) setError(data.error_message)
    }, 4000)

    return () => {
      void supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [listingId])

  const activeIndex =
    status === 'failed'
      ? -1
      : status === 'complete'
        ? 2
        : status === 'generating'
          ? 1
          : 0

  async function handleRetry() {
    setRetrying(true)
    setError(null)
    await fetch('/api/jobs/retry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId }),
    })
    pendoTrack('model_generation_retried', {
      listing_id: listingId,
    })
    setStatus('queued')
    setRetrying(false)
  }

  return (
    <div>
      <header className="mb-8">
        <Link
          href="/dashboard"
          className="inline-block mb-3 text-[0.82rem] font-semibold text-ink-muted hover:text-accent-clay"
        >
          ← Dashboard
        </Link>
        <p className={catalogEyebrow}>Processing listing</p>
        <h1 className={pageTitle}>{title}</h1>
      </header>

      <div className="flex mb-8 border border-line rounded-md overflow-hidden bg-surface-paper">
        {STEPS.map((step, i) => (
          <div
            key={step.key}
            className={cn(
              'flex-1 flex flex-col items-center gap-2 py-4 px-2 text-[0.72rem] font-semibold tracking-widest uppercase text-ink-muted border-r border-line last:border-r-0',
              i < activeIndex && 'text-accent-sage',
              i === activeIndex && 'bg-[color-mix(in_oklab,var(--color-accent-peach)_40%,white)] text-ink-strong'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full bg-line',
                i === activeIndex &&
                  'bg-accent-clay shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-accent-clay)_25%,transparent)]',
                i < activeIndex && 'bg-accent-sage'
              )}
            />
            <span>{step.label}</span>
          </div>
        ))}
      </div>

      <div>
        {status === 'failed' && (
          <div className="p-8 bg-[#fdf6f4] border border-[#e8b4a8] rounded-lg text-center grid gap-4 justify-items-center">
            <h2 className="m-0 font-display text-[1.75rem] font-semibold">Generation failed</h2>
            <p className="m-0 max-w-md leading-relaxed text-ink-soft">
              {error ?? 'Something went wrong during 3D generation.'}
            </p>
            <p className="m-0 max-w-md text-[0.85rem] text-ink-muted">
              Ensure Blender is installed and <code className="text-[0.85em] px-[0.4em] py-[0.15em] rounded-xs bg-surface-strong border border-line">npm run worker</code> is running, or retry
              the job.
            </p>
            <div className="flex flex-wrap gap-[0.65rem] justify-center">
              <button
                type="button"
                className={btnAccent}
                disabled={retrying}
                onClick={() => void handleRetry()}
              >
                {retrying ? 'Retrying…' : 'Retry generation'}
              </button>
              <Link href="/dashboard/create" className={btnSecondary}>
                New listing
              </Link>
            </div>
          </div>
        )}

        {(status === 'queued' || status === 'generating') && (
          <div className="p-8 bg-surface-paper border border-line rounded-lg text-center grid gap-4 justify-items-center">
            <div
              className="size-10 border-[3px] border-line border-t-accent-clay rounded-full animate-listing-spin"
              aria-hidden
            />
            <h2 className="m-0 font-display text-[1.75rem] font-semibold">
              {status === 'queued' ? 'Waiting in queue' : 'Building your 3D model'}
            </h2>
            <p className="m-0 max-w-md leading-relaxed text-ink-soft">
              {status === 'queued'
                ? 'Your photos are saved. The worker will pick up this job shortly.'
                : 'Blender is processing your four photos into a GLB. This may take a few minutes.'}
            </p>
          </div>
        )}

        {status === 'complete' && glb && (
          <div className="p-8 bg-surface-paper border border-[color-mix(in_oklab,var(--color-accent-sage)_50%,var(--color-line))] rounded-lg text-center grid gap-4 justify-items-center">
            <h2 className="m-0 font-display text-[1.75rem] font-semibold">Your listing is live</h2>
            <p className="m-0 max-w-md leading-relaxed text-ink-soft">
              Buyers can preview in 3D and open AR from the product page or your QR code.
            </p>
            <div className="w-full max-w-[480px] aspect-[4/3] rounded-lg border border-line overflow-hidden bg-surface-paper">
              <ProductModelViewer
                src={glb}
                alt={title}
                poster={posterUrl ?? undefined}
                loading="eager"
                autoRotate
              />
            </div>
            <div className="flex flex-wrap gap-[0.65rem] justify-center">
              <Link href={`/product/${listingId}`} className={btnAccent}>
                View live listing
              </Link>
              <Link href={`/ar/${listingId}`} className={btnSecondary}>
                Open AR link
              </Link>
              <Link href="/dashboard" className={btnSecondary}>
                Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
