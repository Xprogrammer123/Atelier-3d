'use client'

import dynamic from 'next/dynamic'
import { DEMO_MODELS, type DemoModelId } from '@/lib/demo-models'
import { cn } from '@/lib/cn'

const ProductModelViewer = dynamic(
  () => import('@/components/ProductModelViewer').then((m) => m.ProductModelViewer),
  { ssr: false }
)

type Props = {
  value: DemoModelId | null
  onChange: (id: DemoModelId) => void
  disabled?: boolean
}

export function DemoModelPicker({ value, onChange, disabled }: Props) {
  const selected = DEMO_MODELS.find((m) => m.id === value) ?? null

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {DEMO_MODELS.map((model) => {
          const active = value === model.id
          return (
            <button
              key={model.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(model.id)}
              className={cn(
                'text-left p-3 rounded-md border transition-[border-color,box-shadow] bg-surface-strong',
                active
                  ? 'border-accent-sage shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-accent-sage)_25%,transparent)]'
                  : 'border-line hover:border-accent-clay-soft',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className="block text-[0.68rem] font-bold tracking-[0.14em] uppercase text-accent-clay">
                {model.category}
              </span>
              <span className="block mt-1 font-semibold text-ink-strong text-[0.92rem]">{model.name}</span>
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="rounded-lg border border-line overflow-hidden bg-black aspect-[4/3] max-w-lg">
          <ProductModelViewer src={selected.previewSrc} alt={selected.name} autoRotate loading="eager" />
        </div>
      )}

      <p className="m-0 text-[0.85rem] text-ink-muted">
        Pick the 3D piece closest to yours — AR preview updates as you choose.
      </p>
    </div>
  )
}
