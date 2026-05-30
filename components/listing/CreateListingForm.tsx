'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  CATEGORIES,
  MAX_GLB_BYTES,
  PHOTO_LABELS,
  type ModelSource,
  type PhotoLabel,
} from '@/lib/types'
import { pendoTrack } from '@/lib/pendo-client'
import { btnAccent, btnSecondary, catalogEyebrow, formField, formInput, formLabel } from '@/lib/ui'
import { cn } from '@/lib/cn'

type PhotoFiles = Partial<Record<PhotoLabel, File>>

const PHOTO_HINTS: Record<PhotoLabel, string> = {
  front: 'Full front view, centered',
  back: 'Full back view, centered',
  left: 'Left side profile',
  right: 'Right side profile',
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function CreateListingForm() {
  const router = useRouter()
  const [modelSource, setModelSource] = useState<ModelSource>('upload')
  const [photos, setPhotos] = useState<PhotoFiles>({})
  const [glbFile, setGlbFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadPhase, setUploadPhase] = useState<string | null>(null)

  const photoCount = PHOTO_LABELS.filter((l) => photos[l]).length
  const photosComplete = photoCount === 4
  const uploadReady = Boolean(glbFile && photos.front)

  function setPhoto(label: PhotoLabel, file: File | undefined) {
    setPhotos((prev) => {
      const next = { ...prev }
      if (file) next[label] = file
      else delete next[label]
      return next
    })
  }

  async function uploadGlb(listingId: string, file: File) {
    const supabase = createClient()
    const path = `${listingId}/model.glb`
    const { error: uploadError } = await supabase.storage.from('listings').upload(path, file, {
      contentType: 'model/gltf-binary',
      upsert: true,
    })
    if (uploadError) throw new Error(uploadError.message)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (modelSource === 'photos' && !photosComplete) {
      const missing = PHOTO_LABELS.filter((l) => !photos[l])
      setError(`Upload all four photos. Still needed: ${missing.join(', ')}`)
      return
    }

    if (modelSource === 'upload') {
      if (!glbFile) {
        setError('Choose a GLB file from your LiDAR scan or manufacturer.')
        return
      }
      if (!photos.front) {
        setError('Add a front photo for your catalogue listing.')
        return
      }
      if (glbFile.size > MAX_GLB_BYTES) {
        setError(`GLB must be under ${formatBytes(MAX_GLB_BYTES)}. Try exporting with compression in Polycam.`)
        return
      }
    }

    const form = e.currentTarget
    const fd = new FormData(form)
    fd.set('model_source', modelSource)
    PHOTO_LABELS.forEach((label) => {
      const file = photos[label]
      if (file) fd.append(`photo_${label}`, file)
    })

    setLoading(true)
    try {
      setUploadPhase('Creating listing…')
      const res = await fetch('/api/listings', { method: 'POST', body: fd })
      const body = (await res.json().catch(() => ({}))) as {
        listingId?: string
        pendingModelUpload?: boolean
        error?: string
      }

      if (!res.ok || !body.listingId) {
        setError(body.error ?? 'Failed to create listing')
        return
      }

      if (body.pendingModelUpload && glbFile) {
        setUploadPhase('Uploading 3D scan…')
        await uploadGlb(body.listingId, glbFile)

        setUploadPhase('Finalizing AR preview…')
        const finalize = await fetch(`/api/listings/${body.listingId}/model-uploaded`, {
          method: 'POST',
        })
        const finalizeBody = (await finalize.json().catch(() => ({}))) as { error?: string }
        if (!finalize.ok) {
          setError(finalizeBody.error ?? 'Failed to start processing')
          return
        }
      }

      pendoTrack('listing_created', {
        listing_id: body.listingId,
        category: String(fd.get('category') ?? ''),
        price_cents: Math.round(Number(fd.get('price')) * 100),
        location: String(fd.get('location') ?? ''),
        has_dimensions: Boolean(fd.get('width_cm') || fd.get('depth_cm') || fd.get('height_cm')),
        photo_count: photoCount,
        model_source: modelSource,
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

  const canSubmit =
    modelSource === 'photos' ? photosComplete : uploadReady

  return (
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
            <h2 className="m-0 mb-4 font-display text-2xl font-semibold text-ink-strong">3D model source</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <ModelSourceOption
                active={modelSource === 'upload'}
                title="Upload scan or GLB"
                description="LiDAR scan (Polycam, Scaniverse) or manufacturer file"
                onClick={() => setModelSource('upload')}
              />
              <ModelSourceOption
                active={modelSource === 'photos'}
                title="Generate from photos"
                description="Four angles — experimental placeholder pipeline"
                onClick={() => setModelSource('photos')}
              />
            </div>

            {modelSource === 'upload' ? (
              <GlbUploadSection file={glbFile} onChange={setGlbFile} />
            ) : (
              <p className="m-0 mb-5 text-[0.9rem] text-ink-muted max-w-lg">
                Required for 3D generation. Shoot on a plain background with even lighting.
              </p>
            )}
          </section>

          <section className="p-7 bg-surface-paper border border-line rounded-lg shadow-soft">
            <div className="flex justify-between items-start gap-4 mb-5">
              <div>
                <h2 className="m-0 mb-[0.35rem] font-display text-2xl font-semibold text-ink-strong">
                  {modelSource === 'upload' ? 'Catalogue photos' : 'Four-angle photos'}
                </h2>
                <p className="m-0 text-[0.9rem] text-ink-muted max-w-lg">
                  {modelSource === 'upload'
                    ? 'Front photo required for the shop page. Add other angles if you like.'
                    : 'All four angles are required for generation.'}
                </p>
              </div>
              {modelSource === 'photos' && (
                <span
                  className={cn(
                    'shrink-0 px-3 py-[0.35rem] rounded-sm text-xs font-bold tracking-widest bg-line text-ink-muted',
                    photosComplete && 'bg-[color-mix(in_oklab,var(--color-accent-sage)_35%,white)] text-ink-strong'
                  )}
                >
                  {photoCount} / 4
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {PHOTO_LABELS.map((label) => (
                <PhotoSlot
                  key={label}
                  label={label}
                  hint={PHOTO_HINTS[label]}
                  file={photos[label]}
                  required={modelSource === 'photos' || label === 'front'}
                  onChange={(f) => setPhoto(label, f)}
                />
              ))}
            </div>
          </section>

          {error && (
            <div className="p-4 px-5 bg-[#fde8e4] border border-[#e8b4a8] rounded-sm text-[#8b2e1f] text-[0.9rem]" role="alert">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3 items-center">
            <button type="submit" className={cn(btnAccent, 'min-w-56')} disabled={loading || !canSubmit}>
              {loading
                ? uploadPhase ?? 'Working…'
                : modelSource === 'upload'
                  ? 'Publish with 3D scan'
                  : 'Publish & generate 3D model'}
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
              {modelSource === 'upload' ? (
                <>
                  <li>Your GLB uploads directly to secure storage</li>
                  <li>We attach AR + QR to your real 3D scan</li>
                  <li>Listing goes live — no Blender generation</li>
                </>
              ) : (
                <>
                  <li>Photos upload to secure storage</li>
                  <li>Blender builds a GLB from your four angles</li>
                  <li>Listing goes live with 3D + AR + QR code</li>
                </>
              )}
            </ol>
          </div>
          {modelSource === 'upload' ? (
            <div className="p-5 bg-[color-mix(in_oklab,var(--color-accent-peach)_30%,var(--color-surface-paper))] border border-line rounded-md">
              <strong className="block mb-[0.35rem] text-[0.85rem]">Scan on iPhone</strong>
              <p className="m-0 text-[0.88rem] leading-relaxed text-ink-soft">
                Open Polycam or Scaniverse, scan the piece (~2 min), export as GLB, then upload here.
                Max file size {formatBytes(MAX_GLB_BYTES)}.
              </p>
            </div>
          ) : (
            <div className="p-5 bg-[color-mix(in_oklab,var(--color-accent-peach)_30%,var(--color-surface-paper))] border border-line rounded-md">
              <strong className="block mb-[0.35rem] text-[0.85rem]">Tip</strong>
              <p className="m-0 text-[0.88rem] leading-relaxed text-ink-soft">
                Keep the camera at the same height for all four shots. Avoid heavy shadows —
                they help the model read shape more accurately.
              </p>
            </div>
          )}
          <div className="flex flex-col gap-2 text-[0.72rem] font-semibold tracking-widest uppercase text-ink-muted">
            <span className={canSubmit ? 'text-accent-clay' : undefined}>
              {modelSource === 'upload' ? 'GLB + front photo' : 'Photos'}
            </span>
            <span>{modelSource === 'upload' ? 'AR setup' : '3D generation'}</span>
            <span>Live listing</span>
          </div>
        </aside>
      </div>
    </form>
  )
}

function ModelSourceOption({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-left p-4 border-2 rounded-md transition-[border-color,box-shadow] bg-surface-strong',
        active
          ? 'border-accent-sage shadow-soft'
          : 'border-line hover:border-accent-clay-soft'
      )}
    >
      <span className="block font-semibold text-ink-strong text-[0.95rem] mb-1">{title}</span>
      <span className="block text-[0.82rem] text-ink-muted leading-snug">{description}</span>
    </button>
  )
}

function GlbUploadSection({
  file,
  onChange,
}: {
  file: File | null
  onChange: (file: File | null) => void
}) {
  return (
    <label
      className={cn(
        'block p-6 border-2 border-dashed border-line rounded-md cursor-pointer transition-[border-color] bg-surface-strong hover:border-accent-clay-soft',
        file && 'border-solid border-accent-sage'
      )}
    >
      <input
        type="file"
        accept=".glb,model/gltf-binary"
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {file ? (
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="m-0 font-semibold text-ink-strong">{file.name}</p>
            <p className="m-0 mt-1 text-[0.88rem] text-ink-muted">{formatBytes(file.size)}</p>
          </div>
          <span className="shrink-0 size-8 grid place-items-center bg-accent-sage text-white rounded-full text-sm font-bold">
            ✓
          </span>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="m-0 font-semibold text-ink-strong">+ Upload GLB file</p>
          <p className="m-0 mt-2 text-[0.88rem] text-ink-muted max-w-md mx-auto">
            From Polycam, Scaniverse, RealityScan, or your furniture supplier
          </p>
        </div>
      )}
    </label>
  )
}

function PhotoSlot({
  label,
  hint,
  file,
  required,
  onChange,
}: {
  label: PhotoLabel
  hint: string
  file?: File
  required?: boolean
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
        'relative aspect-[3/4] border-2 border-dashed border-line rounded-md overflow-hidden cursor-pointer transition-[border-color,box-shadow] bg-surface-strong hover:border-accent-clay-soft',
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
          <img src={preview} alt={`${label} preview`} className="w-full h-full object-cover" />
          <span
            className="absolute top-2 right-2 size-6 grid place-items-center bg-accent-sage text-white rounded-full text-xs font-bold z-[1]"
            aria-hidden
          >
            ✓
          </span>
        </>
      ) : (
        <div className="h-full flex flex-col items-center justify-center p-3 text-center gap-[0.35rem]">
          <span className="text-[0.68rem] font-bold tracking-[0.18em] uppercase text-accent-clay">
            {label}
            {required ? ' *' : ''}
          </span>
          <span className="text-[0.72rem] text-ink-muted leading-snug">{hint}</span>
          <span className="mt-2 text-[0.78rem] font-semibold text-ink-soft">+ Add photo</span>
        </div>
      )}
    </label>
  )
}
