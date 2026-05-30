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
    <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
      {PIECES.map((piece, i) => (
        <article
          key={piece.id}
          className="flex flex-col bg-white border border-l-line overflow-hidden animate-landing-fade-up transition-[transform,box-shadow] duration-350 hover:-translate-y-1.5 hover:shadow-l-landing"
          style={{ animationDelay: `${i * 120}ms` }}
        >
          <div className="aspect-[4/5] bg-gradient-to-b from-l-paper to-l-warm">
            {mounted ? (
              <ProductModelViewer
                src={piece.src}
                alt={piece.alt}
                loading="lazy"
                autoRotate
                cameraOrbit={piece.orbit}
              />
            ) : (
              <div className="w-full h-full bg-l-warm" />
            )}
          </div>
          <div className="px-5 pt-[1.1rem] pb-5 flex flex-col gap-[0.2rem]">
            <span className="text-[0.62rem] font-semibold tracking-[0.22em] uppercase text-l-clay">
              {piece.label}
            </span>
            <span className="font-display text-[1.35rem] font-semibold">{piece.name}</span>
          </div>
        </article>
      ))}
    </div>
  )
}
