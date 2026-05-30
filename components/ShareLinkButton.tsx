'use client'

import { useState } from 'react'
import { btnSecondary } from '@/lib/ui'

type Props = {
  url: string
  label?: string
}

export function ShareLinkButton({ url, label = 'Copy AR link' }: Props) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      if (typeof pendo !== 'undefined') {
        pendo.track('product_link_shared', {
          url,
          link_type: url.includes('/ar/') ? 'ar' : 'product',
        })
      }
    } catch {
      /* fallback */
    }
  }

  return (
    <button type="button" className={btnSecondary} onClick={() => void copy()}>
      {copied ? 'Copied!' : label}
    </button>
  )
}
