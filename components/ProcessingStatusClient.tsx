'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ProductModelViewer } from '@/components/ProductModelViewer'
import { createClient } from '@/lib/supabase/client'
import type { JobStatus } from '@/lib/types'

type Props = {
  listingId: string
  initialStatus: JobStatus
  glbUrl: string | null
  posterUrl: string | null
  title: string
  errorMessage: string | null
}

const STEPS: JobStatus[] = ['queued', 'generating', 'complete', 'failed']

export function ProcessingStatusClient({
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
          const row = payload.new as {
            status: JobStatus
            error_message: string | null
          }
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

  const stepIndex = status === 'failed' ? -1 : STEPS.indexOf(status)

  return (
    <div className="processing-status">
      <h1 className="page-title">{title}</h1>
      <div className="processing-steps">
        {(['queued', 'generating', 'complete'] as const).map((step, i) => (
          <span
            key={step}
            className={`step ${i < stepIndex ? 'done' : ''} ${i === stepIndex ? 'active' : ''}`}
          >
            {step === 'queued' && 'Queued'}
            {step === 'generating' && 'Generating model'}
            {step === 'complete' && 'Complete'}
          </span>
        ))}
      </div>

      {status === 'failed' && (
        <>
          <p className="error-msg">{error ?? 'Generation failed.'}</p>
          <Link href="/dashboard/create" className="btn-secondary">
            Re-upload photos
          </Link>
          <button
            type="button"
            className="btn-accent"
            onClick={() => void fetch('/api/jobs/retry', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ listingId }),
            })}
          >
            Retry generation
          </button>
        </>
      )}

      {status === 'complete' && glb && (
        <>
          <p>Your listing is live. Preview the generated model:</p>
          <div className="product-viewer-wrap" style={{ width: '100%', maxWidth: 480 }}>
            <ProductModelViewer src={glb} alt={title} poster={posterUrl ?? undefined} loading="eager" />
          </div>
          <Link href={`/product/${listingId}`} className="btn-accent">
            View live listing
          </Link>
          <Link href="/dashboard" className="btn-secondary">
            Back to dashboard
          </Link>
        </>
      )}

      {(status === 'queued' || status === 'generating') && (
        <p style={{ color: 'var(--ink-muted)' }}>
          {status === 'queued'
            ? 'Your job is in the queue. This usually takes a few minutes.'
            : 'Blender is building your 3D model…'}
        </p>
      )}
    </div>
  )
}
