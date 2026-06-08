'use client'

import '@google/model-viewer'
import { useEffect, useRef, useState } from 'react'
import type { ModelViewerElement } from '@/types/model-viewer'
import { pendoTrack } from '@/lib/pendo-client'
import { btnAccent } from '@/lib/ui'
import { cn } from '@/lib/cn'

type Props = {
  src: string
  alt: string
  poster?: string
  loading?: 'lazy' | 'eager'
  autoRotate?: boolean
  ar?: boolean
  eagerAr?: boolean
  className?: string
  cameraOrbit?: string
  showArButton?: boolean
  onArLaunch?: () => void
}

function ViewerSkeleton({ className }: { className: string }) {
  return (
    <div
      className={cn(
        'relative w-full h-full min-h-[inherit] grid place-items-center bg-surface-paper text-ink-muted text-[0.85rem]',
        className
      )}
      aria-hidden
    >
      Loading 3D preview…
    </div>
  )
}

export function ProductModelViewer({
  src,
  alt,
  poster,
  loading = 'lazy',
  autoRotate = true,
  ar = false,
  eagerAr = false,
  className = '',
  cameraOrbit = '30deg 75deg auto',
  showArButton = false,
  onArLaunch,
}: Props) {
  const viewerRef = useRef<ModelViewerElement | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    setIsDesktop(!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const el = viewerRef.current
    if (!el) return
    const onLoad = () => setLoadState('ready')
    const onError = () => setLoadState('error')
    el.addEventListener('load', onLoad)
    el.addEventListener('error', onError)
    return () => {
      el.removeEventListener('load', onLoad)
      el.removeEventListener('error', onError)
    }
  }, [src, mounted])

  async function handleActivateAR() {
    onArLaunch?.()
    const nativeAr = ar && !isDesktop
    pendoTrack('ar_viewer_activated', {
      listing_id: src,
      ar_mode: nativeAr ? 'native' : 'desktop_fallback',
      device_type: isDesktop ? 'desktop' : 'mobile',
    })
    try {
      await viewerRef.current?.activateAR()
    } catch {
      /* model-viewer handles fallback */
    }
  }

  if (!mounted) {
    return <ViewerSkeleton className={className} />
  }

  const arEnabled = ar && !isDesktop

  return (
    <div className={cn('relative w-full h-full', className)}>
      <model-viewer
        ref={viewerRef as React.RefObject<HTMLElement>}
        src={src}
        alt={alt}
        poster={poster}
        loading={loading}
        ar={arEnabled}
        ar-modes="webxr scene-viewer quick-look"
        ar-placement="floor"
        ar-scale="fixed"
        camera-controls
        auto-rotate={autoRotate}
        touch-action="pan-y"
        shadow-intensity="0.9"
        exposure="1.05"
        camera-orbit={cameraOrbit}
        interaction-prompt="none"
        style={{ width: '100%', height: '100%', minHeight: 'inherit' }}
      >
        {showArButton && arEnabled && (
          <button
            slot="ar-button"
            type="button"
            className={cn(btnAccent, 'absolute bottom-4 left-1/2 -translate-x-1/2')}
            onClick={() => void handleActivateAR()}
          >
            View in your space
          </button>
        )}
      </model-viewer>
      {loadState === 'loading' && (
        <div className="absolute inset-0 grid place-items-center bg-surface-paper text-ink-muted text-[0.85rem] pointer-events-none">
          Loading 3D model…
        </div>
      )}
      {loadState === 'error' && (
        <div className="absolute inset-0 grid place-items-center bg-[#fde8e4] text-[#8b2e1f] text-[0.85rem]">
          Couldn&apos;t load model. Try again later.
        </div>
      )}
      {eagerAr && arEnabled && (
        <button id="btn-activate-ar" type="button" className={cn(btnAccent, 'mt-3 w-full')} onClick={() => void handleActivateAR()}>
          Try in Your Room
        </button>
      )}
    </div>
  )
}
