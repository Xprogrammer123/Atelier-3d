'use client'

import '@google/model-viewer'
import { useEffect, useRef, useState } from 'react'
import type { ModelViewerElement } from '@/types/model-viewer'

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
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 'inherit',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--surface-paper)',
        color: 'var(--ink-muted)',
        fontSize: '0.85rem',
      }}
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
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
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
            className="btn-accent"
            style={{
              position: 'absolute',
              bottom: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
            onClick={() => void handleActivateAR()}
          >
            View in your space
          </button>
        )}
      </model-viewer>
      {loadState === 'loading' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            background: 'var(--surface-paper)',
            color: 'var(--ink-muted)',
            fontSize: '0.85rem',
            pointerEvents: 'none',
          }}
        >
          Loading 3D model…
        </div>
      )}
      {loadState === 'error' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            background: '#fde8e4',
            color: '#8b2e1f',
            fontSize: '0.85rem',
          }}
        >
          Couldn&apos;t load model. Try again later.
        </div>
      )}
      {eagerAr && arEnabled && (
        <button
          type="button"
          className="btn-accent"
          style={{ marginTop: '0.75rem', width: '100%' }}
          onClick={() => void handleActivateAR()}
        >
          Try in Your Room
        </button>
      )}
    </div>
  )
}
