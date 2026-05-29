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
    <div className="landing-hero__visual" aria-hidden>
      <div className="landing-hero__frame">
        <div className="landing-hero__frame-border" />
        <div className="landing-hero__frame-inner">
          {mounted ? (
            <ProductModelViewer
              src="/models/chair.glb"
              alt="Accent chair in 3D preview"
              loading="eager"
              autoRotate
              cameraOrbit="32deg 76deg auto"
            />
          ) : (
            <div className="landing-hero__frame-placeholder" />
          )}
        </div>
        <div className="landing-hero__frame-caption">
          <span>Live preview</span>
          <span>True scale</span>
        </div>
      </div>
      <div className="landing-hero__float-card landing-hero__float-card--ar">
        <span className="landing-hero__float-icon">◇</span>
        <div>
          <strong>Try in your room</strong>
          <p>WebXR · Scene Viewer · Quick Look</p>
        </div>
      </div>
      <div className="landing-hero__float-card landing-hero__float-card--qr">
        <span className="landing-hero__float-icon">▣</span>
        <div>
          <strong>Seller QR</strong>
          <p>Scan → instant AR</p>
        </div>
      </div>
    </div>
  )
}
