'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const ProductModelViewer = dynamic(
  () => import('@/components/ProductModelViewer').then((m) => m.ProductModelViewer),
  { ssr: false }
)

export function LandingHeroVisual() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <div className="landing-hero__frame" aria-hidden>
      <div className="landing-hero__frame-inner">
        {mounted ? (
          <ProductModelViewer
            src="/models/chair.glb"
            alt="Accent chair rotating in preview"
            loading="eager"
            autoRotate
            cameraOrbit="32deg 76deg auto"
          />
        ) : (
          <div className="landing-hero__frame-placeholder" />
        )}
      </div>
      <span className="landing-hero__tag">Live 3D preview</span>
    </div>
  )
}
