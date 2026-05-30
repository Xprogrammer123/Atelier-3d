'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/cn'

const ProductModelViewer = dynamic(
  () => import('@/components/ProductModelViewer').then((m) => m.ProductModelViewer),
  { ssr: false }
)

export function LandingHeroVisual() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="relative min-h-[420px] lg:min-h-[560px]" aria-hidden>
      <div className="relative ml-auto w-full max-w-[420px] aspect-[3/4] p-6 bg-l-warm shadow-l-landing">
        <div className="pointer-events-none absolute -top-2 -right-2 bottom-2 left-2 border border-l-line" />
        <div className="w-full h-full bg-gradient-to-br from-white to-[#ebe4da] overflow-hidden">
          {mounted ? (
            <ProductModelViewer
              src="/models/chair.glb"
              alt="Accent chair in 3D preview"
              loading="eager"
              autoRotate
              cameraOrbit="32deg 76deg auto"
            />
          ) : (
            <div className="w-full h-full min-h-[300px] bg-l-warm animate-landing-pulse" />
          )}
        </div>
        <div className="absolute bottom-2 left-6 right-6 flex justify-between text-[0.6rem] font-semibold tracking-[0.2em] uppercase text-l-ink-soft">
          <span>Live preview</span>
          <span>True scale</span>
        </div>
      </div>
      <div
        className={cn(
          'absolute flex gap-3 items-start p-[0.85rem] px-4 bg-white border border-l-line shadow-[0_12px_32px_rgba(31,24,18,0.08)] max-w-[200px] animate-landing-float',
          'top-[8%] -left-[4%] max-lg:left-0'
        )}
      >
        <span className="text-base text-l-clay opacity-80">◇</span>
        <div>
          <strong className="block text-[0.78rem] font-semibold tracking-wide mb-[0.15rem]">
            Try in your room
          </strong>
          <p className="m-0 text-[0.68rem] text-l-ink-soft leading-snug">WebXR · Scene Viewer · Quick Look</p>
        </div>
      </div>
      <div
        className={cn(
          'absolute flex gap-3 items-start p-[0.85rem] px-4 bg-white border border-l-line shadow-[0_12px_32px_rgba(31,24,18,0.08)] max-w-[200px] animate-landing-float [animation-delay:1.2s]',
          'bottom-[12%] -right-[2%] max-lg:right-0'
        )}
      >
        <span className="text-base text-l-clay opacity-80">▣</span>
        <div>
          <strong className="block text-[0.78rem] font-semibold tracking-wide mb-[0.15rem]">Seller QR</strong>
          <p className="m-0 text-[0.68rem] text-l-ink-soft leading-snug">Scan → instant AR</p>
        </div>
      </div>
    </div>
  )
}
