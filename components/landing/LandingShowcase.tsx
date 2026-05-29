'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const ProductModelViewer = dynamic(
  () => import('@/components/ProductModelViewer').then((m) => m.ProductModelViewer),
  { ssr: false }
)

const PIECES = [
  {
    id: 'chair',
    src: '/models/chair.glb',
    alt: 'Sheen accent chair',
    label: 'Seating',
    name: 'Sheen Chair',
    orbit: '32deg 76deg auto',
  },
  {
    id: 'lamp',
    src: '/models/floor-lamp.glb',
    alt: 'Iridescence floor lamp',
    label: 'Lighting',
    name: 'Iridescence Lamp',
    orbit: '12deg 74deg auto',
  },
  {
    id: 'table',
    src: '/models/side-table.glb',
    alt: 'Side table',
    label: 'Surfaces',
    name: 'Side Table',
    orbit: '-18deg 70deg auto',
  },
] as const

export function LandingShowcase() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="landing-showcase">
      {PIECES.map((piece, i) => (
        <article
          key={piece.id}
          className="landing-showcase__card"
          style={{ ['--delay' as string]: `${i * 120}ms` }}
        >
          <div className="landing-showcase__viewer">
            {mounted ? (
              <ProductModelViewer
                src={piece.src}
                alt={piece.alt}
                loading="lazy"
                autoRotate
                cameraOrbit={piece.orbit}
              />
            ) : (
              <div className="landing-showcase__placeholder" />
            )}
          </div>
          <div className="landing-showcase__meta">
            <span className="landing-showcase__label">{piece.label}</span>
            <span className="landing-showcase__name">{piece.name}</span>
          </div>
        </article>
      ))}
    </div>
  )
}
