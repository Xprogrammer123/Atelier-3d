'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ScanCapture } from '@/components/listing/ScanCapture'
import { CATEGORIES, MAX_SCAN_SECONDS, MAX_SCAN_VIDEO_BYTES, MIN_SCAN_SECONDS } from '@/lib/types'
import { listingScanVideoPath } from '@/lib/storage-paths'
import { scanVideoFileExtension } from '@/lib/scan-recording'
import { pendoTrack } from '@/lib/pendo-client'
import { ProcessingStepLoader } from '@/components/listing/ProcessingStepLoader'
import { btnAccent, btnSecondary, catalogEyebrow, formField, formInput, formLabel } from '@/lib/ui'
import { cn } from '@/lib/cn'

const PUBLISH_STEPS = [
  { key: 'create', label: 'Create listing' },
  { key: 'upload', label: 'Upload scan' },
  { key: 'queue', label: 'Start 3D' },
] as const

function publishStepIndex(phase: string | null): number {
  if (phase?.startsWith('Uploading')) return 1
  if (phase?.startsWith('Starting')) return 2
  return 0
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function CreateListingForm() {
  const router = useRouter()
  const [frontPhoto, setFrontPhoto] = useState<File | undefined>()
  const [scanBlob, setScanBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadPhase, setUploadPhase] = useState<string | null>(null)

  const canSubmit = Boolean(scanBlob && frontPhoto)

  async function uploadScanVideo(listingId: string, blob: Blob) {
    const supabase = createClient()
    const ext = scanVideoFileExtension(blob.type || 'video/webm')
    const path = listingScanVideoPath(listingId, ext)
    const { error: uploadError } = await supabase.storage.from('listings').upload(path, blob, {
      contentType: blob.type || (ext === 'mp4' ? 'video/mp4' : 'video/webm'),
      upsert: true,
    })
    if (uploadError) throw new Error(uploadError.message)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!scanBlob) {
      setError('Record a scan walk-around before publishing.')
      return
    }
    if (!frontPhoto) {
      setError('Add a front photo for your catalogue listing.')
      return
    }
    if (scanBlob.size > MAX_SCAN_VIDEO_BYTES) {
      setError(`Scan video must be under ${formatBytes(MAX_SCAN_VIDEO_BYTES)}. Try a shorter recording.`)
      return
    }

    const form = e.currentTarget
    const fd = new FormData(form)
    fd.append('photo_front', frontPhoto)

    setLoading(true)
    try {
      setUploadPhase('Creating listing…')
      const res = await fetch('/api/listings', { method: 'POST', body: fd })
      const body = (await res.json().catch(() => ({}))) as {
        listingId?: string
        pendingScanUpload?: boolean
        error?: string
      }

      if (!res.ok || !body.listingId) {
        setError(body.error ?? 'Failed to create listing')
        return
      }

      if (body.pendingScanUpload && scanBlob) {
        setUploadPhase('Uploading scan video…')
        await uploadScanVideo(body.listingId, scanBlob)

        setUploadPhase('Starting 3D reconstruction…')
        const finalize = await fetch(`/api/listings/${body.listingId}/scan-uploaded`, {
          method: 'POST',
        })
        const finalizeBody = (await finalize.json().catch(() => ({}))) as { error?: string }
        if (!finalize.ok) {
          setError(finalizeBody.error ?? 'Failed to start mesh processing')
          return
        }
      }

      pendoTrack('listing_created', {
        listing_id: body.listingId,
        category: String(fd.get('category') ?? ''),
        price_cents: Math.round(Number(fd.get('price')) * 100),
        location: String(fd.get('location') ?? ''),
        has_dimensions: Boolean(fd.get('width_cm') || fd.get('depth_cm') || fd.get('height_cm')),
        photo_count: 1,
        model_source: 'scan',
      })
      router.push(`/dashboard/listing/${body.listingId}/status`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Check your connection and try again.')
    } finally {
      setLoading(false)
      setUploadPhase(null)
    }
  }

  return (
    <>
      {loading && (
        <div
          className="fixed inset-0 z-50 grid place-items-center p-6 bg-[color-mix(in_oklab,var(--color-ink-strong)_35%,transparent)] backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
          aria-label="Publishing listing"
        >
          <div className="w-full max-w-lg p-6 sm:p-8 bg-surface-paper border border-line rounded-lg shadow-lift animate-listing-step-pop">
            <ProcessingStepLoader
              steps={[...PUBLISH_STEPS]}
              activeIndex={publishStepIndex(uploadPhase)}
              title={uploadPhase ?? 'Publishing…'}
              message="Hang tight — your scan and catalogue photo are being saved."
              showSpinner
              compact
            />
          </div>
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)}>
      <div className="grid gap-8 lg:grid-cols-[1fr_300px] lg:items-start">
        <div className="grid gap-8">
          <section className="p-7 bg-surface-paper border border-line rounded-lg shadow-soft">
            <h2 className="m-0 mb-5 font-display text-2xl font-semibold text-ink-strong">Piece details</h2>
            <div className="grid gap-4">
              <div className={formField}>
                <label htmlFor="title" className={formLabel}>
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  required
                  placeholder="e.g. Mid-century walnut sideboard"
                  className={formInput}
                />
              </div>
              <div className={formField}>
                <label htmlFor="description" className={formLabel}>
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  required
                  placeholder="Materials, condition, style notes buyers should know…"
                  className={formInput}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className={formField}>
                  <label htmlFor="price" className={formLabel}>
                    Price (USD)
                  </label>
                  <input id="price" name="price" type="number" min="0" step="1" required className={formInput} />
                </div>
                <div className={formField}>
                  <label htmlFor="category" className={formLabel}>
                    Category
                  </label>
                  <select id="category" name="category" required defaultValue="Surfaces" className={formInput}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={formField}>
                <label className={formLabel}>Dimensions (cm)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input name="width_cm" type="number" placeholder="W" min="0" step="0.1" className={formInput} />
                  <input name="depth_cm" type="number" placeholder="D" min="0" step="0.1" className={formInput} />
                  <input name="height_cm" type="number" placeholder="H" min="0" step="0.1" className={formInput} />
                </div>
              </div>
              <div className={formField}>
                <label htmlFor="location" className={formLabel}>
                  Location
                </label>
                <input id="location" name="location" placeholder="City, region" className={formInput} />
              </div>
            </div>
          </section>

          <section className="p-7 bg-surface-paper border border-line rounded-lg shadow-soft">
            <h2 className="m-0 mb-2 font-display text-2xl font-semibold text-ink-strong">3D scan</h2>
            <p className="m-0 mb-5 text-[0.9rem] text-ink-muted max-w-lg">
              Walk around your piece with the camera for at least {MIN_SCAN_SECONDS} seconds (up to{' '}
              {MAX_SCAN_SECONDS}). Atelier turns the recording into a 3D model for AR.
            </p>
            <ScanCapture onRecordingReady={setScanBlob} disabled={loading} />
          </section>

          <section className="p-7 bg-surface-paper border border-line rounded-lg shadow-soft">
            <h2 className="m-0 mb-[0.35rem] font-display text-2xl font-semibold text-ink-strong">Catalogue photo</h2>
            <p className="m-0 mb-5 text-[0.9rem] text-ink-muted max-w-lg">
              Front photo for the shop page and listing thumbnail.
            </p>
            <FrontPhotoSlot file={frontPhoto} onChange={setFrontPhoto} />
          </section>

          {error && (
            <div className="p-4 px-5 bg-[#fde8e4] border border-[#e8b4a8] rounded-sm text-[#8b2e1f] text-[0.9rem]" role="alert">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3 items-center">
            <button type="submit" className={cn(btnAccent, 'min-w-56')} disabled={loading || !canSubmit}>
              {loading ? uploadPhase ?? 'Working…' : 'Publish & build 3D'}
            </button>
            <Link href="/dashboard" className={btnSecondary}>
              Cancel
            </Link>
          </div>
        </div>

        <aside className="grid gap-4 sticky top-6">
          <div className="p-5 bg-surface-paper border border-line rounded-md">
            <p className={catalogEyebrow}>What happens next</p>
            <ol className="m-0 pl-[1.15rem] text-[0.88rem] leading-[1.7] text-ink-soft">
              <li>Your scan video uploads to secure storage</li>
              <li>DG-Mesh reconstructs a 3D mesh on the GPU worker</li>
              <li>Listing goes live with AR + QR when ready</li>
            </ol>
          </div>
          <div className="p-5 bg-[color-mix(in_oklab,var(--color-accent-peach)_30%,var(--color-surface-paper))] border border-line rounded-md">
            <strong className="block mb-[0.35rem] text-[0.85rem]">Worker required</strong>
            <p className="m-0 text-[0.88rem] leading-relaxed text-ink-soft">
              Run <code className="text-[0.82rem]">npm run worker</code> on a machine with ffmpeg and DG-Mesh
              configured.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-[0.72rem] font-semibold tracking-widest uppercase text-ink-muted">
            <span className={canSubmit ? 'text-accent-clay' : undefined}>Scan + front photo</span>
            <span>Mesh reconstruction</span>
            <span>Live listing</span>
          </div>
        </aside>
      </div>
      </form>
    </>
  )
}

function FrontPhotoSlot({
  file,
  onChange,
}: {
  file?: File
  onChange: (f: File | undefined) => void
}) {
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  return (
    <label
      className={cn(
        'relative block max-w-xs aspect-[3/4] border-2 border-dashed border-line rounded-md overflow-hidden cursor-pointer transition-[border-color] bg-surface-strong hover:border-accent-clay-soft',
        file && 'border-solid border-accent-sage'
      )}
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="absolute inset-0 opacity-0 cursor-pointer z-[2]"
        onChange={(e) => onChange(e.target.files?.[0])}
      />
      {preview ? (
        <>
          <img src={preview} alt="Front preview" className="w-full h-full object-cover" />
          <span
            className="absolute top-2 right-2 size-6 grid place-items-center bg-accent-sage text-white rounded-full text-xs font-bold z-[1]"
            aria-hidden
          >
            ✓
          </span>
        </>
      ) : (
        <div className="h-full flex flex-col items-center justify-center p-3 text-center gap-[0.35rem]">
          <span className="text-[0.68rem] font-bold tracking-[0.18em] uppercase text-accent-clay">Front *</span>
          <span className="text-[0.72rem] text-ink-muted leading-snug">Full front view, centered</span>
          <span className="mt-2 text-[0.78rem] font-semibold text-ink-soft">+ Add photo</span>
        </div>
      )}
    </label>
  )
}
