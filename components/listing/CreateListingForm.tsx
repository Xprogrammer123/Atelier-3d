'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES, PHOTO_LABELS, type PhotoLabel } from '@/lib/types'

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
    <form className="create-listing__form" onSubmit={(e) => void handleSubmit(e)}>
      <div className="create-listing__layout">
        <div className="create-listing__main">
          <section className="create-listing__section">
            <h2 className="create-listing__section-title">Piece details</h2>
            <div className="create-listing__fields">
              <div className="form-field">
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  name="title"
                  required
                  placeholder="e.g. Mid-century walnut sideboard"
                />
              </div>
              <div className="form-field">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  required
                  placeholder="Materials, condition, style notes buyers should know…"
                />
              </div>
              <div className="create-listing__row">
                <div className="form-field">
                  <label htmlFor="price">Price (USD)</label>
                  <input id="price" name="price" type="number" min="0" step="1" required />
                </div>
                <div className="form-field">
                  <label htmlFor="category">Category</label>
                  <select id="category" name="category" required defaultValue="Surfaces">
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label>Dimensions (cm)</label>
                <div className="dim-row">
                  <input name="width_cm" type="number" placeholder="W" min="0" step="0.1" />
                  <input name="depth_cm" type="number" placeholder="D" min="0" step="0.1" />
                  <input name="height_cm" type="number" placeholder="H" min="0" step="0.1" />
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="location">Location</label>
                <input id="location" name="location" placeholder="City, region" />
              </div>
            </div>
          </section>

          <section className="create-listing__section">
            <div className="create-listing__section-head">
              <div>
                <h2 className="create-listing__section-title">Four-angle photos</h2>
                <p className="create-listing__section-lede">
                  Required for 3D generation. Shoot on a plain background with even lighting.
                </p>
              </div>
              <span
                className={`create-listing__photo-count ${photosComplete ? 'create-listing__photo-count--done' : ''}`}
              >
                {photoCount} / 4
              </span>
            </div>
            <div className="create-listing__photo-grid">
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
            <div className="create-listing__error" role="alert">
              {error}
            </div>
          )}

          <div className="create-listing__submit-row">
            <button
              type="submit"
              className="btn-accent create-listing__submit"
              disabled={loading || !photosComplete}
            >
              {loading ? 'Uploading & queuing 3D…' : 'Publish & generate 3D model'}
            </button>
            <Link href="/dashboard" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </div>

        <aside className="create-listing__aside">
          <div className="create-listing__aside-card">
            <p className="catalog-eyebrow">What happens next</p>
            <ol className="create-listing__steps-list">
              <li>Photos upload to secure storage</li>
              <li>Blender builds a GLB from your four angles</li>
              <li>Listing goes live with 3D + AR + QR code</li>
            </ol>
          </div>
          <div className="create-listing__aside-card create-listing__aside-card--muted">
            <strong>Tip</strong>
            <p>
              Keep the camera at the same height for all four shots. Avoid heavy shadows —
              they help the model read shape more accurately.
            </p>
          </div>
          <div className="create-listing__progress">
            <span className={photosComplete ? 'done' : ''}>Photos</span>
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
  const preview = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  )

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  return (
    <label className={`create-listing__photo ${file ? 'create-listing__photo--filled' : ''}`}>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="create-listing__photo-input"
        onChange={(e) => onChange(e.target.files?.[0])}
      />
      {preview ? (
        <>
          <img src={preview} alt={`${label} preview`} className="create-listing__photo-img" />
          <span className="create-listing__photo-check" aria-hidden>
            ✓
          </span>
        </>
      ) : (
        <div className="create-listing__photo-empty">
          <span className="create-listing__photo-label">{label}</span>
          <span className="create-listing__photo-hint">{hint}</span>
          <span className="create-listing__photo-cta">+ Add photo</span>
        </div>
      )}
    </label>
  )
}
