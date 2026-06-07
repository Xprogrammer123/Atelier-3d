'use client'

import type { CSSProperties } from 'react'
import { cn } from '@/lib/cn'

export type ProcessingStep = {
  key: string
  label: string
}

type Props = {
  steps: ProcessingStep[]
  activeIndex: number
  title?: string
  message?: string
  compact?: boolean
  showSpinner?: boolean
  className?: string
}

function stepProgressPercent(activeIndex: number, stepCount: number): number {
  if (stepCount <= 1) return 0
  const clamped = Math.max(0, Math.min(activeIndex, stepCount - 1))
  return (clamped / (stepCount - 1)) * 100
}

export function ProcessingStepLoader({
  steps,
  activeIndex,
  title,
  message,
  compact = false,
  showSpinner,
  className,
}: Props) {
  const progress = stepProgressPercent(activeIndex, steps.length)
  const onLastStep = activeIndex >= steps.length - 1
  const spinnerVisible = showSpinner ?? (Boolean(title) && !onLastStep)

  return (
    <div className={cn('grid gap-5', className)}>
      <div
        className={cn(
          'relative rounded-lg border border-line bg-surface-paper',
          compact ? 'px-2 py-3' : 'px-3 py-4 sm:px-4'
        )}
      >
        <div
          className="absolute top-[1.125rem] left-[10%] right-[10%] h-0.5 rounded-full bg-line overflow-hidden"
          aria-hidden
        >
          <div
            className={cn(
              'h-full rounded-full bg-accent-sage origin-left transition-[width] duration-700 ease-out',
              !onLastStep && activeIndex >= 0 && 'animate-listing-progress-shimmer'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        <ol
          className="m-0 p-0 list-none grid grid-cols-[repeat(var(--step-count),minmax(0,1fr))] relative z-[1]"
          style={{ '--step-count': steps.length } as CSSProperties}
        >
          {steps.map((step, i) => {
            const done = i < activeIndex
            const current = i === activeIndex

            return (
              <li
                key={step.key}
                className={cn(
                  'flex flex-col items-center gap-2 text-center px-1',
                  compact ? 'py-2' : 'py-3'
                )}
              >
                <span
                  className={cn(
                    'relative grid place-items-center size-9 rounded-full border-2 transition-all duration-500',
                    done && 'border-accent-sage bg-accent-sage text-white animate-listing-step-pop',
                    current &&
                      'border-accent-clay bg-[color-mix(in_oklab,var(--color-accent-peach)_55%,white)] text-ink-strong shadow-[0_0_0_6px_color-mix(in_oklab,var(--color-accent-clay)_18%,transparent)] animate-listing-step-pulse',
                    !done && !current && 'border-line bg-surface-paper text-ink-muted'
                  )}
                >
                  {done ? (
                    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
                      <path
                        d="M3.5 8.5 6.5 11.5 12.5 4.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="animate-listing-step-check"
                      />
                    </svg>
                  ) : current ? (
                    <span className="size-2.5 rounded-full bg-accent-clay animate-listing-step-dot" />
                  ) : (
                    <span className="size-2 rounded-full bg-line" />
                  )}
                </span>

                <span
                  className={cn(
                    'text-[0.68rem] font-semibold tracking-[0.14em] uppercase transition-colors duration-500',
                    done && 'text-accent-sage',
                    current && 'text-ink-strong',
                    !done && !current && 'text-ink-muted'
                  )}
                >
                  {step.label}
                </span>
              </li>
            )
          })}
        </ol>
      </div>

      {(title || message) && (
        <div
          className={cn(
            'grid gap-3 justify-items-center text-center',
            compact ? 'pt-1' : 'p-6 bg-surface-paper border border-line rounded-lg'
          )}
        >
          {spinnerVisible && (
            <div className={cn('relative', compact ? 'size-9' : 'size-11')} aria-hidden>
              <div className="absolute inset-0 rounded-full border-[3px] border-line" />
              <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-accent-clay animate-listing-spin" />
              <div
                className={cn(
                  'absolute rounded-full bg-[color-mix(in_oklab,var(--color-accent-peach)_45%,white)] animate-listing-step-pulse',
                  compact ? 'inset-[0.3rem]' : 'inset-[0.35rem]'
                )}
              />
            </div>
          )}
          {title && (
            <h2 className={cn('m-0 font-display font-semibold text-ink-strong', compact ? 'text-lg' : 'text-[1.75rem]')}>
              {title}
            </h2>
          )}
          {message && <p className="m-0 max-w-md leading-relaxed text-ink-soft text-[0.92rem]">{message}</p>}
        </div>
      )}
    </div>
  )
}
