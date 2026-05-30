'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'atelier-arcore-banner-dismissed'
const PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.google.ar.core'

export function ArCoreBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(STORAGE_KEY)) return
    const isAndroid = /Android/i.test(navigator.userAgent)
    if (!isAndroid) return

    const xr = (navigator as Navigator & { xr?: XRSystem }).xr
    if (!xr?.isSessionSupported) return

    void xr.isSessionSupported('immersive-ar').then((supported) => {
      if (!supported) setVisible(true)
    })
  }, [])

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="flex items-center justify-between gap-2 px-[0.9rem] py-[0.6rem] rounded-sm text-[0.8rem] bg-[rgba(15,15,15,0.6)] border border-white/12"
      role="status"
    >
      <span>For the best in-browser AR, install Google AR Services (free).</span>
      <a
        href={PLAY_STORE}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent-clay-soft font-semibold whitespace-nowrap"
      >
        Install
      </a>
      <button
        type="button"
        className="bg-transparent border-0 text-white/60 text-xl px-1"
        onClick={dismiss}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
