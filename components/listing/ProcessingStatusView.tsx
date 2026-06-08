'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import type { JobStatus } from '@/lib/types'
import { pendoTrack } from '@/lib/pendo-client'
import { btnAccent, btnSecondary, catalogEyebrow, pageTitle } from '@/lib/ui'
import { ProcessingStepLoader } from '@/components/listing/ProcessingStepLoader'

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
  { key: 'generating', label: 'Reconstructing' },
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
    status === 'complete' ? 2 : status === 'generating' || status === 'failed' ? 1 : 0

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

      <ProcessingStepLoader
        steps={[...STEPS]}
        activeIndex={activeIndex}
        className="mb-8"
        title={
          status === 'queued'
            ? 'Waiting in queue'
            : status === 'generating'
              ? 'Reconstructing from your scan'
              : status === 'complete'
                ? 'All steps complete'
                : undefined
        }
        message={
          status === 'queued'
            ? 'Your scan video is saved. Reconstruction starts when the mesh worker is running (npm run worker). If this stays here, the worker is not started yet.'
            : status === 'generating'
              ? 'DG-Mesh is turning your walk-around video into a 3D mesh. First runs can take a long time on GPU — this is normal and not caused by which camera you used.'
              : status === 'complete'
                ? 'Your 3D model is ready — preview it below.'
                : undefined
        }
        showSpinner={status === 'queued' || status === 'generating'}
      />

      <div>
        {status === 'failed' && (
          <div className="p-8 bg-[#fdf6f4] border border-[#e8b4a8] rounded-lg text-center grid gap-4 justify-items-center animate-listing-step-pop">
            <h2 className="m-0 font-display text-[1.75rem] font-semibold">Reconstruction failed</h2>
            <p className="m-0 max-w-md leading-relaxed text-ink-soft">
              {error ?? 'Something went wrong during mesh reconstruction.'}
            </p>
            <p className="m-0 max-w-md text-[0.85rem] text-ink-muted">
              Ensure ffmpeg is installed and{' '}
              <code className="text-[0.85em] px-[0.4em] py-[0.15em] rounded-xs bg-surface-strong border border-line">
                npm run worker
              </code>{' '}
              is running on a GPU machine with DG_MESH_ROOT set.
            </p>
            <div className="flex flex-wrap gap-[0.65rem] justify-center">
              <button
                id="btn-retry-generation"
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

        {status === 'complete' && glb && (
          <div className="p-8 bg-surface-paper border border-[color-mix(in_oklab,var(--color-accent-sage)_50%,var(--color-line))] rounded-lg text-center grid gap-4 justify-items-center animate-listing-step-pop">
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
