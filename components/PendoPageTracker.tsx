'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { pendoPageLoad } from '@/lib/pendo-client'

/** Fires Pendo pageLoad on client navigations (Next.js App Router). */
export function PendoPageTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    pendoPageLoad()
  }, [pathname, searchParams])

  return null
}
