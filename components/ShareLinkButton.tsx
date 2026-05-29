'use client'

import { useState } from 'react'

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
    } catch {
      /* fallback */
    }
  }

  return (
    <button type="button" className="btn-secondary" onClick={() => void copy()}>
      {copied ? 'Copied!' : label}
    </button>
  )
}
