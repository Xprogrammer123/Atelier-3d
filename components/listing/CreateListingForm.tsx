'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { DemoModelId } from '@/lib/demo-models'
import { DemoModelPicker } from '@/components/listing/DemoModelPicker'
import { pendoTrack } from '@/lib/pendo-client'
import { CATEGORIES } from '@/lib/types'
import { btnAccent, btnSecondary, catalogEyebrow, formField, formInput, formLabel } from '@/lib/ui'
import { cn } from '@/lib/cn'

/*
 * Scan workflow (disabled — keep for post-hackathon DG-Mesh path)
 *
 * import { ScanCapture } from '@/components/listing/ScanCapture'
 * import { uploadScanVideo } from '@/lib/upload-scan-video'
 * import { MAX_SCAN_SECONDS, MAX_SCAN_VIDEO_BYTES, MIN_SCAN_SECONDS } from '@/lib/types'
 *
 * <ScanCapture onRecordingReady={setScanBlob} disabled={loading} />
 * → uploadScanVideo → POST /api/listings/[id]/scan-uploaded → npm run worker
 */

export function CreateListingForm() {
  const router = useRouter()
  const [demoModel, setDemoModel] = useState<DemoModelId | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const canSubmit = Boolean(demoModel)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!demoModel) {
      setError('Choose a 3D model for your listing.')
      return
    }
    const form = e.currentTarget
    const fd = new FormData(form)
    fd.append('demo_model', demoModel)

    setLoading(true)
    try {
      const res = await fetch('/api/listings', { method: 'POST', body: fd })
      const body = (await res.json().catch(() => ({}))) as {
        listingId?: string
        live?: boolean
        error?: string
      }

      if (!res.ok || !body.listingId) {
        setError(body.error ?? 'Failed to create listing')
        return
      }

      pendoTrack('listing_created', {
        listing_id: body.listingId,
        category: String(fd.get('category') ?? ''),
        price_cents: Math.round(Number(fd.get('price')) * 100),
        location: String(fd.get('location') ?? ''),
        has_dimensions: Boolean(fd.get('width_cm') || fd.get('depth_cm') || fd.get('height_cm')),
        photo_count: 0,
        model_source: 'demo',
        demo_model: demoModel,
      })

      if (body.live) {
        router.push(`/product/${body.listingId}`)
      } else {
        router.push(`/dashboard/listing/${body.listingId}/status`)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Check your connection and try again.')
    } finally {
      setLoading(false)
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
          <div className="grid gap-4 justify-items-center p-8 bg-surface-paper border border-line rounded-lg shadow-lift">
            <div className="relative size-11" aria-hidden>
              <div className="absolute inset-0 rounded-full border-[3px] border-line" />
              <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-accent-clay animate-listing-spin" />
            </div>
            <p className="m-0 font-semibold text-ink-strong">Publishing listing…</p>
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
              <h2 className="m-0 mb-2 font-display text-2xl font-semibold text-ink-strong">3D model</h2>
              <p className="m-0 mb-5 text-[0.9rem] text-ink-muted max-w-lg">
                Choose the piece that best matches yours — buyers get an interactive 3D preview and in-room AR.
              </p>
              <DemoModelPicker value={demoModel} onChange={setDemoModel} disabled={loading} />
            </section>

            {error && (
              <div
                className="p-4 px-5 bg-[#fde8e4] border border-[#e8b4a8] rounded-sm text-[#8b2e1f] text-[0.9rem]"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="flex flex-wrap gap-3 items-center">
              <button id="btn-publish-listing" type="submit" className={cn(btnAccent, 'min-w-56')} disabled={loading || !canSubmit}>
                {loading ? 'Publishing…' : 'Publish listing'}
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
                <li>Your listing is saved with a 3D model</li>
                <li>QR code is generated for tags and sharing</li>
                <li>Listing goes live — buyers can preview and try AR</li>
              </ol>
            </div>
            <div className="p-5 bg-[color-mix(in_oklab,var(--color-accent-peach)_30%,var(--color-surface-paper))] border border-line rounded-md">
              <strong className="block mb-[0.35rem] text-[0.85rem]">Instant publish</strong>
              <p className="m-0 text-[0.88rem] leading-relaxed text-ink-soft">
                No worker or GPU needed — perfect for demos and judging.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-[0.72rem] font-semibold tracking-widest uppercase text-ink-muted">
              <span className={canSubmit ? 'text-accent-clay' : undefined}>Pick 3D model</span>
              <span className={canSubmit ? 'text-accent-clay' : undefined}>Publish</span>
              <span>Live + AR</span>
            </div>
          </aside>
        </div>
      </form>
    </>
  )
}
