'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import type { JobStatus } from '@/lib/types'

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
    setStatus('queued')
    setRetrying(false)
  }

  return (
    <div className="listing-status">
      <header className="listing-status__header">
        <Link href="/dashboard" className="listing-status__back">
          ← Dashboard
        </Link>
        <p className="catalog-eyebrow">Processing listing</p>
        <h1 className="page-title">{title}</h1>
      </header>

      <div className="listing-status__timeline">
        {STEPS.map((step, i) => (
          <div
            key={step.key}
            className={`listing-status__step ${i < activeIndex ? 'done' : ''} ${i === activeIndex ? 'active' : ''}`}
          >
            <span className="listing-status__step-dot" />
            <span>{step.label}</span>
          </div>
        ))}
      </div>

      <div className="listing-status__body">
        {status === 'failed' && (
          <div className="listing-status__panel listing-status__panel--error">
            <h2>Generation failed</h2>
            <p>{error ?? 'Something went wrong during 3D generation.'}</p>
            <p className="listing-status__hint">
              Ensure Blender is installed and <code>npm run worker</code> is running, or retry
              the job.
            </p>
            <div className="listing-status__actions">
              <button
                type="button"
                className="btn-accent"
                disabled={retrying}
                onClick={() => void handleRetry()}
              >
                {retrying ? 'Retrying…' : 'Retry generation'}
              </button>
              <Link href="/dashboard/create" className="btn-secondary">
                New listing
              </Link>
            </div>
          </div>
        )}

        {(status === 'queued' || status === 'generating') && (
          <div className="listing-status__panel">
            <div className="listing-status__spinner" aria-hidden />
            <h2>{status === 'queued' ? 'Waiting in queue' : 'Building your 3D model'}</h2>
            <p>
              {status === 'queued'
                ? 'Your photos are saved. The worker will pick up this job shortly.'
                : 'Blender is processing your four photos into a GLB. This may take a few minutes.'}
            </p>
          </div>
        )}

        {status === 'complete' && glb && (
          <div className="listing-status__panel listing-status__panel--success">
            <h2>Your listing is live</h2>
            <p>Buyers can preview in 3D and open AR from the product page or your QR code.</p>
            <div className="product-viewer-wrap listing-status__viewer">
              <ProductModelViewer
                src={glb}
                alt={title}
                poster={posterUrl ?? undefined}
                loading="eager"
                autoRotate
              />
            </div>
            <div className="listing-status__actions">
              <Link href={`/product/${listingId}`} className="btn-accent">
                View live listing
              </Link>
              <Link href={`/ar/${listingId}`} className="btn-secondary">
                Open AR link
              </Link>
              <Link href="/dashboard" className="btn-secondary">
                Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
