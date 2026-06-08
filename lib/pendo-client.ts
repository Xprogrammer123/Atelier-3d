import { ANONYMOUS_VISITOR_COOKIE } from '@/lib/pendo-constants'

type PendoTrackProps = Record<string, string | number | boolean | undefined>

interface PendoAgent {
  initialize: (options: unknown) => void
  identify: (options: unknown) => void
  clearSession: () => void
  pageLoad: () => void
  track: (eventName: string, properties?: PendoTrackProps) => void
}

declare global {
  interface Window {
    pendo?: PendoAgent
  }
}

function getPendo(): PendoAgent | undefined {
  if (typeof window === 'undefined') return undefined
  return window.pendo
}

export function pendoTrack(eventName: string, properties?: PendoTrackProps): void {
  getPendo()?.track(eventName, properties)
}

export function pendoInitialize(options: unknown): void {
  const pendo = getPendo()
  if (pendo) {
    pendo.initialize(options)
    return
  }

  let attempts = 0
  const timer = window.setInterval(() => {
    attempts += 1
    const agent = getPendo()
    if (agent) {
      agent.initialize(options)
      window.clearInterval(timer)
      return
    }
    if (attempts >= 10) {
      window.clearInterval(timer)
    }
  }, 50)
}

export function pendoIdentify(options: unknown): void {
  getPendo()?.identify(options)
}

export function pendoPageLoad(): void {
  getPendo()?.pageLoad()
}

export function pendoClearSession(): void {
  getPendo()?.clearSession()
}

const ANONYMOUS_VISITOR_KEY = ANONYMOUS_VISITOR_COOKIE

/** Persist anonymous id in localStorage + cookie so server routes can attribute events. */
export function syncAnonymousVisitorCookie(id: string): void {
  if (typeof document === 'undefined') return
  document.cookie = `${ANONYMOUS_VISITOR_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=31536000; SameSite=Lax`
}

/** Stable anonymous ID for buyer sessions before login (no PII). */
export function getAnonymousVisitorId(): string {
  if (typeof window === 'undefined') return 'anonymous'

  try {
    let id = localStorage.getItem(ANONYMOUS_VISITOR_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(ANONYMOUS_VISITOR_KEY, id)
    }
    syncAnonymousVisitorCookie(id)
    return id
  } catch {
    const id = crypto.randomUUID()
    syncAnonymousVisitorCookie(id)
    return id
  }
}
