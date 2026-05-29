'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CATEGORIES, PHOTO_LABELS, type PhotoLabel } from '@/lib/types'

type PhotoFiles = Partial<Record<PhotoLabel, File>>

export function CreateListingForm() {
  const router = useRouter()
  const [photos, setPhotos] = useState<PhotoFiles>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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

    const missing = PHOTO_LABELS.filter((l) => !photos[l])
    if (missing.length > 0) {
      setError(`Upload all 4 photos. Missing: ${missing.join(', ')}`)
      return
    }

    const form = e.currentTarget
    const fd = new FormData(form)

    PHOTO_LABELS.forEach((label) => {
      const file = photos[label]
      if (file) fd.append(`photo_${label}`, file)
    })

    setLoading(true)
    const res = await fetch('/api/listings', { method: 'POST', body: fd })
    setLoading(false)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError((body as { error?: string }).error ?? 'Failed to create listing')
      return
    }

    const { listingId } = (await res.json()) as { listingId: string }
    router.push(`/dashboard/listing/${listingId}/status`)
  }

  return (
    <form className="form-card" onSubmit={(e) => void handleSubmit(e)} style={{ maxWidth: '42rem' }}>
      <div className="form-field">
        <label htmlFor="title">Title</label>
        <input id="title" name="title" required />
      </div>
      <div className="form-field">
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={4} required />
      </div>
      <div className="form-field">
        <label htmlFor="price">Price (USD)</label>
        <input id="price" name="price" type="number" min="0" step="1" required />
      </div>
      <div className="form-field">
        <label htmlFor="category">Category</label>
        <select id="category" name="category" required>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label>Dimensions (cm)</label>
        <div className="dim-row">
          <input name="width_cm" type="number" placeholder="Width" min="0" step="0.1" />
          <input name="depth_cm" type="number" placeholder="Depth" min="0" step="0.1" />
          <input name="height_cm" type="number" placeholder="Height" min="0" step="0.1" />
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="location">Location</label>
        <input id="location" name="location" placeholder="City, region" />
      </div>

      <div className="form-field">
        <label>Photos (front, back, left, right)</label>
        <div className="photo-upload-grid">
          {PHOTO_LABELS.map((label) => (
            <PhotoSlot
              key={label}
              label={label}
              file={photos[label]}
              onChange={(f) => setPhoto(label, f)}
            />
          ))}
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}
      <button type="submit" className="btn-accent" disabled={loading}>
        {loading ? 'Uploading…' : 'Create listing & generate 3D'}
      </button>
    </form>
  )
}

function PhotoSlot({
  label,
  file,
  onChange,
}: {
  label: PhotoLabel
  file?: File
  onChange: (f: File | undefined) => void
}) {
  const preview = file ? URL.createObjectURL(file) : null

  return (
    <label className={`photo-slot ${file ? 'has-image' : ''}`}>
      <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {label}
      </span>
      {preview ? (
        <img src={preview} alt={`${label} preview`} />
      ) : (
        <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>Tap to upload</span>
      )}
      <input
        type="file"
        accept="image/*"
        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
        onChange={(e) => onChange(e.target.files?.[0])}
      />
    </label>
  )
}
