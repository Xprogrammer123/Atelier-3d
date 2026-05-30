'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES, PHOTO_LABELS, type PhotoLabel } from '@/lib/types'
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

export function CreateListingForm() {
  const router = useRouter()
  const [photos, setPhotos] = useState<PhotoFiles>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const photoCount = PHOTO_LABELS.filter((l) => photos[l]).length
  const photosComplete = photoCount === 4

  function setPhoto(label: PhotoLabel, file: File | undefined) {
    setPhotos((prev) => {
      const next = { ...prev }
      if (file) next[label] = file
      else delete next[label]
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!photosComplete) {
      const missing = PHOTO_LABELS.filter((l) => !photos[l])
      setError(`Upload all four photos. Still needed: ${missing.join(', ')}`)
      return
    }

    const form = e.currentTarget
    const fd = new FormData(form)
    PHOTO_LABELS.forEach((label) => {
      const file = photos[label]
      if (file) fd.append(`photo_${label}`, file)
    })

    setLoading(true)
    try {
      const res = await fetch('/api/listings', { method: 'POST', body: fd })
      const body = (await res.json().catch(() => ({}))) as {
        listingId?: string
        error?: string
      }

      if (!res.ok) {
        setError(body.error ?? 'Failed to create listing')
        return
      }

      if (body.listingId) {
        pendoTrack('listing_created', {
          listing_id: body.listingId,
          category: String(fd.get('category') ?? ''),
          price_cents: Math.round(Number(fd.get('price')) * 100),
          location: String(fd.get('location') ?? ''),
          has_dimensions: Boolean(fd.get('width_cm') || fd.get('depth_cm') || fd.get('height_cm')),
          photo_count: photoCount,
        })
        router.push(`/dashboard/listing/${body.listingId}/status`)
        router.refresh()
      }
    } catch {
      setError('Network error. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

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
            <div className="flex justify-between items-start gap-4 mb-5">
              <div>
                <h2 className="m-0 mb-[0.35rem] font-display text-2xl font-semibold text-ink-strong">
                  Four-angle photos
                </h2>
                <p className="m-0 text-[0.9rem] text-ink-muted max-w-lg">
                  Required for 3D generation. Shoot on a plain background with even lighting.
                </p>
              </div>
              <span
                className={cn(
                  'shrink-0 px-3 py-[0.35rem] rounded-sm text-xs font-bold tracking-widest bg-line text-ink-muted',
                  photosComplete && 'bg-[color-mix(in_oklab,var(--color-accent-sage)_35%,white)] text-ink-strong'
                )}
              >
                {photoCount} / 4
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {PHOTO_LABELS.map((label) => (
                <PhotoSlot
                  key={label}
                  label={label}
                  hint={PHOTO_HINTS[label]}
                  file={photos[label]}
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
            <button
              type="submit"
              className={cn(btnAccent, 'min-w-56')}
              disabled={loading || !photosComplete}
            >
              {loading ? 'Uploading & queuing 3D…' : 'Publish & generate 3D model'}
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
              <li>Photos upload to secure storage</li>
              <li>Blender builds a GLB from your four angles</li>
              <li>Listing goes live with 3D + AR + QR code</li>
            </ol>
          </div>
          <div className="p-5 bg-[color-mix(in_oklab,var(--color-accent-peach)_30%,var(--color-surface-paper))] border border-line rounded-md">
            <strong className="block mb-[0.35rem] text-[0.85rem]">Tip</strong>
            <p className="m-0 text-[0.88rem] leading-relaxed text-ink-soft">
              Keep the camera at the same height for all four shots. Avoid heavy shadows —
              they help the model read shape more accurately.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-[0.72rem] font-semibold tracking-widest uppercase text-ink-muted">
            <span className={photosComplete ? 'text-accent-clay' : undefined}>Photos</span>
            <span>3D generation</span>
            <span>Live listing</span>
          </div>
        </aside>
      </div>
    </form>
  )
}

function PhotoSlot({
  label,
  hint,
  file,
  onChange,
}: {
  label: PhotoLabel
  hint: string
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
          <span className="text-[0.68rem] font-bold tracking-[0.18em] uppercase text-accent-clay">{label}</span>
          <span className="text-[0.72rem] text-ink-muted leading-snug">{hint}</span>
          <span className="mt-2 text-[0.78rem] font-semibold text-ink-soft">+ Add photo</span>
        </div>
      )}
    </label>
  )
}
